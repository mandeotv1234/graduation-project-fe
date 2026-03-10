// ===== Teacher Notification Types (from API) =====

// GET /api/notifications → TeacherNotificationResponseDto
export interface TeacherNotificationDto {
  id: number
  teacherId: number
  examId: number
  studentId: number
  studentName: string
  violationType: string
  description: string
  violationCount: number
  autoSubmitted: boolean
  isRead: boolean
  createdAt: string
}

// GET /api/notifications/unread-count → UnreadCountResponseDto
export interface UnreadCountDto {
  unreadCount: number
}
