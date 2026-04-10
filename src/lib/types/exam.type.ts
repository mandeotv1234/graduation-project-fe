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
  maxViolations?: number
  showResultAfterSubmit?: boolean
  /** DDL giáo viên nạp vào schema sinh viên khi bắt đầu thi */
  isLoadDdl?: boolean
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
  usedAttempts?: number
  lateThreshold?: number
  settings?: ExamSettings
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
  gradingRubric?: string
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
  statusMessage: string | null
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

export type GradingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface SubmitExamResponse {
  examId: number
  studentId: number
  submittedAt: string
  status: GradingStatus
  // Fields present when status is COMPLETED
  totalScore?: number
  maxScore?: number
  totalQuestions?: number
  correctCount?: number
  questionResults?: QuestionResultItem[]
  details?: Array<{
    questionId: number
    content: string
    points: number
    studentQuery: string
  }>
}

export interface TeacherExamResult {
  submissionId: number
  studentId: number
  studentName: string
  studentEmail: string
  attemptNumber: number
  totalScore: number
  maxScore: number
  correctCount: number
  totalQuestions: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  submittedAt: string
}

export interface TeacherExamResultDetail extends TeacherExamResult {
  questionResults: QuestionResultDetail[]
  gradingType: 'AUTO' | 'MANUAL' | 'MIXED'
  lastGradedAt?: string
}

export interface QuestionResultDetail {
  questionId: number
  // ExamSubmission.id for the per-question submission — used by override API
  submissionId?: number
  content: string
  studentQuery: string
  correctQuery: string
  isCorrect: boolean
  scoreEarned: number
  maxPoints: number
  errorMessage?: string
  executionTimeMs?: number
  gradingType: 'AUTO' | 'MANUAL'
  gradedBy?: number
  gradedByName?: string
  gradedAt?: string
  teacherComment?: string
  questionType: string
}

// ===== Override & Re-grade Types =====

export interface OverrideSubmissionRequest {
  scoreEarned: number
  isCorrect: boolean
  teacherComment?: string
}

export interface OverrideSubmissionResponse {
  submissionId: number
  scoreEarned: number
  isCorrect: boolean
  gradingType: 'MANUAL'
  teacherComment?: string
  updatedResult: {
    totalScore: number
    correctCount: number
    gradingType: 'AUTO' | 'MANUAL' | 'MIXED'
  }
}

export interface RegradeResponse {
  message: string
  previousScores: PreviousScores
}

export interface PreviousScores {
  totalScore: number
  correctCount: number
  details: Array<{
    questionId: number
    scoreEarned: number
    isCorrect: boolean
  }>
}

export interface RegradeAllResponse {
  queuedCount: number
  skippedCount: number
  message: string
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

export interface SpecDataset {
  id?: number
  name: string
  dataScript: string
  tableData?: string
  orderIndex: number
  isActive: boolean
  visibleToStudent?: boolean
}

export interface ExamSpecification {
  id?: number
  name: string
  // backward-compat for old payloads
  ddlScript?: string
  ddlVisibleToStudent?: boolean
  visibleToStudent?: boolean
  schemaDiagram?: string
  schemaDiagramVisibleToStudent?: boolean
  schemaJson?: string | import('@/lib/types').SpecificationSchemaJsonTable[]
  description: string
  entities: SpecEntity[]
  datasets?: SpecDataset[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateExamQuestionBatch {
  content: string
  correctQuery: string
  verifyScript: string
  difficultyLevel?: number
  points: number
  orderIndex?: number
  questionType: string
  gradingRubric?: string
}

export interface CreateExamQuestionsBatchRequest {
  questions: CreateExamQuestionBatch[]
}

export interface UpdateExamQuestionRequest {
  content: string
  correctQuery: string
  verifyScript: string
  difficultyLevel?: number
  points: number
  orderIndex?: number
  questionType: string
  gradingRubric?: string
}

// ===== Grading Rubric Types (Polymorphic Architecture) =====

export type SyntaxErrorAction = 'FAIL_ALL' | 'PARTIAL'
export type MissingPenaltyAction = 'SKIP_TABLE' | 'ZERO_POINTS'
export type ConstraintType =
  | 'PRIMARY_KEY'
  | 'FOREIGN_KEY'
  | 'CHECK'
  | 'DEFAULT'
  | 'UNIQUE'

export interface GradingSettings {
  syntax_error_action: SyntaxErrorAction
  case_sensitive_names: boolean
  allow_implicit_constraints: boolean
  positive_only_scoring?: boolean
}

export interface RubricColumn {
  name: string
  expected_type: string
  is_nullable: boolean
  points: number
  type_mismatch_penalty: number
}

export interface RubricConstraint {
  type: ConstraintType
  columns: string[]
  points: number
  missing_penalty: number
  references_table?: string
  references_columns?: string[]
  expression?: string
}

export interface RubricTable {
  expected_name: string
  existence_points: number
  missing_penalty_action: MissingPenaltyAction
  columns: RubricColumn[]
  constraints: RubricConstraint[]
}

export interface CreateTableGradingPayload {
  grading_settings: GradingSettings
  tables: RubricTable[]
}

export interface GradingRubric {
  total_points: number
  question_category: string
  grading_payload:
    | CreateTableGradingPayload
    | InsertDataGradingPayload
    | SelectQueryGradingPayload
    | Record<string, unknown>
}

// === INSERT_DATA Grading Types ===

export interface InsertDataGradingSettings {
  depends_on_question_id?: string
  syntax_error_action?: SyntaxErrorAction
  allow_extra_rows: boolean
  penalty_per_extra_row: number
}

export type MatchType = 'EXACT' | 'IGNORE_CASE_AND_SPACE' | 'NUMERIC_TOLERANCE'

export interface InsertDataColumnConfig {
  name: string
  is_primary_key: boolean
  points: number
  match_type: MatchType
}

export interface InsertDataExpectedRow {
  [columnName: string]: string | number | boolean | null
}

export interface InsertDataExpectedDataset {
  table_name: string
  table_points: number
  row_grading_strategy: string
  missing_row_penalty: number
  columns_config: InsertDataColumnConfig[]
  expected_data: InsertDataExpectedRow[]
}

export interface InsertDataGradingPayload {
  grading_settings: InsertDataGradingSettings
  tables: InsertDataExpectedDataset[]
}

// === SELECT_QUERY Grading Types ===

export interface SelectGlobalGradingRules {
  baseline_weight_ratio: number
  wrong_order_penalty: number
  wrong_column_order_penalty: number
  extra_row_penalty: number
  strict_ordering?: boolean
  check_column_names?: boolean
  wrong_column_name_penalty?: number
  allow_partial_row_credit?: boolean
}

export interface SelectExpectedColumnConfig {
  column_name: string
  data_type: string
}

export interface SelectExpectedResult {
  expected_row_count: number
  columns_config: SelectExpectedColumnConfig[]
  rows: Array<Array<string | number | boolean | null>>
}

export interface SelectTestCase {
  case_id: string
  case_name: string
  is_hidden: boolean
  weight_ratio: number
  setup_dependency_id?: string
  setup_custom_script?: string
  expected_result: SelectExpectedResult
}

export interface SelectQueryGradingPayload {
  global_grading_rules: SelectGlobalGradingRules
  test_cases: SelectTestCase[]
}

export interface SaveExamSpecificationRequest {
  name: string
  title: string
  ddlScript?: string
  ddlVisibleToStudent?: boolean
  visibleToStudent?: boolean
  schemaDiagram?: string
  schemaDiagramVisibleToStudent?: boolean
  description: string
  datasets?: {
    id?: number
    name: string
    dataScript: string
    orderIndex: number
    isActive: boolean
  }[]
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
