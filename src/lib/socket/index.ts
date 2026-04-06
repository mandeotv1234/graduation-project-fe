import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

import { ViolationNotification } from '@/lib/types'

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '/ws') ||
  'http://localhost:8080/ws'

let stompClient: Client | null = null
const connectListeners: Array<() => void> = []

export function getStompClient(): Client | null {
  return stompClient
}

export function subscribeToConnect(callback: () => void) {
  if (stompClient?.connected) {
    callback()
  }
  connectListeners.push(callback)
  return () => {
    const idx = connectListeners.indexOf(callback)
    if (idx > -1) connectListeners.splice(idx, 1)
  }
}

export function connectStomp(options?: {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}): Client {
  if (options?.onConnect) {
    subscribeToConnect(options.onConnect)
  }

  if (stompClient?.connected) return stompClient

  if (stompClient) return stompClient

  const client = new Client({
    webSocketFactory: () => new SockJS(SOCKET_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      setTimeout(() => {
        connectListeners.forEach((listener) => listener())
      }, 0)
    },
    onDisconnect: () => {
      options?.onDisconnect?.()
    },
    onStompError: (frame) => {
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
        // silent
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
        // silent
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
        // silent
      }
    }
  )

  return () => subscription.unsubscribe()
}

/**
 * Subscribe to device conflict notifications (Teacher).
 * Backend sends to: /topic/teacher/exam/{examId}/device-conflict
 */
export function subscribeToDeviceConflict(
  examId: number,
  callback: (notification: unknown) => void
): (() => void) | undefined {
  const client = getStompClient()
  if (!client?.connected) return undefined

  const subscription = client.subscribe(
    `/topic/teacher/exam/${examId}/device-conflict`,
    (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body)
        callback(payload)
      } catch {
        console.error('[STOMP] Failed to parse device conflict notification')
      }
    }
  )

  return () => subscription.unsubscribe()
}

/**
 * Subscribe to student-specific exam session notifications (Student).
 * Backend sends to: /topic/student/{studentId}/exam-session
 */
export function subscribeToStudentSession(
  studentId: number,
  callback: (notification: unknown) => void
): (() => void) | undefined {
  const client = getStompClient()
  if (!client?.connected) return undefined

  const subscription = client.subscribe(
    `/topic/student/${studentId}/exam-session`,
    (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body)
        callback(payload)
      } catch {
        console.error('[STOMP] Failed to parse student session notification')
      }
    }
  )

  return () => subscription.unsubscribe()
}

/**
 * Subscribe to global teacher notifications (Teacher).
 * Backend sends to: /topic/teacher/{teacherId}/notifications
 */
export function subscribeToTeacherNotifications(
  teacherId: number,
  callback: (notification: unknown) => void
): (() => void) | undefined {
  const client = getStompClient()
  if (!client?.connected) return undefined

  const subscription = client.subscribe(
    `/topic/teacher/${teacherId}/notifications`,
    (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body)
        callback(payload)
      } catch {
        console.error('[STOMP] Failed to parse teacher notification')
      }
    }
  )

  return () => subscription.unsubscribe()
}
