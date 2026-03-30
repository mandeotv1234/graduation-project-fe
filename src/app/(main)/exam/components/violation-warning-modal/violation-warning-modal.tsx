'use client'

import { AlertTriangle, ShieldAlert, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { MAX_VIOLATIONS_BEFORE_SUBMIT } from '@/lib/constants/violation'
import { hideWarning } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import styles from '@/app/(main)/exam/components/violation-warning-modal/violation-warning-modal.module.scss'

export function ViolationWarningModal() {
  const dispatch = useAppDispatch()
  const { isWarningVisible, warningMessage, totalViolations } = useAppSelector(
    (state) => state.antiCheat
  )
  const isDev = process.env.NEXT_PUBLIC_ENV === 'development'

  if (isDev) return null

  const isForceSubmit = totalViolations >= MAX_VIOLATIONS_BEFORE_SUBMIT
  const severity =
    totalViolations >= MAX_VIOLATIONS_BEFORE_SUBMIT
      ? 'critical'
      : totalViolations >= MAX_VIOLATIONS_BEFORE_SUBMIT / 2
        ? 'high'
        : 'medium'

  const handleClose = () => {
    if (!isForceSubmit) {
      dispatch(hideWarning())
    }
  }

  return (
    <AlertDialog open={isWarningVisible} onOpenChange={handleClose}>
      <AlertDialogContent
        className={`${styles.modalContent} ${styles[severity]}`}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className={styles.modalHeader}>
            {severity === 'critical' ? (
              <ShieldAlert className={styles.criticalIcon} />
            ) : (
              <AlertTriangle className={styles.warningIcon} />
            )}
            <span className={`${styles.modalTitle} ${styles[severity]}`}>
              {severity === 'critical'
                ? 'Vi phạm nghiêm trọng!'
                : 'Cảnh báo vi phạm!'}
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription className={styles.modalDescription}>
            {warningMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Progress bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Số lần vi phạm:</span>
            <span className={`${styles.progressCount} ${styles[severity]}`}>
              {totalViolations} / {MAX_VIOLATIONS_BEFORE_SUBMIT}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${styles[severity]}`}
              style={{
                width: `${Math.min((totalViolations / MAX_VIOLATIONS_BEFORE_SUBMIT) * 100, 100)}%`
              }}
            />
          </div>
        </div>

        <AlertDialogFooter>
          {!isForceSubmit ? (
            <Button
              onClick={handleClose}
              variant="outline"
              className={styles.acknowledgeButton}
            >
              <X className={styles.buttonIcon} />
              Tôi đã hiểu, tiếp tục làm bài
            </Button>
          ) : (
            <p className={styles.forceSubmitMessage}>
              Bài thi đang được nộp tự động...
            </p>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
