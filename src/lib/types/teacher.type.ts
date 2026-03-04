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
  teacherId: number
  semester: string
  createdAt: string
}

// GET /api/classes/{classId} → GetClassDetailResponseDto
export interface ClassDetail {
  id: number
  classCode: string
  teacherId: number
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
  teacherId: number
  createdAt: string
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
  templateId: number
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
export interface CreateExamRequest {
  templateId: number
  classId: number
  title: string
  durationMinutes: number
  startTime?: string
  endTime?: string
  isPublished?: boolean
}

export interface CreateExamResponse {
  id: number
  templateId: number
  classId: number
  creatorId: number
  title: string
  durationMinutes: number
  startTime: string
  endTime: string
  isPublished: boolean
  createdAt: string
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

// ===== Schema Template Types =====

// GET /api/schema-templates → SchemaTemplateResponseDto
export interface SchemaTemplate {
  id: number
  name: string
  ddlScript: string
  defaultDataScript: string
  createdBy: number
  createdAt: string
}

// POST /api/schema-templates → CreateSchemaTemplateRequestDto
export interface CreateSchemaTemplateRequest {
  name: string
  ddlScript: string
  defaultDataScript?: string
}
