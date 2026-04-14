/**
 * Parse a date string from backend (Java LocalDateTime) into a Date object.
 * Returns Invalid Date when input is nullish.
 */
export function parseBackendDate(dateStr?: string | null): Date {
  if (!dateStr) return new Date(NaN)
  const localStr = dateStr.replace('T', ' ')
  return new Date(localStr)
}

/**
 * Convert a backend date string to a cookie-compatible Date expiry.
 */
export function toExpiryDate(dateStr?: string | null): Date {
  const date = parseBackendDate(dateStr)
  if (isNaN(date.getTime())) {
    return new Date(Date.now() + 60 * 60 * 1000)
  }
  return date
}

/**
 * Format a backend date string to Vietnamese short date (dd/MM/yyyy).
 */
export function formatDate(dateStr?: string | null): string {
  const date = parseBackendDate(dateStr)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format a backend date string to Vietnamese date + time (dd/MM/yyyy HH:mm).
 */
export function formatDateTime(dateStr?: string | null): string {
  const date = parseBackendDate(dateStr)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get exam status based on start/end time from backend.
 */
export type ExamStatus = 'upcoming' | 'in_progress' | 'ended'

export function getExamStatus(
  startTime?: string | null,
  endTime?: string | null
): ExamStatus {
  const now = new Date()
  const start = parseBackendDate(startTime)
  const end = parseBackendDate(endTime)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'upcoming'
  }

  if (now < start) return 'upcoming'
  if (now > end) return 'ended'
  return 'in_progress'
}

/**
 * Format seconds to {h, m, s} breakdown.
 */
export function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return { h, m, s }
}
