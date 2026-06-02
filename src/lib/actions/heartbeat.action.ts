'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import { ApiResponse, HeartbeatPayload, HeartbeatResponse } from '@/lib/types'

import { getForwardedHeaders } from './student-exam.action'

/**
 * Sends an exam heartbeat to the backend. Fire-and-forget from the client's view —
 * a network failure must NOT break the exam UI, so callers should swallow rejections.
 * Server-side absence detection is the backstop when heartbeats stop.
 */
export async function sendHeartbeat(
  examId: number,
  payload: HeartbeatPayload
): Promise<ApiResponse<HeartbeatResponse>> {
  try {
    return await apiClient.post<HeartbeatResponse>(
      ENDPOINTS.EXAM_HEARTBEAT(examId),
      payload,
      { headers: await getForwardedHeaders() }
    )
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Unknown error'
    return {
      code: 'SERVER_ERROR',
      message,
      data: undefined as unknown as HeartbeatResponse
    }
  }
}
