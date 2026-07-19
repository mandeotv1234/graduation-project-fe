'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { getExamTime } from '@/lib/actions/anti-cheat.action'

export type ExamTimerPhase = 'REGULAR' | 'LATE' | 'ENDED'

interface UseExamTimerOptions {
  examId: number
  initialSeconds?: number
  initialPhase?: ExamTimerPhase
  syncIntervalMs?: number
  onTimeUp?: (reason: string) => void
  enabled?: boolean
  allowOvertime?: boolean
  lateThresholdSeconds?: number
}

function getTimerPhase(status: string): ExamTimerPhase {
  if (status === 'LATE_SUBMISSION') return 'LATE'
  if (status === 'ENDED') return 'ENDED'
  return 'REGULAR'
}

export function useExamTimer({
  examId,
  initialSeconds = 0,
  initialPhase = 'REGULAR',
  syncIntervalMs = 30_000,
  onTimeUp,
  enabled = true,
  allowOvertime = false,
  lateThresholdSeconds
}: UseExamTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)
  const [phase, setPhase] = useState<ExamTimerPhase>(initialPhase)
  const [hasInitialized, setHasInitialized] = useState(false)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const expirationNotifiedRef = useRef(false)
  const hasFiniteLateWindow = lateThresholdSeconds !== undefined
  const normalizedLateThresholdSeconds = Math.max(0, lateThresholdSeconds ?? 0)

  const onTimeUpRef = useRef(onTimeUp)
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  // When initialSeconds changes (session started), update the timer
  useEffect(() => {
    if (initialSeconds > 0) {
      setRemainingSeconds(initialSeconds)
      setPhase(initialPhase)
      expirationNotifiedRef.current = false
      setHasInitialized(true)
    }
  }, [initialPhase, initialSeconds])

  // Sync from backend (authoritative server time)
  const syncTime = useCallback(async () => {
    try {
      const result = await getExamTime(examId)
      if (result.data) {
        setRemainingSeconds(result.data.remainingSeconds)
        const serverPhase = getTimerPhase(result.data.status)
        setPhase(serverPhase)
        if (serverPhase !== 'ENDED') {
          expirationNotifiedRef.current = false
        }
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

  // Move between the regular and finite late-submission countdowns.
  useEffect(() => {
    if (!enabled || !hasInitialized || remainingSeconds > 0) return

    if (phase === 'ENDED') {
      if (!expirationNotifiedRef.current) {
        expirationNotifiedRef.current = true
        onTimeUpRef.current?.('TIME_UP')
      }
      return
    }

    if (phase === 'REGULAR' && allowOvertime) {
      // Teacher preview intentionally keeps an unbounded negative timer.
      if (!hasFiniteLateWindow) return

      if (normalizedLateThresholdSeconds > 0) {
        setPhase('LATE')
        setRemainingSeconds(normalizedLateThresholdSeconds)
        return
      }
    }

    setPhase('ENDED')
    setRemainingSeconds(0)
  }, [
    allowOvertime,
    enabled,
    hasFiniteLateWindow,
    hasInitialized,
    normalizedLateThresholdSeconds,
    phase,
    remainingSeconds
  ])

  // Local countdown (visual only — runs only when enabled)
  useEffect(() => {
    if (phase === 'ENDED' || !enabled || !hasInitialized) return

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          return allowOvertime && !hasFiniteLateWindow ? prev - 1 : 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [allowOvertime, enabled, hasFiniteLateWindow, hasInitialized, phase])

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

  return {
    remainingSeconds,
    phase,
    isExpired: phase === 'ENDED',
    syncTime,
    setServerTime
  }
}
