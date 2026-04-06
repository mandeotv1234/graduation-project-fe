'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'
import {
  subscribeToConnect,
  subscribeToTeacherGradingResult,
  subscribeToTeacherNotifications
} from '@/lib/socket'
import { GradingNotificationDto, DeviceConflictPendingEvent } from '@/lib/types'
import { getMe } from '@/lib/actions'
import { DeviceConflictDialog } from '@/app/(main)/exam/components/device-conflict-dialog/device-conflict-dialog'

export function TeacherNotificationHandler() {
  const pathname = usePathname()
  const [pendingConflicts, setPendingConflicts] = useState<
    DeviceConflictPendingEvent[]
  >([])

  // We only want to listen if we are in the teacher section
  const isTeacherSection = pathname.startsWith('/teacher')

  useEffect(() => {
    if (!isTeacherSection) return

    let unsubscribeGrading: (() => void) | undefined
    let unSubConnect: (() => void) | undefined
    let unsubscribeGlobal: (() => void) | undefined

    // 1. Subscribe to specific exam grading results if on exam page
    const examIdMatch = pathname.match(/\/teacher\/exams\/(\d+)/)
    const examId = examIdMatch ? Number(examIdMatch[1]) : null

    if (examId) {
      unSubConnect = subscribeToConnect(() => {
        if (unsubscribeGrading) {
          unsubscribeGrading()
        }

        unsubscribeGrading = subscribeToTeacherGradingResult(
          examId,
          (rawNotification: unknown) => {
            const notification = rawNotification as GradingNotificationDto
            const isResultsPage = window.location.pathname.endsWith('/results')
            if (isResultsPage) return

            const score = notification.totalScore || notification.score || 0

            // Optionally notify other components via event
            window.dispatchEvent(
              new CustomEvent('teacher-grading-result', {
                detail: { examId, notification }
              })
            )

            // Only show toast if not already on results page and we're in monitor
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
            } else {
              // Generic toast for other teacher pages
              toast.info(
                `Học sinh ${notification.studentName || 'Học sinh'} vừa hoàn thành bài thi`,
                {
                  description: `Điểm số: ${score}.`,
                  action: {
                    label: 'Xem kết quả',
                    onClick: () =>
                      (window.location.href = `/teacher/exams/${examId}/results`)
                  }
                }
              )
            }
          }
        )
      })
    }

    // 2. Subscribe to GLOBAL teacher notifications (e.g. device conflicts from anywhere)
    getMe().then((res) => {
      if (res.data) {
        unsubscribeGlobal = subscribeToTeacherNotifications(
          res.data.id,
          (notification: unknown) => {
            const event = notification as DeviceConflictPendingEvent
            if (event.type === 'DEVICE_CONFLICT_PENDING') {
              setPendingConflicts((prev) => [...prev, event])
              toast.warning('Có yêu cầu chuyển thiết bị mới cần duyệt!', {
                description: `Sinh viên: ${event.studentName}`
              })
            }
          }
        )
      }
    })

    return () => {
      unSubConnect?.()
      unsubscribeGrading?.()
      unsubscribeGlobal?.()
    }
  }, [pathname, isTeacherSection])

  if (!isTeacherSection) return null

  return (
    <>
      {pendingConflicts.length > 0 && (
        <DeviceConflictDialog
          conflict={pendingConflicts[0]}
          onDismiss={() => {
            setPendingConflicts((prev) => prev.slice(1))
          }}
        />
      )}
    </>
  )
}
