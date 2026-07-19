import { ViolationType } from '@/lib/constants/violation'

// ===== Violation Log Entry =====
export interface ViolationEntry {
  id: string
  type: ViolationType
  detail: string
  timestamp: string
  synced: boolean
}

// ===== API Types matching Backend DTOs =====

// POST /api/exams/{examId}/violations → ReportViolationRequestDto
export interface ReportViolationRequest {
  violationType: string
  description: string
}

// Response from POST /api/exams/{examId}/violations
export interface ReportViolationResponse {
  violationId: number
  examId: number
  studentId: number
  violationType: string
  description: string
  violationCount: number
  autoSubmitted: boolean
  message: string
  createdAt: string
}

// POST /api/exams/{examId}/start-session → StartExamSessionResponseDto
export interface StartExamSessionResponse {
  sessionStarted: boolean
  conflictPending: boolean
  conflictId: string | null
  message: string
  serverTime: string
  examStartedAt: string
  examEndTime: string
  remainingSeconds: number
  durationMinutes: number
}

// Teacher WebSocket: /topic/teacher/exam/{examId}/device-conflict
export interface DeviceConflictPendingEvent {
  type: 'DEVICE_CONFLICT_PENDING'
  conflictId: string
  examId: number
  studentId: number
  studentName: string
  studentEmail: string
  existingIpAddress: string
  existingUserAgent: string
  newIpAddress: string
  newUserAgent: string
  requestedAt: string
}

// Student WebSocket: /topic/student/{studentId}/exam-session
export type StudentExamSessionEvent =
  | {
      type: 'DEVICE_CONFLICT_APPROVED'
      examId: number
      conflictId: string
      message: string
    }
  | { type: 'SESSION_KICKED'; examId: number; message: string }
  | { type: 'DEVICE_CONFLICT_REJECTED'; examId: number; reason: string }

// GET /api/exams/{examId}/time → ExamTimeResponseDto
export interface ExamTimeResponse {
  examId: number
  serverTime: string
  examStartTime: string
  examEndTime: string
  studentStartedAt: string
  remainingSeconds: number
  secondsUntilStart: number
  durationMinutes: number
  status: 'WAITING' | 'IN_PROGRESS' | 'LATE_SUBMISSION' | 'ENDED'
  expired: boolean
}

// WebSocket violation notification payload (from teacher subscription)
export interface ViolationNotification {
  type?: string
  examId: number
  teacherId: number
  teacherIds?: number[]
  studentId: number
  studentName: string
  violationType: string
  description: string
  attemptNumber?: number
  violationCount: number
  autoSubmitted: boolean
  timestamp: string
  examStatus?: string
}

// GET /api/exams/{examId}/violations?studentId={studentId}
export interface TeacherExamViolation {
  id: number
  examId: number
  studentId: number
  attemptNumber?: number | null
  violationType: string
  description?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}
