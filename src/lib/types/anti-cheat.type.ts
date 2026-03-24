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
  message: string
  serverTime: string
  examStartedAt: string
  examEndTime: string
  remainingSeconds: number
  durationMinutes: number
}

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
  status: string
  expired: boolean
}

// WebSocket violation notification payload (from teacher subscription)
export interface ViolationNotification {
  examId: number
  teacherId: number
  studentId: number
  studentName: string
  violationType: string
  description: string
  violationCount: number
  autoSubmitted: boolean
  timestamp: string
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
