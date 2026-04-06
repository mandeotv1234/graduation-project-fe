/**
 * useExamDraft — 3-Layer Persistence Strategy
 *
 * Layer 1: localStorage — instant, survives F5/browser crash
 * Layer 2: Server auto-save  — every 30s debounced, survives machine crash / device switch
 * Layer 3: Manual "Save" button  — explicit save on demand
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { saveExamDraft, getExamDraft } from '@/lib/actions'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

const LOCAL_KEY = (examId: number) => `exam_draft_${examId}`
const AUTO_SAVE_INTERVAL_MS = 30_000 // 30 seconds
const DEBOUNCE_MS = 3_000 // 3 seconds after last keystroke

export function useExamDraft(
  examId: number,
  answers: Record<number, string>,
  enabled: boolean
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [restoredFromLocal, setRestoredFromLocal] = useState(false)
  const [isServerReachable, setIsServerReachable] = useState(true)

  const isSavingRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const answersRef = useRef(answers)

  // ── HEARTBEAT: Ping every 20s for real connectivity ────────────────
  const checkHeartbeat = useCallback(async () => {
    if (!enabled) return
    try {
      // Small heartbeat call to verify connectivity
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

      await getExamDraft(examId)
      clearTimeout(timeoutId)

      setIsServerReachable(true)
      if (saveStatus === 'offline') setSaveStatus('idle')
    } catch {
      setIsServerReachable(false)
      setSaveStatus('offline')
    }
  }, [examId, enabled, saveStatus])

  // Keep answersRef current without triggering effects
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // ── LAYER 1: Save to localStorage ──────────────────────────────────
  const saveToLocal = useCallback(() => {
    try {
      const payload = {
        answers: answersRef.current,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(LOCAL_KEY(examId), JSON.stringify(payload))
    } catch {
      // Storage might be full — silently ignore
    }
  }, [examId])

  // ── LAYER 2 + 3: Save to server ────────────────────────────────────
  const saveToServer = useCallback(
    async (silent = false) => {
      if (isSavingRef.current) return
      isSavingRef.current = true

      if (!silent) setSaveStatus('saving')

      try {
        const answersList = Object.entries(answersRef.current).map(
          ([questionId, content]) => ({
            questionId: Number(questionId),
            content
          })
        )

        await saveExamDraft(examId, {
          answers: answersList,
          clientTimestamp: new Date().toISOString()
        })

        const now = new Date()
        setLastSavedAt(now)
        setSaveStatus('saved')
        setIsServerReachable(true)

        // Also save to local to keep in sync
        saveToLocal()

        // Reset status to 'idle' after 3s
        setTimeout(() => setSaveStatus('idle'), 3000)
      } catch (err: unknown) {
        const error = err as { message?: string; code?: string }
        // DETECT NETWORK ERROR
        const isNetworkErr =
          error?.message?.toLowerCase().includes('network error') ||
          (error?.code === 'INTERNAL_SERVER_ERROR' && !navigator.onLine)

        if (isNetworkErr || navigator.onLine === false) {
          setSaveStatus('offline')
          setIsServerReachable(false)
        } else {
          setSaveStatus('error')
        }
        // Still save to local as fallback
        saveToLocal()
      } finally {
        isSavingRef.current = false
      }
    },
    [examId, saveToLocal]
  )

  // Debounced local save — triggers after 3s of no typing
  const triggerDebouncedLocalSave = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      saveToLocal()
    }, DEBOUNCE_MS)
  }, [saveToLocal])

  // Wire up local debounce whenever answers change
  useEffect(() => {
    if (!enabled) return
    triggerDebouncedLocalSave()
  }, [answers, enabled, triggerDebouncedLocalSave])

  // Auto-save to server (every 30s) and Heartbeat (every 20s)
  useEffect(() => {
    if (!enabled) return

    autoSaveIntervalRef.current = setInterval(() => {
      saveToServer(true)
    }, AUTO_SAVE_INTERVAL_MS)

    heartbeatIntervalRef.current = setInterval(() => {
      checkHeartbeat()
    }, 20_000)

    return () => {
      if (autoSaveIntervalRef.current)
        clearInterval(autoSaveIntervalRef.current)
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current)
    }
  }, [enabled, saveToServer, checkHeartbeat])

  // Detect online/offline status via native events
  useEffect(() => {
    const goOnline = () => {
      checkHeartbeat() // Immediately check if real internet is back
    }
    const goOffline = () => {
      setIsServerReachable(false)
      setSaveStatus('offline')
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [checkHeartbeat])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (autoSaveIntervalRef.current)
        clearInterval(autoSaveIntervalRef.current)
    }
  }, [])

  // ── RESTORE: check server draft first, then localStorage fallback ───
  const getRestoredAnswers = useCallback(async (): Promise<Record<
    number,
    string
  > | null> => {
    // Try server draft first
    try {
      const res = await getExamDraft(examId)
      if (res.data && res.data.answers) {
        const serverAnswers: Record<number, string> = {}
        for (const [k, v] of Object.entries(res.data.answers)) {
          serverAnswers[Number(k)] = v as string
        }
        const hasContent = Object.values(serverAnswers).some(
          (v) => v && v.trim().length > 0
        )
        if (hasContent) {
          setRestoredFromLocal(true)
          return serverAnswers
        }
      }
    } catch {
      // Server unreachable — fall through to localStorage
    }

    // Fallback: localStorage
    try {
      const raw = localStorage.getItem(LOCAL_KEY(examId))
      if (raw) {
        const parsed = JSON.parse(raw) as {
          answers: Record<number, string>
          savedAt: string
        }
        const hasContent = Object.values(parsed.answers).some(
          (v) => v && v.trim().length > 0
        )
        if (hasContent) {
          setRestoredFromLocal(true)
          return parsed.answers
        }
      }
    } catch {
      // Corrupt localStorage — ignore
    }

    return null
  }, [examId])

  // Manual save trigger (for "Lưu tạm" button)
  const handleManualSave = useCallback(() => {
    saveToServer(false)
  }, [saveToServer])

  // Clear local draft after final submission
  const clearLocalDraft = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_KEY(examId))
    } catch {
      // ignore
    }
  }, [examId])

  return {
    saveStatus,
    lastSavedAt,
    isServerReachable,
    restoredFromLocal,
    setRestoredFromLocal,
    handleManualSave,
    getRestoredAnswers,
    clearLocalDraft
  }
}
