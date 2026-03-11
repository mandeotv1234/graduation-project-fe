'use client'

import { useCallback, useEffect, useRef } from 'react'

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

  const setupSubscriptions = useCallback(() => {
    const client = getStompClient()
    if (!client?.connected) return

    // Subscribe to exam-level notifications (force-submit, warnings)
    client.subscribe(`/topic/exam/${examId}/violations`, (message) => {
      try {
        const payload = JSON.parse(message.body) as ViolationNotification

        if (payload.autoSubmitted) {
          dispatch(
            showWarning(
              'Bài thi của bạn đã bị nộp tự động do vi phạm quy chế thi.'
            )
          )
          setTimeout(() => onForceSubmit?.(), 2000)
        }
      } catch {
        console.error('[ExamSocket] Failed to parse message')
      }
    })

    // Subscribe to time sync (if backend pushes time)
    client.subscribe(`/topic/exam/${examId}/time`, (message) => {
      try {
        const payload = JSON.parse(message.body) as {
          remainingSeconds: number
        }
        onTimeSync?.(payload.remainingSeconds)
      } catch {
        console.error('[ExamSocket] Failed to parse time sync')
      }
    })

    // Subscribe to session conflict
    client.subscribe(`/topic/exam/${examId}/session-conflict`, (message) => {
      try {
        const payload = JSON.parse(message.body) as {
          message: string
        }
        dispatch(
          showWarning(
            payload.message ||
              'Tài khoản của bạn đang được sử dụng trên thiết bị khác!'
          )
        )
        setTimeout(() => onForceSubmit?.(), 5000)
      } catch {
        console.error('[ExamSocket] Failed to parse session conflict')
      }
    })
  }, [dispatch, examId, onForceSubmit, onTimeSync])

  useEffect(() => {
    if (!enabled || isConnected.current) return

    connectStomp({
      onConnect: () => {
        isConnected.current = true
        setupSubscriptions()
      },
      onDisconnect: () => {
        isConnected.current = false
      }
    })

    return () => {
      disconnectStomp()
      isConnected.current = false
    }
  }, [enabled, setupSubscriptions])

  return { isConnected: isConnected.current }
}
