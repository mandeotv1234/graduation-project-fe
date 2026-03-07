'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
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
    data
  )
}

export async function submitExam(
  examId: number,
  data: SubmitExamRequest
): Promise<ApiResponse<SubmitExamResponse>> {
  return apiClient.post<SubmitExamResponse>(ENDPOINTS.EXAM_SUBMIT(examId), data)
}
