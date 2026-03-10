'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  PaginatedApiResponse,
  TeacherNotificationDto,
  UnreadCountDto
} from '@/lib/types'

// ===== Teacher Notifications =====

export async function getNotifications(
  page = 1,
  size = 10
): Promise<PaginatedApiResponse<TeacherNotificationDto>> {
  return apiClient.get(ENDPOINTS.NOTIFICATIONS, {
    queries: { page, size },
    cache: 'no-store'
  }) as Promise<PaginatedApiResponse<TeacherNotificationDto>>
}

export async function getUnreadNotificationCount(): Promise<
  ApiResponse<UnreadCountDto>
> {
  return apiClient.get<UnreadCountDto>(ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT, {
    cache: 'no-store'
  })
}

export async function markNotificationRead(
  notificationId: number
): Promise<ApiResponse<null>> {
  return apiClient.patch<null>(ENDPOINTS.NOTIFICATION_READ(notificationId))
}

export async function markAllNotificationsRead(): Promise<ApiResponse<number>> {
  return apiClient.patch<number>(ENDPOINTS.NOTIFICATIONS_READ_ALL)
}

export async function deleteNotification(
  notificationId: number
): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(ENDPOINTS.NOTIFICATION_DELETE(notificationId))
}

export async function deleteAllNotifications(): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(ENDPOINTS.NOTIFICATIONS_DELETE_ALL)
}
