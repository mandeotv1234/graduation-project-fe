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
  RegradeAllResponse,
  RulePreset,
  CreateRulePresetRequest,
  ExamStatistics
} from '@/lib/types'

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
  examId: number
): Promise<ApiResponse<TeacherExamResult[]>> {
  return apiClient.get<TeacherExamResult[]>(ENDPOINTS.EXAM_RESULTS(examId), {
    cache: 'no-store'
  })
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
  examId: number
): Promise<ApiResponse<RegradeAllResponse>> {
  return apiClient.post<RegradeAllResponse>(ENDPOINTS.EXAM_REGRADE_ALL(examId))
}

export async function getExamStatistics(
  examId: number
): Promise<ApiResponse<ExamStatistics>> {
  return apiClient.get<ExamStatistics>(ENDPOINTS.EXAM_STATISTICS(examId), {
    cache: 'no-store'
  })
}

// ===== Rule Presets =====

export async function getRulePresets(
  questionType: string
): Promise<ApiResponse<RulePreset[]>> {
  return apiClient.get<RulePreset[]>(ENDPOINTS.RULE_PRESETS, {
    queries: { questionType },
    cache: 'no-store'
  })
}

export async function createRulePreset(
  data: CreateRulePresetRequest
): Promise<ApiResponse<RulePreset>> {
  return apiClient.post<RulePreset>(ENDPOINTS.RULE_PRESETS, data)
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
