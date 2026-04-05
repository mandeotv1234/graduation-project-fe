'use client'

import { AlertTriangle, Send, ShieldAlert, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import styles from '@/app/(main)/student/exams/[examId]/take/components/confirm-submit-dialog/confirm-submit-dialog.module.scss'

interface ConfirmSubmitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  unansweredCount: number
  totalQuestions: number
  isLoading: boolean
}

export function ConfirmSubmitDialog({
  open,
  onOpenChange,
  onConfirm,
  unansweredCount,
  totalQuestions,
  isLoading
}: ConfirmSubmitDialogProps) {
  const hasUnanswered = unansweredCount > 0
  const answeredCount = totalQuestions - unansweredCount

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className={styles.headerContainer}>
            <div
              className={`${styles.iconContainer} ${
                hasUnanswered ? styles.warning : styles.success
              }`}
            >
              {hasUnanswered ? (
                <AlertTriangle className={styles.warningIcon} />
              ) : (
                <ShieldAlert className={styles.successIcon} />
              )}
            </div>
            <div className={styles.titleContainer}>
              <AlertDialogTitle className={styles.title}>
                {hasUnanswered
                  ? 'Bạn vẫn còn câu chưa trả lời!'
                  : 'Xác nhận nộp bài'}
              </AlertDialogTitle>
              <AlertDialogDescription className={styles.description}>
                {hasUnanswered
                  ? `Bạn đã trả lời ${answeredCount}/${totalQuestions} câu hỏi.`
                  : 'Bạn đã trả lời tất cả các câu hỏi.'}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Status summary */}
        <div className={styles.statusSummary}>
          <div className={styles.progressInfo}>
            <div className={styles.progressText}>
              <p className={styles.progressTitle}>Tiến độ làm bài</p>
              <p className={styles.progressSubtitle}>
                {answeredCount} câu đã trả lời · {unansweredCount} câu chưa trả
                lời
              </p>
            </div>
            <div className={styles.progressNumbers}>
              <p className={styles.progressRatio}>
                {answeredCount}/{totalQuestions}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className={styles.progressBarContainer}>
            <div
              className={`${styles.progressBar} ${
                hasUnanswered ? styles.warning : styles.success
              }`}
              style={{
                width: `${
                  totalQuestions > 0
                    ? (answeredCount / totalQuestions) * 100
                    : 0
                }%`
              }}
            />
          </div>
        </div>

        {hasUnanswered && (
          <p className={styles.warningMessage}>
            ⚠️ Những câu chưa trả lời sẽ được tính 0 điểm. Bạn có chắc chắn muốn
            nộp bài?
          </p>
        )}

        {!hasUnanswered && (
          <p className={styles.infoMessage}>
            Sau khi nộp bài, bạn sẽ không thể chỉnh sửa câu trả lời. Hãy kiểm
            tra kỹ trước khi nộp.
          </p>
        )}

        <AlertDialogFooter className={styles.footer}>
          <AlertDialogCancel
            disabled={isLoading}
            className={styles.cancelButton}
          >
            Quay lại làm bài
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={`${styles.submitButton} ${
              hasUnanswered ? styles.warning : styles.success
            }`}
          >
            {isLoading ? (
              <Loader2 className={styles.buttonIcon} />
            ) : (
              <Send className={styles.buttonIcon} />
            )}
            {isLoading ? 'Đang nộp bài...' : 'Nộp bài ngay'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
