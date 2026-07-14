'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  PaginatedApiResponse,
  ClassListItem,
  ClassDetail,
  ClassTeacher,
  CreateClassRequest,
  CreateClassResponse,
  StudentInClass,
  ClassExamItem,
  AddTeacherToClassRequest,
  TeacherExamResult,
  TeacherExamResultDetail,
  TeacherStudentProgressResponse,
  CreateExamRequest,
  CreateExamResponse,
  UpdateTeacherExamSettingsRequest,
  TeacherExamTemplateVersionsResponse,
  SpecificationResponse,
  SpecificationDetailResponse,
  CreateSpecificationRequest,
  OverrideSubmissionRequest,
  OverrideSubmissionResponse,
  RegradeResponse,
  RegradeAllRequest,
  RegradeAllResponse,
  RulePreset,
  CreateRulePresetRequest,
  ExamStatistics,
  ExamMutationAnalytics,
  TeacherSqlExecutionResult,
  BannedStudentInfo,
  MoodleSqlImportPreviewResponse,
  MoodleSqlImportConfirmResponse
} from '@/lib/types'
import { getCookie } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

async function postMultipart<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  try {
    const accessToken = await getCookie('accessToken')
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      credentials: 'include',
      cache: 'no-store',
      body: formData
    })

    const text = await response.text()
    const parsed = text
      ? (JSON.parse(text) as ApiResponse<T>)
      : ({ code: String(response.status), message: 'OK' } as ApiResponse<T>)

    if (!response.ok) {
      return {
        code: parsed.code || String(response.status),
        message: parsed.message || response.statusText || 'Request failed',
        data: undefined
      }
    }

    return parsed
  } catch (error: unknown) {
    return {
      code: 'ERROR',
      message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      data: undefined
    }
  }
}

// ===== Classes =====

export async function getClasses(
  page = 1,
  size = 10,
  sortBy = 'CREATED_AT',
  sortOrder = 'DESC'
): Promise<PaginatedApiResponse<ClassListItem>> {
  return apiClient.get(ENDPOINTS.CLASSES, {
    queries: { page, size, sortBy, sortOrder },
    cache: 'no-store'
  }) as Promise<PaginatedApiResponse<ClassListItem>>
}

export async function getClassDetail(
  classId: number
): Promise<ApiResponse<ClassDetail>> {
  return apiClient.get<ClassDetail>(ENDPOINTS.CLASS_DETAIL(classId), {
    cache: 'no-store'
  })
}

export async function createClass(
  data: CreateClassRequest
): Promise<ApiResponse<CreateClassResponse>> {
  return apiClient.post<CreateClassResponse>(ENDPOINTS.CLASSES, data)
}

export async function updateClass(
  classId: number,
  data: CreateClassRequest
): Promise<ApiResponse<CreateClassResponse>> {
  return apiClient.put<CreateClassResponse>(
    ENDPOINTS.CLASS_DETAIL(classId),
    data
  )
}

export async function getStudentsInClass(
  classId: number,
  page = 1,
  size = 10,
  sortBy = 'FULL_NAME',
  sortOrder = 'ASC'
): Promise<PaginatedApiResponse<StudentInClass>> {
  return apiClient.get(ENDPOINTS.CLASS_STUDENTS(classId), {
    queries: { page, size, sortBy, sortOrder },
    cache: 'no-store'
  }) as Promise<PaginatedApiResponse<StudentInClass>>
}

export async function getTeacherStudentProgress(
  classId: number,
  studentId: number
): Promise<ApiResponse<TeacherStudentProgressResponse>> {
  return apiClient.get<TeacherStudentProgressResponse>(
    ENDPOINTS.CLASS_STUDENT_PROGRESS(classId, studentId),
    { cache: 'no-store' }
  )
}

export async function getClassExams(
  classId: number
): Promise<ApiResponse<ClassExamItem[]>> {
  return apiClient.get<ClassExamItem[]>(ENDPOINTS.CLASS_EXAMS(classId), {
    cache: 'no-store'
  })
}

export async function getClassTeachers(
  classId: number
): Promise<ApiResponse<ClassTeacher[]>> {
  return apiClient.get<ClassTeacher[]>(ENDPOINTS.CLASS_TEACHERS(classId), {
    cache: 'no-store'
  })
}

export async function addTeacherToClass(
  classId: number,
  data: AddTeacherToClassRequest
): Promise<ApiResponse<null>> {
  return apiClient.post<null>(ENDPOINTS.CLASS_TEACHERS(classId), data)
}

export async function removeTeacherFromClass(
  classId: number,
  teacherId: number
): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(ENDPOINTS.CLASS_TEACHER(classId, teacherId))
}

export async function deleteClass(classId: number): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(ENDPOINTS.CLASS_DETAIL(classId))
}

export async function restoreClass(
  classId: number
): Promise<ApiResponse<null>> {
  return apiClient.post<null>(ENDPOINTS.CLASS_RESTORE(classId), {})
}

// ===== Class Bans =====

export async function getClassBans(
  classId: number,
  page = 0,
  size = 100
): Promise<PaginatedApiResponse<BannedStudentInfo>> {
  return apiClient.get(ENDPOINTS.CLASS_BANS(classId), {
    queries: { page, size },
    cache: 'no-store'
  }) as Promise<PaginatedApiResponse<BannedStudentInfo>>
}

export async function banStudent(
  classId: number,
  body: { studentId: number; reason: string }
): Promise<ApiResponse<null>> {
  return apiClient.post<null>(ENDPOINTS.CLASS_BANS(classId), body)
}

export async function unbanStudent(
  classId: number,
  studentId: number
): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(ENDPOINTS.CLASS_UNBAN(classId, studentId))
}

// ===== Exams =====

export async function createExam(
  data: CreateExamRequest
): Promise<ApiResponse<CreateExamResponse>> {
  return apiClient.post<CreateExamResponse>(ENDPOINTS.CREATE_EXAM, data)
}

export async function getTeacherExamSettings(
  examId: number
): Promise<ApiResponse<CreateExamResponse>> {
  return apiClient.get<CreateExamResponse>(
    ENDPOINTS.TEACHER_EXAM_SETTINGS(examId),
    { cache: 'no-store' }
  )
}

export async function updateTeacherExamSettings(
  examId: number,
  data: UpdateTeacherExamSettingsRequest
): Promise<ApiResponse<CreateExamResponse>> {
  return apiClient.put<CreateExamResponse>(
    ENDPOINTS.TEACHER_EXAM_SETTINGS(examId),
    data
  )
}

export async function getTeacherExamTemplateVersions(
  examId: number
): Promise<ApiResponse<TeacherExamTemplateVersionsResponse>> {
  return apiClient.get<TeacherExamTemplateVersionsResponse>(
    ENDPOINTS.TEACHER_EXAM_TEMPLATE_VERSIONS(examId),
    { cache: 'no-store' }
  )
}

export async function getExamResults(
  examId: number,
  params: {
    page?: number
    size?: number
    keyword?: string
    scoreFilter?: string
    encounterMode?: string
    sortOrder?: string
  } = {}
): Promise<PaginatedApiResponse<TeacherExamResult>> {
  return apiClient.get(ENDPOINTS.EXAM_RESULTS(examId), {
    queries: {
      page: params.page ?? 1,
      size: params.size ?? 5,
      keyword: params.keyword ?? '',
      scoreFilter: params.scoreFilter ?? 'all',
      encounterMode: params.encounterMode ?? 'all',
      sortOrder: params.sortOrder ?? 'timeDesc'
    },
    cache: 'no-store'
  }) as Promise<PaginatedApiResponse<TeacherExamResult>>
}

export async function getTeacherSubmissionDetail(
  examId: number,
  resultId: number
): Promise<ApiResponse<TeacherExamResultDetail>> {
  return apiClient.get<TeacherExamResultDetail>(
    ENDPOINTS.EXAM_RESULT_DETAIL(examId, resultId),
    { cache: 'no-store' }
  )
}

export async function previewMoodleSqlImport(
  examId: number,
  formData: FormData
): Promise<ApiResponse<MoodleSqlImportPreviewResponse>> {
  return postMultipart<MoodleSqlImportPreviewResponse>(
    ENDPOINTS.EXAM_MOODLE_SQL_IMPORT_PREVIEW(examId),
    formData
  )
}

export async function confirmMoodleSqlImport(
  examId: number,
  formData: FormData
): Promise<ApiResponse<MoodleSqlImportConfirmResponse>> {
  return postMultipart<MoodleSqlImportConfirmResponse>(
    ENDPOINTS.EXAM_MOODLE_SQL_IMPORT_CONFIRM(examId),
    formData
  )
}

// ===== Override & Re-grade =====

export async function overrideSubmissionScore(
  examId: number,
  resultId: number,
  submissionId: number,
  data: OverrideSubmissionRequest
): Promise<ApiResponse<OverrideSubmissionResponse>> {
  return apiClient.patch<OverrideSubmissionResponse>(
    ENDPOINTS.EXAM_OVERRIDE_SUBMISSION(examId, resultId, submissionId),
    data
  )
}

export async function regradeExamResult(
  examId: number,
  resultId: number
): Promise<ApiResponse<RegradeResponse>> {
  return apiClient.post<RegradeResponse>(
    ENDPOINTS.EXAM_REGRADE_RESULT(examId, resultId)
  )
}

export async function regradeAllExamResults(
  examId: number,
  data?: RegradeAllRequest
): Promise<ApiResponse<RegradeAllResponse>> {
  return apiClient.post<RegradeAllResponse>(
    ENDPOINTS.EXAM_REGRADE_ALL(examId),
    data
  )
}

export async function getExamStatistics(
  examId: number
): Promise<ApiResponse<ExamStatistics>> {
  return apiClient.get<ExamStatistics>(ENDPOINTS.EXAM_STATISTICS(examId), {
    cache: 'no-store'
  })
}

export async function getExamMutationAnalytics(
  examId: number
): Promise<ApiResponse<ExamMutationAnalytics>> {
  return apiClient.get<ExamMutationAnalytics>(
    ENDPOINTS.EXAM_MUTATION_ANALYTICS(examId),
    { cache: 'no-store' }
  )
}

// ===== Rule Presets =====

export async function getRulePresets(
  questionType: string,
  kind?: string
): Promise<ApiResponse<RulePreset[]>> {
  const queries: Record<string, string> = { questionType }
  if (kind) queries.kind = kind
  return apiClient.get<RulePreset[]>(ENDPOINTS.RULE_PRESETS, {
    queries,
    cache: 'no-store'
  })
}

export async function createRulePreset(
  data: CreateRulePresetRequest
): Promise<ApiResponse<RulePreset>> {
  return apiClient.post<RulePreset>(ENDPOINTS.RULE_PRESETS, data)
}

export async function updateRulePreset(
  id: number,
  data: { name: string; rulesJson: string }
): Promise<ApiResponse<RulePreset>> {
  return apiClient.put<RulePreset>(ENDPOINTS.RULE_PRESET_UPDATE(id), data)
}

export async function deleteRulePreset(id: number): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(ENDPOINTS.RULE_PRESET_DELETE(id))
}

// ===== Specifications =====

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
  return apiClient.post<SpecificationResponse>(ENDPOINTS.SPECIFICATIONS, data)
}

export async function getSpecificationDetail(
  specificationId: number
): Promise<ApiResponse<SpecificationDetailResponse>> {
  return apiClient.get<SpecificationDetailResponse>(
    ENDPOINTS.SPECIFICATION_DETAIL(specificationId),
    { cache: 'no-store' }
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

// ===== Teacher Result SQL Operations =====

export async function teacherExecuteSqlOnResult(
  examId: number,
  resultId: number,
  sql: string
): Promise<ApiResponse<TeacherSqlExecutionResult>> {
  return apiClient.post<TeacherSqlExecutionResult>(
    ENDPOINTS.TEACHER_RESULT_EXECUTE_SQL(examId, resultId),
    { sql }
  )
}

export async function teacherResetResultSchema(
  examId: number,
  resultId: number
): Promise<ApiResponse<null>> {
  return apiClient.post<null>(
    ENDPOINTS.TEACHER_RESULT_RESET_SCHEMA(examId, resultId)
  )
}

export async function dropAllExamSchemas(
  examId: number
): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(ENDPOINTS.EXAM_DROP_ALL_SCHEMAS(examId))
}

export async function getStudentDashboard(
  studentId: number
): Promise<ApiResponse<import('@/lib/types').StudentDashboardResponse>> {
  return apiClient.get<import('@/lib/types').StudentDashboardResponse>(
    `/teacher/students/${studentId}/dashboard`,
    { cache: 'no-store' }
  )
}
