'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import type {
  ApiResponse,
  ExamQuestionItem,
  StudentExamDetail,
  SubmitExamResponse
} from '@/lib/types'

export async function getExamPreview(
  examId: number
): Promise<ApiResponse<StudentExamDetail>> {
  const data = await apiClient.get(ENDPOINTS.EXAM_PREVIEW(examId), {
    ignoreAuthError: true,
    cache: 'no-store'
  })
  return data as ApiResponse<StudentExamDetail>
}

export async function getPreviewExamQuestions(
  examId: number
): Promise<ApiResponse<ExamQuestionItem[]>> {
  const data = await apiClient.get(ENDPOINTS.EXAM_QUESTIONS(examId), {
    ignoreAuthError: true,
    cache: 'no-store'
  })
  return data as ApiResponse<ExamQuestionItem[]>
}

export interface InitializePreviewSchemaResponse {
  schema: Array<{
    tableName: string
    columns: Array<{
      columnName: string
      dataType: string
      primaryKey?: boolean
      nullable?: boolean
      foreignKey?: boolean
      referencesTable?: string | null
      referencesColumn?: string | null
      unique?: boolean
      autoIncrement?: boolean
    }>
  }>
}

export async function initializePreviewSchema(
  examId: number
): Promise<ApiResponse<InitializePreviewSchemaResponse>> {
  const data = await apiClient.post(
    ENDPOINTS.EXAM_PREVIEW_INITIALIZE(examId),
    {}
  )
  return data as ApiResponse<InitializePreviewSchemaResponse>
}

export async function clearPreviewSchema(
  examId: number
): Promise<ApiResponse<null>> {
  const data = await apiClient.post(
    ENDPOINTS.EXAM_PREVIEW_CLEAR_SCHEMA(examId),
    {}
  )
  return data as ApiResponse<null>
}

export interface PreviewSubmitAnswerItem {
  questionId: number
  studentQuery: string
}

export async function submitExamPreview(
  examId: number,
  answers: PreviewSubmitAnswerItem[]
): Promise<ApiResponse<SubmitExamResponse>> {
  const data = await apiClient.post(ENDPOINTS.EXAM_PREVIEW_SUBMIT(examId), {
    answers
  })
  return data as ApiResponse<SubmitExamResponse>
}
