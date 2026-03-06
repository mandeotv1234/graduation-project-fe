/**
 * Parse a date string from backend (Java LocalDateTime) into a Date object.
 *
 * Java's LocalDateTime serializes WITHOUT timezone (e.g. "2026-03-04T12:33:58.4437").
 * According to ISO 8601, date-only strings are UTC, but date-time without zone
 * should be treated as local. However, some browsers treat "T" format as UTC.
 *
 * To ensure consistent "local time" interpretation, we replace 'T' with ' '
 * which forces JS to parse as local time in all browsers.
 */
export function parseBackendDate(dateStr: string): Date {
  // "2026-03-04T12:33:58.4437" → "2026-03-04 12:33:58.4437"
  // JS Date with space separator = local time (all browsers)
  // JS Date with 'T' separator = UTC in many browsers
  const localStr = dateStr.replace('T', ' ')
  return new Date(localStr)
}

/**
 * Convert a backend date string to a cookie-compatible Date expiry.
 * Uses parseBackendDate for correct timezone handling.
 */
export function toExpiryDate(dateStr: string): Date {
  const date = parseBackendDate(dateStr)
  // Sanity check — if parsing fails, set 1 hour from now
  if (isNaN(date.getTime())) {
    return new Date(Date.now() + 60 * 60 * 1000)
  }
  return date
}

/**
 * Format a backend date string to Vietnamese short date (dd/MM/yyyy).
 * Uses parseBackendDate for consistent timezone handling with Java LocalDateTime.
 */
export function formatDate(dateStr: string): string {
  return parseBackendDate(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format a backend date string to Vietnamese date + time (dd/MM/yyyy HH:mm).
 * Uses parseBackendDate for consistent timezone handling with Java LocalDateTime.
 */
export function formatDateTime(dateStr: string): string {
  return parseBackendDate(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get exam status based on start/end time from backend (Java LocalDateTime strings).
 */
export type ExamStatus = 'upcoming' | 'in_progress' | 'ended'

export function getExamStatus(startTime: string, endTime: string): ExamStatus {
  const now = new Date()
  const start = parseBackendDate(startTime)
  const end = parseBackendDate(endTime)

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
