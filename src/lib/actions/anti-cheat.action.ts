'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  ExamTimeResponse,
  ReportViolationRequest,
  ReportViolationResponse,
  StartExamSessionResponse,
  TeacherExamViolation
} from '@/lib/types'

import { getForwardedHeaders } from './student-exam.action'

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    try {
      return JSON.parse(error).message || 'Unknown error'
    } catch {
      return error
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message
  }
  return 'Unknown error'
}

export async function startExamSession(
  examId: number
): Promise<ApiResponse<StartExamSessionResponse>> {
  try {
    console.log('[Server Action] startExamSession', examId)
    return await apiClient.post<StartExamSessionResponse>(
      ENDPOINTS.EXAM_START_SESSION(examId),
      {}, // Empty body
      { headers: await getForwardedHeaders() }
    )
  } catch (error: unknown) {
    const msg = extractErrorMessage(error)
    return {
      code: 'SERVER_ERROR',
      message: msg,
      data: undefined as unknown as StartExamSessionResponse
    }
  }
}

export async function reportViolation(
  examId: number,
  data: ReportViolationRequest
): Promise<ApiResponse<ReportViolationResponse>> {
  try {
    console.log('[Server Action] reportViolation', examId, data.violationType)
    return await apiClient.post<ReportViolationResponse>(
      ENDPOINTS.EXAM_REPORT_VIOLATION(examId),
      data
    )
  } catch (error: unknown) {
    const msg = extractErrorMessage(error)
    return {
      code: 'SERVER_ERROR',
      message: msg,
      data: undefined as unknown as ReportViolationResponse
    }
  }
}

export async function getExamTime(
  examId: number
): Promise<ApiResponse<ExamTimeResponse>> {
  try {
    console.log('[Server Action] getExamTime', examId)
    return await apiClient.get<ExamTimeResponse>(ENDPOINTS.EXAM_TIME(examId), {
      queries: { _t: Date.now() },
      cache: 'no-store'
    })
  } catch (error: unknown) {
    const msg = extractErrorMessage(error)
    return {
      code: 'SERVER_ERROR',
      message: msg,
      data: undefined as unknown as ExamTimeResponse
    }
  }
}

export async function getTeacherExamViolations(
  examId: number,
  studentId: number
): Promise<ApiResponse<TeacherExamViolation[]>> {
  try {
    return await apiClient.get<TeacherExamViolation[]>(
      ENDPOINTS.EXAM_REPORT_VIOLATION(examId),
      {
        queries: { studentId },
        cache: 'no-store'
      }
    )
  } catch (error: unknown) {
    const msg = extractErrorMessage(error)
    return {
      code: 'SERVER_ERROR',
      message: msg,
      data: []
    }
  }
}

export async function approveDeviceConflict(
  examId: number,
  conflictId: string
): Promise<ApiResponse<null>> {
  try {
    return await apiClient.post<null>(
      ENDPOINTS.EXAM_DEVICE_CONFLICT_APPROVE(examId, conflictId)
    )
  } catch (error: unknown) {
    return {
      code: 'SERVER_ERROR',
      message: extractErrorMessage(error),
      data: null
    }
  }
}

export async function rejectDeviceConflict(
  examId: number,
  conflictId: string,
  reason?: string
): Promise<ApiResponse<null>> {
  try {
    return await apiClient.post<null>(
      ENDPOINTS.EXAM_DEVICE_CONFLICT_REJECT(examId, conflictId),
      { reason: reason ?? '' }
    )
  } catch (error: unknown) {
    return {
      code: 'SERVER_ERROR',
      message: extractErrorMessage(error),
      data: null
    }
  }
}
