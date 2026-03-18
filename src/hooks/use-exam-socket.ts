'use client'

import { useEffect, useRef } from 'react'

import { showWarning } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch } from '@/lib/redux/hooks'
import { connectStomp, disconnectStomp, getStompClient } from '@/lib/socket'
import { ViolationNotification } from '@/lib/types'

interface UseExamSocketOptions {
  examId: number
  enabled?: boolean
  onForceSubmit?: () => void
  onTimeSync?: (remainingSeconds: number) => void
}

export function useExamSocket({
  examId,
  enabled = true,
  onForceSubmit,
  onTimeSync
}: UseExamSocketOptions) {
  const dispatch = useAppDispatch()
  const isConnected = useRef(false)
  const subsRef = useRef<Array<() => void>>([])
  const onForceSubmitRef = useRef(onForceSubmit)
  const onTimeSyncRef = useRef(onTimeSync)

  onForceSubmitRef.current = onForceSubmit
  onTimeSyncRef.current = onTimeSync

  const cleanupSubs = () => {
    subsRef.current.forEach((unsub) => {
      try {
        unsub()
      } catch {
        // ignore
      }
    })
    subsRef.current = []
  }

  useEffect(() => {
    if (!enabled || isConnected.current) return

    const setupSubscriptions = () => {
      const client = getStompClient()
      if (!client?.connected) return
      cleanupSubs()

      // Subscribe to exam-level notifications (force-submit, warnings)
      const subViolations = client.subscribe(
        `/topic/exam/${examId}/violations`,
        (message) => {
          try {
            const payload = JSON.parse(message.body) as ViolationNotification

            if (payload.autoSubmitted) {
              dispatch(
                showWarning(
                  'Bài thi của bạn đã bị nộp tự động do vi phạm quy chế thi.'
                )
              )
              setTimeout(() => onForceSubmitRef.current?.(), 2000)
            }
          } catch {
            console.error('[ExamSocket] Failed to parse message')
          }
        }
      )

      subsRef.current.push(() => subViolations.unsubscribe())

      // Subscribe to time sync (if backend pushes time)
      const subTime = client.subscribe(
        `/topic/exam/${examId}/time`,
        (message) => {
          try {
            const payload = JSON.parse(message.body) as {
              remainingSeconds: number
            }
            onTimeSyncRef.current?.(payload.remainingSeconds)
          } catch {
            console.error('[ExamSocket] Failed to parse time sync')
          }
        }
      )

      subsRef.current.push(() => subTime.unsubscribe())

      // Subscribe to session conflict
      const subConflict = client.subscribe(
        `/topic/exam/${examId}/session-conflict`,
        (message) => {
          try {
            const payload = JSON.parse(message.body) as { message: string }
            dispatch(
              showWarning(
                payload.message ||
                  'Tài khoản của bạn đang được sử dụng trên thiết bị khác!'
              )
            )
            setTimeout(() => onForceSubmitRef.current?.(), 5000)
          } catch {
            console.error('[ExamSocket] Failed to parse session conflict')
          }
        }
      )

      subsRef.current.push(() => subConflict.unsubscribe())
    }

    connectStomp({
      onConnect: () => {
        isConnected.current = true
        setupSubscriptions()
      },
      onDisconnect: () => {
        isConnected.current = false
        cleanupSubs()
      }
    })

    return () => {
      cleanupSubs()
      disconnectStomp()
      isConnected.current = false
    }
  }, [dispatch, enabled, examId])

  return { isConnected: isConnected.current }
}
