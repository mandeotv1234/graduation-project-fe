'use client'

import { useCallback, useEffect, useRef } from 'react'

import { reportViolation } from '@/lib/actions/anti-cheat.action'
import {
  MAX_VIOLATIONS_BEFORE_SUBMIT,
  VIOLATION_LABELS,
  ViolationType
} from '@/lib/constants/violation'
import {
  addViolation,
  markViolationSynced,
  setBlurred,
  setFullscreen,
  showWarning
} from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'

interface UseAntiCheatOptions {
  examId: number
  enabled?: boolean
}

export function useAntiCheat({ examId, enabled = true }: UseAntiCheatOptions) {
  const dispatch = useAppDispatch()
  const { totalViolations, isFullscreen } = useAppSelector(
    (state) => state.antiCheat
  )

  // Dùng refs để tránh re-create callback → tránh re-register event listeners
  const totalRef = useRef(totalViolations)
  totalRef.current = totalViolations

  const isFullscreenRef = useRef(isFullscreen)
  isFullscreenRef.current = isFullscreen

  const devtoolsCheckRef = useRef<NodeJS.Timeout | null>(null)
  const devtoolsDetectedRef = useRef(false) // Tránh spam khi DevTools luôn mở
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Debounce blur/visibility

  const lastViolationTimeRef = useRef(0)

  // Record violation — stable callback (không phụ thuộc totalViolations)
  const recordViolation = useCallback(
    async (type: ViolationType, detail?: string) => {
      const now = Date.now()
      // Rate limiting: Prevent spamming violations if events fire wildly (e.g. 50 times/sec)
      if (now - lastViolationTimeRef.current < 2000) {
        console.warn(`[AntiCheat] Throttled violation: ${type}`)
        return
      }
      lastViolationTimeRef.current = now

      console.warn(`[AntiCheat] Ghi nhận vi phạm: ${type}`, detail)

      const timestamp = new Date().toISOString()
      const violationDetail = detail || VIOLATION_LABELS[type]

      dispatch(addViolation({ type, detail: violationDetail, timestamp }))

      // Gửi lên Backend
      try {
        const result = await reportViolation(examId, {
          violationType: type,
          description: violationDetail
        })
        if (result.data) {
          dispatch(markViolationSynced(result.data.violationId.toString()))

          const count = result.data.violationCount

          // BE đã tự submit rồi → chỉ hiển thị modal, KHÔNG gọi FE submit
          if (result.data.autoSubmitted) {
            dispatch(
              showWarning(
                `Bạn đã vi phạm ${count}/${MAX_VIOLATIONS_BEFORE_SUBMIT} lần. Bài thi đã được nộp tự động!`
              )
            )
            // Không gọi onForceSubmit — BE đã xử lý rồi
            return
          }

          // Hiển thị warning ngay lập tức sau mỗi vi phạm (dùng count từ BE)
          dispatch(
            showWarning(
              `Cảnh báo vi phạm! Bạn đã vi phạm ${count}/${MAX_VIOLATIONS_BEFORE_SUBMIT} lần. Sau ${MAX_VIOLATIONS_BEFORE_SUBMIT} lần bài thi sẽ bị nộp tự động.`
            )
          )
        } else {
          console.error('[AntiCheat] Backend did not return violation data')
        }
      } catch (err) {
        console.error('[AntiCheat] Failed to sync violation to backend', err)
        // Sync thất bại — vẫn hiện warning dựa trên FE count
        const newTotal = totalRef.current
        dispatch(
          showWarning(
            `Cảnh báo vi phạm! Bạn đã vi phạm ${newTotal} lần. Sau ${MAX_VIOLATIONS_BEFORE_SUBMIT} lần bài thi sẽ bị nộp tự động.`
          )
        )
      }
    },
    [dispatch, examId] // Stable deps — không có totalViolations
  )

  // 1. Phát hiện chuyển tab / thu nhỏ trình duyệt (debounced — tránh duplicate)
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Only trigger blur violation if the document is genuinely hidden (vs just losing focus to an alert/iframe)
        // Debounce: nếu blur đã fire trước đó, skip
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
      // Debounce: đợi 200ms, nếu visibilitychange fire trước thì skip blur
      blurTimeoutRef.current = setTimeout(() => {
        // Ensure that the document actually lost focus, not just active element changing to something internal
        if (!document.hasFocus() && !document.hidden) {
          // Chỉ ghi nếu visibilitychange chưa ghi
          recordViolation(
            ViolationType.TAB_SWITCH,
            'Cửa sổ trình duyệt mất focus'
          )
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
  }, [enabled, recordViolation, dispatch])

  // 2. Phát hiện thoát fullscreen
  useEffect(() => {
    if (!enabled) return

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
  }, [enabled, recordViolation, dispatch])

  // 3. Chặn Copy / Cut / Paste / Right Click (chặn nhưng KHÔNG tính vi phạm)
  useEffect(() => {
    if (!enabled) return

    // Hàm kiểm tra xem target có phải là input field hoặc monaco editor không
    const isEditingField = (target: EventTarget | null) => {
      if (!target) return false
      const el = target as HTMLElement
      // Monaco Editor sử dụng textareas với class inputarea
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
      // Đã chặn rồi — không tính vi phạm
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
  }, [enabled])

  // 4. Chặn phím tắt nguy hiểm
  useEffect(() => {
    if (!enabled) return

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

      // Phím tắt chỉ chặn (không tính vi phạm)
      // Bao gồm: copy/paste/cut/select-all, DevTools shortcuts, save, print, view-source
      // và các phím Alt/F-key có thể vô tình nhấn
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
        // Alt key combinations (vô tình nhấn)
        { key: 'Alt', ctrl: false }
      ]

      // Check block-only combos (bao gồm Alt key)
      // Xử lý đặc biệt cho phím Alt độc lập
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
          // Chỉ chặn — không tính vi phạm
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [enabled, recordViolation])

  // 5. Phát hiện DevTools (heuristic — chỉ ghi 1 lần cho đến khi đóng)
  useEffect(() => {
    if (!enabled) return

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160
      const heightThreshold = window.outerHeight - window.innerHeight > 160
      const isOpen = widthThreshold || heightThreshold

      if (isOpen && !devtoolsDetectedRef.current) {
        devtoolsDetectedRef.current = true
        recordViolation(ViolationType.DEVTOOLS_OPEN)
      } else if (!isOpen) {
        devtoolsDetectedRef.current = false // Reset khi đóng DevTools
      }
    }

    devtoolsCheckRef.current = setInterval(checkDevTools, 3000)

    return () => {
      if (devtoolsCheckRef.current) {
        clearInterval(devtoolsCheckRef.current)
      }
    }
  }, [enabled, recordViolation])

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      dispatch(setFullscreen(true))
    } catch {
      console.warn('[AntiCheat] Fullscreen request denied')
    }
  }, [dispatch])

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      dispatch(setFullscreen(false))
    } catch {
      console.warn('[AntiCheat] Exit fullscreen failed')
    }
  }, [dispatch])

  return {
    recordViolation,
    requestFullscreen,
    exitFullscreen,
    totalViolations,
    isFullscreen
  }
}
