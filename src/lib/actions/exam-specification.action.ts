'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  ExamSpecification,
  SaveExamSpecificationRequest,
  CreateExamQuestionsBatchRequest,
  ExamQuestionItem
} from '@/lib/types'

export async function getExamSpecification(
  examId: number
): Promise<ApiResponse<ExamSpecification>> {
  try {
    return await apiClient.get<ExamSpecification>(
      ENDPOINTS.EXAM_SPECIFICATION(examId),
      {
        cache: 'no-store'
      }
    )
  } catch {
    return {
      data: undefined,
      code: 'NOT_FOUND',
      message: 'No specification found'
    }
  }
}

export async function saveExamSpecification(
  examId: number,
  data: SaveExamSpecificationRequest
): Promise<ApiResponse<ExamSpecification>> {
  return apiClient.post<ExamSpecification>(
    ENDPOINTS.EXAM_SPECIFICATION(examId),
    data
  )
}

export async function createExamQuestionsBatch(
  examId: number,
  data: CreateExamQuestionsBatchRequest
): Promise<
  ApiResponse<{ totalCreated: number; questions: ExamQuestionItem[] }>
> {
  return apiClient.post(ENDPOINTS.EXAM_CREATE_BATCH_QUESTIONS(examId), data)
}
