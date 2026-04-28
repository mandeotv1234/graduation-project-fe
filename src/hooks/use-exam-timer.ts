'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { getExamTime } from '@/lib/actions/anti-cheat.action'

interface UseExamTimerOptions {
  examId: number
  initialSeconds?: number
  syncIntervalMs?: number
  onTimeUp?: (reason: string) => void
  enabled?: boolean
  allowOvertime?: boolean
}

export function useExamTimer({
  examId,
  initialSeconds = 0,
  syncIntervalMs = 30_000,
  onTimeUp,
  enabled = true,
  allowOvertime = false
}: UseExamTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const onTimeUpRef = useRef(onTimeUp)
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  // When initialSeconds changes (session started), update the timer
  useEffect(() => {
    if (initialSeconds > 0) {
      setRemainingSeconds(initialSeconds)
      setHasInitialized(true)
    }
  }, [initialSeconds])

  // Sync from backend (authoritative server time)
  const syncTime = useCallback(async () => {
    try {
      const result = await getExamTime(examId)
      if (result.data) {
        setRemainingSeconds(result.data.remainingSeconds)
        setHasInitialized(true)
      }
    } catch {
      // Sync failed — continue with local countdown
    }
  }, [examId]) // Removing onTimeUp dependency to prevent infinite loops from unstable props

  // Manual sync (can be called from useExamSocket onTimeSync)
  const setServerTime = useCallback((seconds: number) => {
    setRemainingSeconds(seconds)
    setHasInitialized(true)
  }, [])

  // Watch remainingSeconds to safely trigger onTimeUp (outside render/updater phase)
  useEffect(() => {
    if (remainingSeconds <= 0 && !isExpired && enabled && hasInitialized) {
      setIsExpired(true)
      onTimeUpRef.current?.('TIME_UP')
    }
  }, [remainingSeconds, isExpired, enabled, hasInitialized])

  // Local countdown (visual only — runs only when enabled)
  useEffect(() => {
    if ((isExpired && !allowOvertime) || !enabled || !hasInitialized) return

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0 && !allowOvertime) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isExpired, enabled, allowOvertime, hasInitialized])

  // Periodic server sync (only sync when enabled)
  useEffect(() => {
    if (!enabled) return

    // Initial sync
    syncTime()

    syncIntervalRef.current = setInterval(syncTime, syncIntervalMs)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [syncTime, syncIntervalMs, enabled])

  return { remainingSeconds, isExpired, syncTime, setServerTime }
}
