'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import { headers } from 'next/headers'
import {
  ApiResponse,
  StudentExamListItem,
  StudentExamDetail,
  ExamQuestionItem,
  ExecuteSqlRequest,
  ExecuteSqlResponse,
  SubmitExamRequest,
  SubmitExamResponse
} from '@/lib/types'

export async function getForwardedHeaders() {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const clientIp = forwardedFor?.split(',')[0]?.trim() ?? realIp ?? '0.0.0.0'
  const userAgent = headersList.get('user-agent') ?? 'Unknown'

  return {
    'X-Forwarded-For': clientIp,
    'X-Real-IP': clientIp,
    'User-Agent': userAgent
  }
}

export async function getEnrolledExams(): Promise<
  ApiResponse<StudentExamListItem[]>
> {
  return apiClient.get<StudentExamListItem[]>(ENDPOINTS.ENROLLED_EXAMS, {
    cache: 'no-store'
  })
}

export async function getExamDetail(
  examId: number
): Promise<ApiResponse<StudentExamDetail>> {
  return apiClient.get<StudentExamDetail>(ENDPOINTS.EXAM_DETAIL(examId), {
    cache: 'no-store'
  })
}

export async function getExamQuestionsByExamId(
  examId: number
): Promise<ApiResponse<ExamQuestionItem[]>> {
  return apiClient.get<ExamQuestionItem[]>(ENDPOINTS.EXAM_QUESTIONS(examId), {
    cache: 'no-store'
  })
}

export async function executeSql(
  examId: number,
  data: ExecuteSqlRequest
): Promise<ApiResponse<ExecuteSqlResponse>> {
  return apiClient.post<ExecuteSqlResponse>(
    ENDPOINTS.EXAM_EXECUTE_SQL(examId),
    data,
    { headers: await getForwardedHeaders() }
  )
}

export async function submitExam(
  examId: number,
  data: SubmitExamRequest
): Promise<ApiResponse<SubmitExamResponse>> {
  return apiClient.post<SubmitExamResponse>(
    ENDPOINTS.EXAM_SUBMIT(examId),
    data,
    { headers: await getForwardedHeaders(), ignoreAuthError: true }
  )
}

export interface SaveDraftRequest {
  answers: { questionId: number; content: string }[]
  clientTimestamp?: string
}

export interface DraftResponse {
  examId: number
  studentId: number
  savedAt: string
  clientTimestamp?: string
  answers: Record<number, string>
}

export async function saveExamDraft(
  examId: number,
  data: SaveDraftRequest
): Promise<ApiResponse<DraftResponse>> {
  return apiClient.put<DraftResponse>(ENDPOINTS.EXAM_DRAFT(examId), data, {
    headers: await getForwardedHeaders()
  })
}

export async function getExamDraft(
  examId: number
): Promise<ApiResponse<DraftResponse | null>> {
  return apiClient.get<DraftResponse | null>(ENDPOINTS.EXAM_DRAFT(examId), {
    cache: 'no-store'
  })
}
