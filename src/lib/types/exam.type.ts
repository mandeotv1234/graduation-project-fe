export interface Question {
  id: number
  title: string
  status: string
  description: string
  defaultCode?: string
}

export interface Columns {
  name: string
  type: string
}

export interface TableSchema {
  name: string
  columns: Columns[]
}

// ===== Backend DTO Types (match exactly) =====

// GET /api/exams/enrolled → StudentExamListResponseDto
export interface StudentExamListItem {
  examId: number
  title: string
  classId: number
  durationMinutes: number
  startTime: string
  endTime: string
}

// GET /api/exams/{examId} → GetStudentExamResponseDto
export interface ExamSettings {
  preventCopyPaste?: boolean
  forceFullscreen?: boolean
  trackTabSwitch?: boolean
  autoSubmitOnViolation?: boolean
  allowReview?: boolean
  scoreDisplayMode?: string
  allowOvertime?: boolean
  gradingMethod?: string
}

export interface StudentExamDetail {
  examId: number
  classId: number
  className?: string
  title: string
  durationMinutes: number
  startTime: string
  endTime: string
  serverTime?: string
  status?: string
  secondsUntilStart?: number
  description?: string
  maxAttempts?: number
  lateThreshold?: number
  settings?: ExamSettings
}

// GET /api/exams/{examId}/questions → ExamQuestionResponseDto
export interface ExamQuestionItem {
  id: number
  examId: number
  content: string
  correctQuery: string
  difficultyLevel: number
  points: number
  orderIndex: number
  questionType:
    | 'CREATE_TABLE'
    | 'INSERT_DATA'
    | 'SELECT_QUERY'
    | 'TRIGGER'
    | 'FUNCTION'
    | 'STORED_PROCEDURE'
  verifyScript: string
}

// POST /api/exams/{examId}/execute-sql → ExecuteSqlRequestDto / ExecuteSqlResponseDto
export interface ExecuteSqlRequest {
  sql: string
}

export interface ExecuteSqlResponse {
  resultSet: Record<string, unknown>[]
  rowCount: number
  executionTimeMs: number
  errorMessage: string | null
  schema?: Array<{
    tableName: string
    columns: Array<{
      columnName: string
      dataType: string
      primaryKey: boolean
      foreignKey?: boolean
      referencesTable?: string | null
      referencesColumn?: string | null
      nullable: boolean
    }>
  }> | null
}

// POST /api/exams/{examId}/submit → SubmitExamRequestDto / SubmitExamResponseDto
export interface SubmitAnswerItem {
  questionId: number
  studentQuery: string
}

export interface SubmitExamRequest {
  answers: SubmitAnswerItem[]
}

export interface QuestionResultItem {
  submissionId: number
  questionId: number
  orderIndex: number
  studentQuery: string
  isCorrect: boolean
  scoreEarned: number
  maxPoints: number
  errorMessage: string | null
  executionTimeMs: number
}

export interface SubmitExamResponse {
  examId: number
  studentId: number
  totalScore: number
  maxScore: number
  totalQuestions: number
  correctCount: number
  submittedAt: string
  questionResults: QuestionResultItem[]
}

// ===== Exam Specification Types =====

// GET/PUT /api/exams/{examId}/specification

export interface SpecAttribute {
  id?: number
  attributeName: string
  dataType: string
  description: string
  isPrimaryKey: boolean
  isNullable: boolean
  orderIndex: number
}

export interface SpecEntity {
  id?: number
  entityName: string
  displayName: string
  description: string
  orderIndex: number
  attributes: SpecAttribute[]
}

export interface ExamSpecification {
  id?: number
  name: string
  // backward-compat for old payloads
  title?: string
  description: string
  entities: SpecEntity[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateExamQuestionBatch {
  content: string
  difficultyLevel?: number
  points: number
  orderIndex?: number
  questionType: string
}

export interface CreateExamQuestionsBatchRequest {
  questions: CreateExamQuestionBatch[]
}

export interface SaveExamSpecificationRequest {
  name: string
  title?: string
  description: string
  entities: {
    entityName: string
    displayName: string
    description: string
    orderIndex: number
    attributes: {
      attributeName: string
      dataType: string
      description: string
      isPrimaryKey: boolean
      isNullable: boolean
      orderIndex: number
    }[]
  }[]
}
