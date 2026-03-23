import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

import { ViolationNotification } from '@/lib/types'

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '/ws') ||
  'http://localhost:8080/ws'

let stompClient: Client | null = null

export function getStompClient(): Client | null {
  return stompClient
}

export function connectStomp(options?: {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}): Client {
  if (stompClient?.connected) return stompClient

  const client = new Client({
    webSocketFactory: () => new SockJS(SOCKET_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (str) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[STOMP]', str)
      }
    },
    onConnect: () => {
      console.log('[STOMP] Connected')
      options?.onConnect?.()
    },
    onDisconnect: () => {
      console.log('[STOMP] Disconnected')
      options?.onDisconnect?.()
    },
    onStompError: (frame) => {
      console.error('[STOMP] Error:', frame.headers['message'])
      options?.onError?.(frame.headers['message'] || 'STOMP error')
    }
  })

  client.activate()
  stompClient = client
  return client
}

export function disconnectStomp(): void {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }
}

/**
 * Subscribe to violation notifications for a specific exam (Teacher).
 * Backend sends to: /topic/exam/{examId}/violations
 */
export function subscribeToExamViolations(
  examId: number,
  callback: (notification: ViolationNotification) => void
): (() => void) | undefined {
  const client = getStompClient()
  if (!client?.connected) return undefined

  const subscription = client.subscribe(
    `/topic/exam/${examId}/violations`,
    (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body) as ViolationNotification
        callback(payload)
      } catch {
        console.error('[STOMP] Failed to parse violation notification')
      }
    }
  )

  return () => subscription.unsubscribe()
}

/**
 * Subscribe to grading results for a specific exam (Student).
 * Backend sends to: /topic/exam/{examId}/grading-result
 */
export function subscribeToGradingResult(
  examId: number,
  callback: (notification: unknown) => void
): (() => void) | undefined {
  const client = getStompClient()
  if (!client?.connected) return undefined

  const subscription = client.subscribe(
    `/topic/exam/${examId}/grading-result`,
    (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body)
        callback(payload)
      } catch {
        console.error('[STOMP] Failed to parse grading result notification')
      }
    }
  )

  return () => subscription.unsubscribe()
}

/**
 * Subscribe to grading results for a specific exam (Teacher).
 * Backend sends to: /topic/teacher/exam/{examId}/grading-result
 */
export function subscribeToTeacherGradingResult(
  examId: number,
  callback: (notification: unknown) => void
): (() => void) | undefined {
  const client = getStompClient()
  if (!client?.connected) return undefined

  const subscription = client.subscribe(
    `/topic/teacher/exam/${examId}/grading-result`,
    (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body)
        callback(payload)
      } catch {
        console.error(
          '[STOMP] Failed to parse teacher grading result notification'
        )
      }
    }
  )

  return () => subscription.unsubscribe()
}
