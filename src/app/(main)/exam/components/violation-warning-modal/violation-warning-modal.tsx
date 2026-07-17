'use client'

import { AlertTriangle, ShieldAlert, X } from 'lucide-react'

import styles from '@/app/(main)/exam/components/violation-warning-modal/violation-warning-modal.module.scss'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { resolveMaxViolations } from '@/lib/constants/violation'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { hideWarning } from '@/lib/redux/slices/anti-cheat.slice'

interface ViolationWarningModalProps {
  maxViolations?: number
  autoSubmitOnViolation?: boolean
}

export function ViolationWarningModal({
  maxViolations,
  autoSubmitOnViolation = false
}: ViolationWarningModalProps) {
  const dispatch = useAppDispatch()
  const {
    isWarningVisible,
    warningMessage,
    totalViolations,
    isForceSubmitted
  } = useAppSelector((state) => state.antiCheat)
  const isDev = process.env.NEXT_PUBLIC_ENV === 'development'
  const violationLimit = resolveMaxViolations(maxViolations)

  if (isDev) return null

  const isForceSubmit = isForceSubmitted
  const severity = isForceSubmit
    ? 'critical'
    : autoSubmitOnViolation && totalViolations >= violationLimit / 2
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

        {autoSubmitOnViolation && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Số lần vi phạm: </span>
              <span className={`${styles.progressCount} ${styles[severity]}`}>
                {totalViolations} / {violationLimit}
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${styles[severity]}`}
                style={{
                  width: `${Math.min((totalViolations / violationLimit) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        )}

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
