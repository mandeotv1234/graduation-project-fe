// Exam template library
export interface ExamTemplateListItem {
  sourceExamId: number
  latestTemplateId: number
  latestVersion: number
  versionCount: number
  title: string
  description: string
  sharedByName: string
  questionCount: number
  latestSharedAt: string
}

export interface ExamTemplateVersionItem {
  templateId: number
  sourceExamId: number
  version: number
  title: string
  description: string
  sharedByName: string
  questionCount: number
  createdAt: string
  isVisible: boolean
}

export interface TeacherExamTemplateVersionsResponse {
  canManage: boolean
  versions: ExamTemplateVersionItem[]
}

// Request types
export interface ShareExamAsTemplateRequest {
  examId: number
}

export interface CloneExamTemplateRequest {
  classId: number
}

export interface UpdateExamTemplateVisibilityRequest {
  isVisible: boolean
}

// Response types
export interface ShareExamAsTemplateResponse {
  templateId: number
  sourceExamId: number
  version: number
  questionCount: number
}

export interface CloneExamTemplateResponse {
  examId: number
  title: string
  questionCount: number
}
