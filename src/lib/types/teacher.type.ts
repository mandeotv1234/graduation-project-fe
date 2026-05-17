import { ExamSettings } from './exam.type'
import type { SpecificationSchemaJsonTable } from './specification-schema-json.type'

// ===== Pagination Types =====
export interface PaginationMeta {
  page: number
  size: number
  total: number
}

export interface PaginatedApiResponse<T> {
  data?: T[]
  meta?: {
    timestamp: string
    pagination?: PaginationMeta
  }
  code: string
  message: string
}

// ===== Class Types =====

// GET /api/classes → GetClassesResponseDto
export interface ClassListItem {
  id: number
  classCode: string
  creatorId: number
  semester: string
  createdAt: string
}

// GET /api/classes/{classId} → GetClassDetailResponseDto
export interface ClassDetail {
  id: number
  classCode: string
  creatorId: number
  semester: string
  createdAt: string
}

// POST /api/classes → CreateClassRequestDto / CreateClassResponseDto
export interface CreateClassStudentInfo {
  studentId: string
  fullName: string
}

export interface CreateClassRequest {
  classCode: string
  semester: string
  students: CreateClassStudentInfo[]
}

export interface CreateClassResponse {
  id: number
  classCode: string
  semester: string
  creatorId: number
  createdAt: string
}

export interface ClassTeacher {
  id: number
  email: string
  fullName: string
  addedAt: string
  isCreator: boolean
}

export interface AddTeacherToClassRequest {
  email: string
}

// GET /api/classes/{classId}/students → GetStudentsInClassResponseDto
export interface StudentInClass {
  id: number
  email: string
  fullName: string
  createdAt: string
}

// ===== Exam (Teacher) Types =====

// GET /api/classes/{classId}/exams → CreateExamResponseDto (reused)
export interface ClassExamItem {
  id: number
  specificationId?: number | null
  classId: number
  creatorId: number
  title: string
  durationMinutes: number
  startTime: string
  endTime: string
  isPublished: boolean
  createdAt: string
}

// POST /api/exams → CreateExamRequestDto
// ExamSettings is defined in exam.type.ts

export interface CreateExamRequest {
  /** Bỏ qua hoặc 0 nếu chưa gắn đặc tả. */
  specificationId?: number | null
  classId: number
  title: string
  durationMinutes: number
  startTime?: string
  endTime?: string
  description?: string
  maxAttempts?: number
  lateThreshold?: number
  settings?: ExamSettings
  isPublished?: boolean
}

export interface CreateExamResponse {
  id: number
  specificationId?: number | null
  classId: number
  creatorId: number
  title: string
  durationMinutes: number
  startTime?: string
  endTime?: string
  isPublished: boolean
  createdAt: string
  description?: string
  maxAttempts?: number
  lateThreshold?: number
  settings?: ExamSettings
  pdfFilePath?: string | null
  originalPdfFileName?: string | null
}

export interface UpdateTeacherExamSettingsRequest {
  title: string
  durationMinutes: number
  startTime?: string
  endTime?: string
  description?: string
  maxAttempts?: number
  lateThreshold?: number
  settings?: ExamSettings
  isPublished?: boolean
}

// GET /api/exams/{examId}/teacher-detail
export interface TeacherExamDetail {
  id: number
  classId: number
  title: string
  specificationId?: number | null
  durationMinutes: number
  startTime: string | null
  endTime: string | null
  description?: string
  isPublished: boolean
  maxAttempts: number
  lateThreshold: number
  settings: ExamSettings
  pdfFilePath?: string | null
  originalPdfFileName?: string | null
}

// GET /api/exams/{examId}/monitor
export interface TeacherExamMonitorStudent {
  studentId: number
  studentEmail: string
  studentName: string
  violationCount: number
  latestViolationType?: string | null
  latestViolationDescription?: string | null
  latestViolationAt?: string | null
  autoSubmitted: boolean
  status: 'NORMAL' | 'VIOLATING' | 'AUTO_SUBMITTED' | string
  examStatus:
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'AUTO_SUBMITTED'
    | string
}

export interface TeacherExamMonitorData {
  examId: number
  examTitle: string
  classId: number
  classCode: string
  startTime?: string | null
  endTime?: string | null
  isPublished: boolean
  totalStudents: number
  totalViolators: number
  totalHighRisk?: number
  totalFilteredStudents?: number
  students: TeacherExamMonitorStudent[]
}

// PUT /api/exams/{examId} — mọi field optional (PATCH-style); field có trong body mới cập nhật
export interface UpdateExamRequest {
  title?: string
  /** Gửi `0` để gỡ đặc tả; bỏ field nếu không đổi. */
  specificationId?: number | null
  durationMinutes?: number
  startTime?: string | null
  endTime?: string | null
  description?: string
  isPublished?: boolean
  maxAttempts?: number
  lateThreshold?: number
  settings?: ExamSettings
}

// POST /api/exams/{examId}/questions → CreateExamQuestionRequestDto
export interface CreateExamQuestionRequest {
  content: string
  correctQuery: string
  difficultyLevel?: number
  points: number
  orderIndex?: number
  questionType: string
  verifyScript?: string
}

// ===== Specification Types =====

export interface SpecificationDataset {
  /** Present on API responses; omit for newly created datasets in save payloads. */
  id?: number
  name: string
  dataScript: string
  /** JSON string of tabular preview rows (builder / API detail). */
  tableData?: string
  orderIndex: number
  isActive: boolean
}

export interface SpecificationEntityAttribute {
  attributeName: string
  dataType: string
  description?: string
  isPrimaryKey: boolean
  isNullable: boolean
  orderIndex: number
}

export interface SpecificationEntity {
  id?: number
  entityName: string
  displayName?: string
  description?: string
  orderIndex: number
  attributes: SpecificationEntityAttribute[]
}

export interface SpecificationResponse {
  id: number
  name: string
  description?: string
  entities: SpecificationEntity[]
  datasets: SpecificationDataset[]
  createdBy?: number
  updatedBy?: number
  createdAt: string
  updatedAt: string
}

export interface SpecificationDetailResponse {
  id: number
  name: string
  description?: string
  ddlScript: string
  /**
   * API may return a JSON string or an already-parsed array (Jackson JsonNode → JSON array).
   */
  schemaJson: string | SpecificationSchemaJsonTable[]
  entities: SpecificationEntity[]
  datasets: SpecificationDataset[]
  createdBy?: number
  updatedBy?: number
  createdAt: string
  updatedAt: string
}

export interface CreateSpecificationRequest {
  name: string
  ddlScript: string
  ddlVisibleToStudent?: boolean
  description?: string
  schemaJson?: SpecificationSchemaJsonTable[]
  entities?: SpecificationEntity[]
  datasets: SpecificationDataset[]
}
