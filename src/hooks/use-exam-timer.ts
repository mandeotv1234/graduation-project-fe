'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { getExamTime } from '@/lib/actions/anti-cheat.action'

interface UseExamTimerOptions {
  examId: number
  initialSeconds?: number
  syncIntervalMs?: number
  onTimeUp?: () => void
  enabled?: boolean
}

export function useExamTimer({
  examId,
  initialSeconds = 0,
  syncIntervalMs = 30_000,
  onTimeUp,
  enabled = true
}: UseExamTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const onTimeUpRef = useRef(onTimeUp)
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  // Khi initialSeconds thay đổi (session started), cập nhật timer
  useEffect(() => {
    if (initialSeconds > 0) {
      setRemainingSeconds(initialSeconds)
    }
  }, [initialSeconds])

  // Sync from backend (authoritative server time)
  const syncTime = useCallback(async () => {
    try {
      const result = await getExamTime(examId)
      if (result.data) {
        setRemainingSeconds(Math.max(0, result.data.remainingSeconds))
        if (result.data.expired) {
          setIsExpired(true)
          onTimeUpRef.current?.()
        }
      }
    } catch {
      // Sync failed — continue with local countdown
    }
  }, [examId]) // Removing onTimeUp dependency to prevent infinite loops from unstable props

  // Manual sync (can be called from useExamSocket onTimeSync)
  const setServerTime = useCallback((seconds: number) => {
    setRemainingSeconds(Math.max(0, seconds))
    if (seconds <= 0) {
      setIsExpired(true)
      onTimeUpRef.current?.()
    }
  }, [])

  // Local countdown (visual only — chỉ chạy khi enabled)
  useEffect(() => {
    if (isExpired || !enabled) return

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true)
          onTimeUpRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isExpired, enabled])

  // Periodic server sync (chỉ sync khi enabled)
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
