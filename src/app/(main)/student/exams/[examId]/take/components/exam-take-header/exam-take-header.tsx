'use client'

import { Send, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/exam-take-header/exam-take-header.module.scss'

interface ExamTakeHeaderProps {
  answeredCount: number
  totalQuestions: number
  remainingSeconds: number
  isLoading: boolean
  onSubmit: () => void
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function ExamTakeHeader({
  answeredCount,
  totalQuestions,
  remainingSeconds,
  isLoading,
  onSubmit
}: ExamTakeHeaderProps) {
  const progress =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
  const isWarningTime = remainingSeconds > 0 && remainingSeconds < 300 // 5 minutes

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        {/* Timer */}
        <div
          className={cn(
            styles.timer,
            isWarningTime ? styles.timerWarning : styles.timerNormal
          )}
        >
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>{formatTime(remainingSeconds)}</span>
        </div>

        {/* Progress Info */}
        <div className={styles.progressInfo}>
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <span>
            Đã làm <span className={styles.answeredCount}>{answeredCount}</span>
            /{totalQuestions} câu
          </span>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className={styles.submitButton}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {isLoading ? 'Đang xử lý...' : 'Nộp bài ngay'}
        </span>
        <span className="sm:hidden">{isLoading ? '' : 'Nộp'}</span>
      </Button>
    </div>
  )
}
