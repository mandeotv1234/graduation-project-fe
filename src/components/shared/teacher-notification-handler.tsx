'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'
import {
  subscribeToConnect,
  subscribeToTeacherGradingResult
} from '@/lib/socket'
import { GradingNotificationDto } from '@/lib/types'

export function TeacherNotificationHandler() {
  const pathname = usePathname()

  // We only want to listen if we are in the teacher section
  const isTeacherSection = pathname.startsWith('/teacher')

  useEffect(() => {
    if (!isTeacherSection) return

    // Since we don't have a global "all exams" topic yet,
    // we can only subscribe if we know the examId.
    const examIdMatch = pathname.match(/\/teacher\/exams\/(\d+)/)
    const examId = examIdMatch ? Number(examIdMatch[1]) : null

    if (!examId) return

    let unsubscribeSub: (() => void) | undefined

    const unSubConnect = subscribeToConnect(() => {
      if (unsubscribeSub) {
        unsubscribeSub()
      }

      unsubscribeSub = subscribeToTeacherGradingResult(
        examId,
        (rawNotification: unknown) => {
          const notification = rawNotification as GradingNotificationDto
          const isResultsPage = window.location.pathname.endsWith('/results')
          if (isResultsPage) return

          const score = notification.totalScore || notification.score || 0

          window.dispatchEvent(
            new CustomEvent('teacher-grading-result', {
              detail: { examId, notification }
            })
          )

          const isMonitorPage = window.location.pathname.endsWith('/monitor')
          if (isMonitorPage) {
            toast.info(
              `Học sinh ${notification.studentName || 'Học sinh'} vừa hoàn thành bài thi`,
              {
                id: `toast-grade-${examId}-${notification.studentId || notification.studentName}`,
                description: `Điểm số: ${score}. Xem chi tiết trong mục Kết quả.`,
                action: {
                  label: 'Xem',
                  onClick: () =>
                    (window.location.href = `/teacher/exams/${examId}/results`)
                }
              }
            )
          }
        }
      )
    })

    return () => {
      unSubConnect()
      unsubscribeSub?.()
    }
  }, [pathname, isTeacherSection])

  return null
}
