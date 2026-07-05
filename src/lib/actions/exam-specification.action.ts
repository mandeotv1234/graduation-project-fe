'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  ExamSpecification,
  InsertDataExpectedDataset,
  RubricTable,
  SaveExamSpecificationRequest,
  CreateExamQuestionsBatchRequest,
  ExamQuestionItem,
  SpecificationResponse,
  SpecificationDetailResponse,
  CreateSpecificationRequest,
  SpecificationSchemaJsonTable,
  WhiteboxCatalogItem,
  WhiteboxValidationResult,
  WhiteboxRule,
  WhiteboxSettings,
  RefineRubricTestCasesRequest,
  RefineRubricTestCasesResponse
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

export async function generateSpecificationSchemaByAI(data: {
  description: string
  currentSchemaJson?: SpecificationSchemaJsonTable[]
}): Promise<ApiResponse<SpecificationSchemaJsonTable[]>> {
  return apiClient.post<SpecificationSchemaJsonTable[]>(
    ENDPOINTS.SPECIFICATIONS_AI_SCHEMA,
    data
  )
}

export async function generateSpecificationSchemaFromDDL(data: {
  ddlScript: string
}): Promise<ApiResponse<SpecificationSchemaJsonTable[]>> {
  return apiClient.post<SpecificationSchemaJsonTable[]>(
    ENDPOINTS.SPECIFICATIONS_SCHEMA_FROM_DDL,
    data
  )
}

export async function getExamSpecification(
  examId: number
): Promise<ApiResponse<ExamSpecification>> {
  return apiClient.get<ExamSpecification>(
    ENDPOINTS.EXAM_SPECIFICATION(examId),
    { cache: 'no-store' }
  )
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
  schemaContext?: string
  contextQueries?: Array<{
    questionType?: string
    content?: string
    correctQuery: string
  }>
}): Promise<ApiResponse<string>> {
  return apiClient.post<string>(ENDPOINTS.EXAM_GENERATE_RUBRIC, data)
}

export async function refineRubricTestCases(
  data: RefineRubricTestCasesRequest
): Promise<ApiResponse<RefineRubricTestCasesResponse>> {
  return apiClient.post<RefineRubricTestCasesResponse>(
    ENDPOINTS.EXAM_REFINE_RUBRIC_TESTCASES,
    data
  )
}

const CATALOG_REQUEST_TIMEOUT_MS = 10_000

// Fetches the backend-owned white-box rule catalog (source of truth) for a question type.
export async function getWhiteboxCatalog(
  questionType = 'SELECT_QUERY'
): Promise<ApiResponse<WhiteboxCatalogItem[]>> {
  const key = questionType.toUpperCase()
  return apiClient.get<WhiteboxCatalogItem[]>(ENDPOINTS.WHITEBOX_CATALOG(key), {
    cache: 'no-store',
    signal: AbortSignal.timeout(CATALOG_REQUEST_TIMEOUT_MS)
  })
}

// Stateless white-box validation/preview (model answer or arbitrary SQL). Never blocks save.
export async function validateWhitebox(data: {
  questionType?: string
  sql: string
  whiteboxRules: WhiteboxRule[]
  whiteboxSettings?: WhiteboxSettings
  questionPoints: number
}): Promise<ApiResponse<WhiteboxValidationResult>> {
  return apiClient.post<WhiteboxValidationResult>(
    ENDPOINTS.WHITEBOX_VALIDATE,
    data
  )
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
    totalDeductions?: number | null
    blackboxScore?: number | null
    whiteboxDeduction?: number | null
    details: { type: string; message: string; points: number }[]
    finalScore?: number | null
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
    totalDeductions?: number | null
    blackboxScore?: number | null
    whiteboxDeduction?: number | null
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

export async function testGradeRoutineData(
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
  return apiClient.post(ENDPOINTS.EXAM_TEST_GRADE_ROUTINE(examId), data)
}

export async function testGradeTriggerData(
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
  return apiClient.post(ENDPOINTS.EXAM_TEST_GRADE_TRIGGER(examId), data)
}

export async function executeSelectTestCaseConfig(
  examId: number,
  data: {
    setupDependencyId?: string
    setupCustomScript?: string
    correctQuery: string
  }
): Promise<
  ApiResponse<{
    columns_config: { column_name: string }[]
    rows: string[][]
  }>
> {
  return apiClient.post(ENDPOINTS.EXAM_RUN_SELECT_TESTCASE(examId), data)
}

export async function buildInsertTablesFromAnswer(
  examId: number,
  data: {
    correctQuery: string
  }
): Promise<
  ApiResponse<{
    tables: InsertDataExpectedDataset[]
    preparedCount: number
    targetTableCount: number
  }>
> {
  return apiClient.post(ENDPOINTS.EXAM_BUILD_INSERT_TABLES(examId), data)
}

export async function buildCreateTablesFromAnswer(
  examId: number,
  data: {
    correctQuery: string
  }
): Promise<
  ApiResponse<{
    tables: RubricTable[]
    preparedCount: number
    targetTableCount: number
  }>
> {
  return apiClient.post(ENDPOINTS.EXAM_BUILD_CREATE_TABLES(examId), data)
}

// IMPORTANT: uses `queries` key (NOT `params`) — see ApiClient RequestOptions in src/lib/api/index.ts

export async function generateEntityDescription(
  specId: number,
  entityId: number,
  examId: number
): Promise<ApiResponse<{ description: string | null }>> {
  return apiClient.post<{ description: string | null }>(
    ENDPOINTS.SPECIFICATION_ENTITY_GENERATE_DESCRIPTION(specId, entityId),
    undefined,
    { queries: { examId } }
  )
}

export async function updateEntityDescription(
  specId: number,
  entityId: number,
  examId: number,
  description: string
): Promise<ApiResponse<void>> {
  return apiClient.put<void>(
    ENDPOINTS.SPECIFICATION_ENTITY_DESCRIPTION(specId, entityId),
    { description },
    { queries: { examId } }
  )
}
