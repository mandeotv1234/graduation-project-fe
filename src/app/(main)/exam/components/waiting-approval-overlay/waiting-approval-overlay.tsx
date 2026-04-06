'use client'

import { useEffect, useState, useRef } from 'react'
import { Shield, Wifi, Clock } from 'lucide-react'
import {
  connectStomp,
  getStompClient,
  subscribeToStudentSession
} from '@/lib/socket'
import { StudentExamSessionEvent } from '@/lib/types'
import styles from './waiting-approval-overlay.module.scss'

interface WaitingApprovalOverlayProps {
  examId: number
  studentId: number
  conflictId: string
  examEndTime?: string // ISO string — if provided, auto-close when exam ends
  onApproved: () => void
  onRejected: (reason: string) => void
}

export function WaitingApprovalOverlay({
  examId,
  studentId,
  conflictId,
  examEndTime,
  onApproved,
  onRejected
}: WaitingApprovalOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const dismissedRef = useRef(false)

  // Use standard socket connection
  useEffect(() => {
    connectStomp()

    let unsubscribe: (() => void) | undefined

    const waitAndSubscribe = () => {
      const client = getStompClient()
      if (!client?.connected) return undefined

      return subscribeToStudentSession(studentId, (rawEvent) => {
        const event = rawEvent as StudentExamSessionEvent
        if (event.examId !== examId) return
        if (
          event.type === 'DEVICE_CONFLICT_APPROVED' &&
          event.conflictId === conflictId
        ) {
          dismissedRef.current = true
          onApproved()
        } else if (event.type === 'DEVICE_CONFLICT_REJECTED') {
          dismissedRef.current = true
          onRejected(
            event.reason ?? 'Giáo viên từ chối yêu cầu chuyển thiết bị.'
          )
        }
      })
    }

    const intervalId = setInterval(() => {
      if (!unsubscribe) {
        unsubscribe = waitAndSubscribe()
      }
    }, 2000)

    return () => {
      clearInterval(intervalId)
      unsubscribe?.()
    }
  }, [examId, studentId, conflictId, onApproved, onRejected])

  // Auto-close when exam time expires
  useEffect(() => {
    if (!examEndTime) return

    const endTime = new Date(examEndTime).getTime()
    if (isNaN(endTime)) return

    const checkExamExpiry = () => {
      if (dismissedRef.current) return
      const now = Date.now()
      if (now >= endTime) {
        dismissedRef.current = true
        onRejected('Phiên thi đã kết thúc. Vui lòng liên hệ giáo viên.')
      }
    }

    // Check immediately
    checkExamExpiry()

    // Check every second
    const id = setInterval(checkExamExpiry, 1000)
    return () => clearInterval(id)
  }, [examEndTime, onRejected])

  // Elapsed time counter
  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds((p) => p + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.iconRow}>
          <Shield className={styles.shieldIcon} />
        </div>
        <h2 className={styles.title}>Chờ giáo viên xác nhận</h2>
        <p className={styles.description}>
          Tài khoản của bạn đang trong một phiên thi ở{' '}
          <strong>thiết bị khác</strong>. Yêu cầu chuyển thiết bị đã gửi cho
          giáo viên.
        </p>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Wifi className={styles.infoIcon} />
            <span>Đang chờ phê duyệt từ giáo viên giám sát...</span>
          </div>
          <div className={styles.infoItem}>
            <Clock className={styles.infoIcon} />
            <span>Thời gian chờ: {formatElapsed(elapsedSeconds)}</span>
          </div>
        </div>

        <div className={styles.pulseDots}>
          <span />
          <span />
          <span />
        </div>

        <p className={styles.hint}>
          Trang này sẽ tự động tiếp tục khi giáo viên cho phép.
          <br />
          Không cần tải lại trang.
        </p>
      </div>
    </div>
  )
}
