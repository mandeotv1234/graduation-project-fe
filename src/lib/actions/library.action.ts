'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  ExamTemplateListItem,
  ExamTemplateVersionItem,
  UpdateExamTemplateVisibilityRequest,
  ShareExamAsTemplateRequest,
  ShareExamAsTemplateResponse,
  CloneExamTemplateRequest,
  CloneExamTemplateResponse
} from '@/lib/types'

// ===== Exam Template Library =====

export async function getExamTemplates(): Promise<
  ApiResponse<ExamTemplateListItem[]>
> {
  return apiClient.get<ExamTemplateListItem[]>(
    ENDPOINTS.LIBRARY_EXAM_TEMPLATES,
    { cache: 'no-store' }
  )
}

export async function getExamTemplateVersions(
  sourceExamId: number
): Promise<ApiResponse<ExamTemplateVersionItem[]>> {
  return apiClient.get<ExamTemplateVersionItem[]>(
    ENDPOINTS.LIBRARY_EXAM_TEMPLATE_VERSIONS(sourceExamId),
    { cache: 'no-store' }
  )
}

export async function shareExamAsTemplate(
  data: ShareExamAsTemplateRequest
): Promise<ApiResponse<ShareExamAsTemplateResponse>> {
  return apiClient.post<ShareExamAsTemplateResponse>(
    ENDPOINTS.LIBRARY_EXAM_TEMPLATES,
    data
  )
}

export async function cloneExamTemplate(
  id: number,
  data: CloneExamTemplateRequest
): Promise<ApiResponse<CloneExamTemplateResponse>> {
  return apiClient.post<CloneExamTemplateResponse>(
    ENDPOINTS.LIBRARY_EXAM_TEMPLATE_CLONE(id),
    data
  )
}

export async function updateExamTemplateVisibility(
  templateId: number,
  data: UpdateExamTemplateVisibilityRequest
): Promise<ApiResponse<null>> {
  return apiClient.patch<null>(
    ENDPOINTS.LIBRARY_EXAM_TEMPLATE_VISIBILITY(templateId),
    data
  )
}

export async function hideExamTemplateLineage(
  sourceExamId: number
): Promise<ApiResponse<null>> {
  return apiClient.patch<null>(
    ENDPOINTS.LIBRARY_EXAM_TEMPLATE_LINEAGE_VISIBILITY(sourceExamId),
    { isVisible: false }
  )
}
