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
  AddTeacherToClassRequest
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

// ===== Specifications =====

export async function getSpecifications(): Promise<
  ApiResponse<SpecificationResponse[]>
> {
  return apiClient.get<SpecificationResponse[]>(ENDPOINTS.SPECIFICATIONS, {
    cache: 'no-store'
  })
}

export async function getSpecificationDetail(
  specificationId: number
): Promise<ApiResponse<SpecificationResponse>> {
  return apiClient.get<SpecificationResponse>(
    ENDPOINTS.SPECIFICATION_DETAIL(specificationId),
    {
      cache: 'no-store'
    }
  )
}

export async function createSpecification(
  data: CreateSpecificationRequest
): Promise<ApiResponse<SpecificationResponse>> {
  return apiClient.post<SpecificationResponse>(
    ENDPOINTS.SPECIFICATIONS_V2,
    data
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
