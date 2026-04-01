'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  ExamSpecification,
  SaveExamSpecificationRequest,
  CreateExamQuestionsBatchRequest,
  ExamQuestionItem,
  SpecificationResponse,
  SpecificationDetailResponse,
  CreateSpecificationRequest
} from '@/lib/types'

export async function getSpecifications(): Promise<
  ApiResponse<SpecificationResponse[]>
> {
  return apiClient.get<SpecificationResponse[]>(ENDPOINTS.SPECIFICATIONS, {
    cache: 'no-store'
  })
}

export async function createSpecification(
  data: CreateSpecificationRequest
): Promise<ApiResponse<SpecificationResponse>> {
  return apiClient.post<SpecificationResponse>(
    ENDPOINTS.SPECIFICATIONS_V2,
    data
  )
}

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

export async function getSpecificationDetail(
  specificationId: number
): Promise<ApiResponse<SpecificationDetailResponse>> {
  return apiClient.get<SpecificationDetailResponse>(
    ENDPOINTS.SPECIFICATION_DETAIL(specificationId),
    {
      cache: 'no-store'
    }
  )
}

export async function updateSpecification(
  specificationId: number,
  data: CreateSpecificationRequest
): Promise<ApiResponse<SpecificationResponse>> {
  return apiClient.put<SpecificationResponse>(
    ENDPOINTS.SPECIFICATION_DETAIL(specificationId),
    data
  )
}

export async function deleteSpecification(
  specificationId: number
): Promise<ApiResponse<void>> {
  return apiClient.delete(ENDPOINTS.SPECIFICATION_DETAIL(specificationId))
}

export async function generateGradingRubric(data: {
  correctQuery: string
  questionContent: string
  totalPoints: number
  enforceExactTotalPoints?: boolean
  questionType?: string
  contextQueries?: Array<{
    questionType?: string
    content?: string
    correctQuery: string
  }>
}): Promise<ApiResponse<string>> {
  return apiClient.post<string>(ENDPOINTS.EXAM_GENERATE_RUBRIC, data)
}

export async function testGradeCreateTable(data: {
  correctQuery: string
  studentQuery: string
  gradingRubric: string
  totalPoints: number
}): Promise<
  ApiResponse<{
    earnedPoints: number
    totalPoints: number
    allPassed: boolean
    details: { type: string; message: string; points: number }[]
  }>
> {
  return apiClient.post(ENDPOINTS.EXAM_TEST_GRADE, data)
}

export async function testGradeInsertData(
  examId: number,
  data: {
    correctQuery: string
    studentQuery: string
    gradingRubric: string
    totalPoints: number
  }
): Promise<
  ApiResponse<{
    earnedPoints: number
    totalPoints: number
    allPassed: boolean
    details: { type: string; message: string; points: number }[]
  }>
> {
  return apiClient.post(ENDPOINTS.EXAM_TEST_GRADE_INSERT(examId), data)
}

export async function testGradeSelectData(
  examId: number,
  data: {
    studentQuery: string
    correctQuery?: string
    gradingRubric: string
    totalPoints: number
  }
): Promise<
  ApiResponse<{
    earnedPoints: number
    totalPoints: number
    allPassed: boolean
    details: { type: string; message: string; points: number }[]
  }>
> {
  return apiClient.post(ENDPOINTS.EXAM_TEST_GRADE_SELECT(examId), data)
}
