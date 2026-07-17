'use client'

import { useCallback, useEffect, useRef } from 'react'

import { reportViolation } from '@/lib/actions/anti-cheat.action'
import { sendHeartbeat } from '@/lib/actions/heartbeat.action'
import {
  resolveMaxViolations,
  VIOLATION_LABELS,
  ViolationType
} from '@/lib/constants/violation'
import { runIntegrityCanary } from '@/lib/utils'
import {
  addViolation,
  markViolationSynced,
  setForceSubmitted,
  setTotalViolations,
  setBlurred,
  setFullscreen,
  showWarning
} from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'

import { ExamSettings } from '@/lib/types'

interface UseAntiCheatOptions {
  examId: number
  enabled?: boolean
  settings?: ExamSettings
}

export function useAntiCheat({
  examId,
  enabled = true,
  settings
}: UseAntiCheatOptions) {
  const antiCheatEnabled = enabled
  const violationLimit = resolveMaxViolations(settings?.maxViolations)

  const dispatch = useAppDispatch()
  const { totalViolations, isFullscreen } = useAppSelector(
    (state) => state.antiCheat
  )

  // Use refs to keep stable callback references and avoid re-registering event listeners
  const totalRef = useRef(totalViolations)
  totalRef.current = totalViolations

  const isFullscreenRef = useRef(isFullscreen)
  isFullscreenRef.current = isFullscreen

  const devtoolsCheckRef = useRef<NodeJS.Timeout | null>(null)
  const devtoolsDetectedRef = useRef(false) // Prevent spam when DevTools stays open
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Debounce blur/visibility events

  const lastViolationTimeRef = useRef(0)

  // Monotonic heartbeat sequence — a ref so it survives effect re-runs (not reset to 1),
  // otherwise the server would read a regressed seq as a replay and false-flag tampering.
  const heartbeatSeqRef = useRef(0)

  // Record violation — stable callback (does not depend on totalViolations)
  const recordViolation = useCallback(
    async (type: ViolationType, detail?: string) => {
      if (!antiCheatEnabled) return
      const now = Date.now()
      // Rate limiting: Prevent spamming violations if events fire wildly (e.g. 50 times/sec)
      if (now - lastViolationTimeRef.current < 2000) {
        console.warn(`[AntiCheat] Throttled violation: ${type}`)
        return
      }
      lastViolationTimeRef.current = now

      console.warn(`[AntiCheat] Violation recorded: ${type}`, detail)

      const timestamp = new Date().toISOString()
      const violationDetail = detail || VIOLATION_LABELS[type]

      dispatch(
        addViolation({
          type,
          detail: violationDetail,
          timestamp,
          maxViolations: violationLimit
        })
      )

      // Send to backend
      try {
        const result = await reportViolation(examId, {
          violationType: type,
          description: violationDetail
        })
        if (result.data) {
          dispatch(markViolationSynced(result.data.violationId.toString()))

          const count = result.data.violationCount

          // Sync local state count with backend (which tracks it per attempt)
          dispatch(setTotalViolations(count))

          // Backend already auto-submitted — only show modal, DO NOT trigger FE submit
          if (result.data.autoSubmitted) {
            dispatch(setForceSubmitted(true))
            dispatch(
              showWarning(
                `Bạn đã vi phạm ${count}/${violationLimit} lần. Bài thi đã được nộp tự động!`
              )
            )
            // Do not call onForceSubmit — backend already handled it
            return
          }

          // Show warning immediately after each violation (using count from backend)
          if (settings?.autoSubmitOnViolation) {
            dispatch(
              showWarning(
                `Cảnh báo vi phạm! Bạn đã vi phạm ${count}/${violationLimit} lần. Sau ${violationLimit} lần bài thi sẽ bị nộp tự động.`
              )
            )
          } else {
            dispatch(
              showWarning(
                `Cảnh báo vi phạm! Hành vi gian lận (chuyển tab, thoát toàn màn hình, v.v) đã bị hệ thống ghi nhận lần thứ ${count}.`
              )
            )
          }
        } else {
          console.error('[AntiCheat] Backend did not return violation data')
        }
      } catch (err) {
        console.error('[AntiCheat] Failed to sync violation to backend', err)
        // Sync failed — still show warning based on local FE count
        const newTotal = totalRef.current
        if (settings?.autoSubmitOnViolation) {
          dispatch(
            showWarning(
              `Cảnh báo vi phạm! Bạn đã vi phạm ${newTotal}/${violationLimit} lần. Sau ${violationLimit} lần bài thi sẽ bị nộp tự động.`
            )
          )
        } else {
          dispatch(
            showWarning(
              `Cảnh báo vi phạm! Hệ thống ghi nhận bạn đã vi phạm ${newTotal} lần.`
            )
          )
        }
      }
    },
    [
      dispatch,
      examId,
      antiCheatEnabled,
      settings?.autoSubmitOnViolation,
      violationLimit
    ] // Stable deps — no totalViolations
  )

  // 1. Detect tab switch / browser minimize (debounced — prevent duplicates)
  useEffect(() => {
    if (!antiCheatEnabled || settings?.trackTabSwitch === false) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Only trigger blur violation if the document is genuinely hidden (vs just losing focus to an alert/iframe)
        // Debounce: if blur already fired before this, skip it
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current)
          blurTimeoutRef.current = null
        }
        recordViolation(ViolationType.TAB_SWITCH)
        dispatch(setBlurred(true))
      } else {
        dispatch(setBlurred(false))
      }
    }

    const handleBlur = () => {
      // Debounce: wait 500ms — if visibilitychange fires first, skip blur
      blurTimeoutRef.current = setTimeout(() => {
        // Ensure that the document actually lost focus, not just active element changing to something internal
        if (!document.hasFocus() && !document.hidden) {
          // Only record if visibilitychange hasn't already recorded
          recordViolation(ViolationType.TAB_SWITCH, 'Browser window lost focus')
          dispatch(setBlurred(true))
        }
        blurTimeoutRef.current = null
      }, 500) // Increase debounce to 500ms to allow internal popups (like Monaco completion) without false positives
    }

    const handleFocus = () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
        blurTimeoutRef.current = null
      }
      dispatch(setBlurred(false))
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [antiCheatEnabled, recordViolation, dispatch, settings?.trackTabSwitch])

  // 2. Detect fullscreen exit
  useEffect(() => {
    if (!antiCheatEnabled || settings?.forceFullscreen === false) return

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      dispatch(setFullscreen(isCurrentlyFullscreen))

      if (!isCurrentlyFullscreen && isFullscreenRef.current) {
        recordViolation(ViolationType.FULLSCREEN_EXIT)
        dispatch(setBlurred(true))
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [antiCheatEnabled, recordViolation, dispatch])

  // 3. Block Copy / Cut / Paste / Right Click (block only — NOT counted as violation)
  useEffect(() => {
    if (!antiCheatEnabled || settings?.preventCopyPaste === false) return

    // Check if the target is an input field or Monaco editor
    const isEditingField = (target: EventTarget | null) => {
      if (!target) return false
      const el = target as HTMLElement
      // Monaco Editor uses textareas with class 'inputarea'
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable ||
        el.classList.contains('inputarea')
      )
    }

    const handleCopy = (e: ClipboardEvent) => {
      if (isEditingField(e.target)) return
      e.preventDefault()
      // Blocked — not counted as violation
    }

    const handleCut = (e: ClipboardEvent) => {
      if (isEditingField(e.target)) return
      e.preventDefault()
    }

    const handlePaste = (e: ClipboardEvent) => {
      if (isEditingField(e.target)) return
      e.preventDefault()
    }

    const handleContextMenu = (e: MouseEvent) => {
      if (isEditingField(e.target)) return
      e.preventDefault()
    }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('cut', handleCut)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('cut', handleCut)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [antiCheatEnabled, settings?.preventCopyPaste])

  // 4. Block dangerous keyboard shortcuts
  useEffect(() => {
    if (!antiCheatEnabled || settings?.preventCopyPaste === false) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditingField = (target: EventTarget | null) => {
        if (!target) return false
        const el = target as HTMLElement
        return (
          el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable ||
          el.classList.contains('inputarea')
        )
      }

      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey

      // Shortcuts to block only (not counted as violation)
      // Includes: copy/paste/cut/select-all, DevTools shortcuts, save, print, view-source
      // and Alt/F-key combos that may be pressed accidentally
      const blockOnlyCombos: {
        key: string
        ctrl: boolean
        shift?: boolean
        alt?: boolean
        fn?: boolean
      }[] = [
        // Copy / Cut / Paste / Select-all
        { key: 'c', ctrl: true },
        { key: 'v', ctrl: true },
        { key: 'x', ctrl: true },
        { key: 'a', ctrl: true },
        // DevTools
        { key: 'F12', ctrl: false },
        { key: 'i', ctrl: true, shift: true },
        { key: 'j', ctrl: true, shift: true },
        { key: 'c', ctrl: true, shift: true },
        // Save / Print / View-source
        { key: 's', ctrl: true },
        { key: 'p', ctrl: true },
        { key: 'u', ctrl: true },
        // Function keys that may be accidentally pressed
        { key: 'F1', ctrl: false },
        { key: 'F3', ctrl: false },
        { key: 'F4', ctrl: false },
        { key: 'F5', ctrl: false },
        { key: 'F6', ctrl: false },
        { key: 'F7', ctrl: false },
        { key: 'F8', ctrl: false },
        { key: 'F9', ctrl: false },
        { key: 'F10', ctrl: false },
        { key: 'F11', ctrl: false },
        // Alt key combinations (accidental press)
        { key: 'Alt', ctrl: false }
      ]

      // Check block-only combos (including standalone Alt key)
      // Special handling for standalone Alt key
      if (e.key === 'Alt' || e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      for (const combo of blockOnlyCombos) {
        const keyMatch =
          e.key === combo.key || e.key.toLowerCase() === combo.key.toLowerCase()
        const ctrlMatch = combo.ctrl ? ctrlOrCmd : true
        const shiftMatch = combo.shift ? e.shiftKey : !combo.shift || true

        if (keyMatch && ctrlMatch && shiftMatch) {
          // Allow copy/paste/cut/select-all inside editor
          const copyPasteKeys = ['c', 'v', 'x', 'a']
          if (
            copyPasteKeys.includes(combo.key.toLowerCase()) &&
            combo.ctrl &&
            isEditingField(e.target)
          )
            return
          e.preventDefault()
          e.stopPropagation()
          // Block only — not counted as violation
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [antiCheatEnabled, recordViolation])

  // 5. Detect DevTools (heuristic — record only once until closed)
  useEffect(() => {
    if (!antiCheatEnabled) return

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160
      const heightThreshold = window.outerHeight - window.innerHeight > 160
      const isOpen = widthThreshold || heightThreshold

      if (isOpen && !devtoolsDetectedRef.current) {
        devtoolsDetectedRef.current = true
        recordViolation(ViolationType.DEVTOOLS_OPEN)
      } else if (!isOpen) {
        devtoolsDetectedRef.current = false // Reset when DevTools is closed
      }
    }

    devtoolsCheckRef.current = setInterval(checkDevTools, 3000)

    return () => {
      if (devtoolsCheckRef.current) {
        clearInterval(devtoolsCheckRef.current)
      }
    }
  }, [antiCheatEnabled, recordViolation])

  const isBypassedRef = useRef(false)

  // 6. Prevent leaving page during active exam
  useEffect(() => {
    if (!enabled) return

    // Standard beforeunload for refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isBypassedRef.current) return

      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    console.log('[AntiCheat] Registering beforeunload guard')
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      console.log('[AntiCheat] Cleaning up beforeunload guard')
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled])

  // 7. Heartbeat loop + integrity canary (Tier 2 anti-tamper).
  //    Heartbeats let the server detect tampering: a stopped stream (killed scripts)
  //    or integrityOk=false trigger INTEGRITY_TAMPERED server-side.
  useEffect(() => {
    if (!antiCheatEnabled || settings?.integrityCheckEnabled === false) return

    const intervalSec = settings?.heartbeatIntervalSec ?? 8

    const tick = () => {
      const failedChecks = runIntegrityCanary()
      sendHeartbeat(examId, {
        seq: ++heartbeatSeqRef.current,
        clientTs: Date.now(),
        integrityOk: failedChecks.length === 0,
        failedChecks
      }).catch((error) => {
        // Network failure must not break the exam — server absence-detection is the backstop.
        console.warn('[AntiCheat] Heartbeat failed', error)
      })
    }

    tick() // send immediately so the server starts tracking without a full interval delay
    const timer = setInterval(tick, intervalSec * 1000)

    return () => clearInterval(timer)
  }, [
    antiCheatEnabled,
    examId,
    settings?.integrityCheckEnabled,
    settings?.heartbeatIntervalSec
  ])

  const bypassAntiCheat = useCallback(() => {
    isBypassedRef.current = true
  }, [])

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    if (!antiCheatEnabled || settings?.forceFullscreen === false) return
    try {
      await document.documentElement.requestFullscreen()
      dispatch(setFullscreen(true))
    } catch {
      console.warn('[AntiCheat] Fullscreen request denied')
    }
  }, [dispatch, antiCheatEnabled, settings?.forceFullscreen])

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    if (!antiCheatEnabled) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      dispatch(setFullscreen(false))
    } catch {
      console.warn('[AntiCheat] Exit fullscreen failed')
    }
  }, [dispatch, antiCheatEnabled])

  return {
    recordViolation,
    requestFullscreen,
    exitFullscreen,
    totalViolations,
    isFullscreen,
    bypassAntiCheat
  }
}
