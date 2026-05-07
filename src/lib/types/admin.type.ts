export interface FeedbackItem {
  id: number
  studentId: number
  studentName: string
  studentEmail: string
  examId: number
  uiUxRating: number
  systemReliabilityRating: number
  npsScore: number
  featureRequests?: string
  generalFeedback?: string
  createdAt: string
}

export interface AdminUserItem {
  id: number
  email: string
  fullName: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface UpdateUserRoleResponse {
  id: number
  email: string
  fullName: string
  role: string
}
