'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import type { ApiResponse } from '@/lib/types'
import type { PaginatedApiResponse } from '@/lib/types/teacher.type'
import type {
  FeedbackItem,
  AdminUserItem,
  CreateAdminUserRequest,
  UpdateUserRoleResponse
} from '@/lib/types/admin.type'

export interface AdminPaginationParams {
  page?: number
  size?: number
}

export async function getAdminFeedbacks(
  params: AdminPaginationParams = {}
): Promise<PaginatedApiResponse<FeedbackItem>> {
  return apiClient.get(ENDPOINTS.ADMIN_FEEDBACKS, {
    queries: {
      ...(params.page !== undefined && { page: params.page }),
      ...(params.size !== undefined && { size: params.size })
    },
    cache: 'no-store'
  }) as Promise<PaginatedApiResponse<FeedbackItem>>
}

export async function getAdminFeedback(
  feedbackId: number
): Promise<ApiResponse<FeedbackItem>> {
  return apiClient.get<FeedbackItem>(ENDPOINTS.ADMIN_FEEDBACK(feedbackId), {
    cache: 'no-store'
  })
}

export async function getAdminUsers(
  params: AdminPaginationParams = {}
): Promise<PaginatedApiResponse<AdminUserItem>> {
  return apiClient.get(ENDPOINTS.ADMIN_USERS, {
    queries: {
      ...(params.page !== undefined && { page: params.page }),
      ...(params.size !== undefined && { size: params.size })
    },
    cache: 'no-store'
  }) as Promise<PaginatedApiResponse<AdminUserItem>>
}

export async function createAdminUser(
  request: CreateAdminUserRequest
): Promise<ApiResponse<AdminUserItem>> {
  return apiClient.post<AdminUserItem>(ENDPOINTS.ADMIN_USERS, request)
}

export async function updateUserRole(
  userId: number,
  role: string
): Promise<ApiResponse<UpdateUserRoleResponse>> {
  return apiClient.patch<UpdateUserRoleResponse>(
    ENDPOINTS.ADMIN_USER_ROLE(userId),
    { role }
  )
}
