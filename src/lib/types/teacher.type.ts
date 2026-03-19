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
  specificationId: number
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
  specificationId: number
  classId: number
  title: string
  durationMinutes: number
  startTime?: string
  endTime?: string
  isPublished?: boolean
}

export interface CreateExamResponse {
  id: number
  specificationId: number
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

// ===== Specification Types =====

export interface SpecificationDataset {
  name: string
  dataScript: string
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
  entityName: string
  displayName?: string
  description?: string
  orderIndex: number
  attributes: SpecificationEntityAttribute[]
}

export interface SpecificationResponse {
  id: number
  name: string
  ddlScript: string
  description?: string
  entities: SpecificationEntity[]
  datasets: SpecificationDataset[]
  createdBy?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateSpecificationRequest {
  name: string
  ddlScript: string
  description?: string
  entities: SpecificationEntity[]
  datasets: SpecificationDataset[]
}
