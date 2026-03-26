'use client'
import { Button } from '@/components/ui/button'
import { Database } from 'lucide-react'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { formatTime } from '@/lib/utils'
import { ViolationBanner } from '@/app/(main)/exam/components/violation-banner/violation-banner'
import styles from '@/app/(main)/exam/components/exam-header/exam-header.module.scss'

interface ExamHeaderProps {
  timeLeft: number
  onSubmit?: () => void
}

export default function ExamHeader({ timeLeft, onSubmit }: ExamHeaderProps) {
  const time = formatTime(timeLeft)
  const isUrgent = timeLeft <= 5 * 60 // < 5 phút

  return (
    <header className={styles.headerContainer}>
      <div className={styles.brandSection}>
        <Database className={styles.brandIcon} />
        <span className={styles.brandText}>SQL Learning Platform</span>
      </div>
      <div className={styles.headerActions}>
        {/* Anti-cheat status */}
        <ViolationBanner />

        {/* Timer - compact version on mobile, full on desktop */}
        <div
          className={`${styles.timerDisplay} ${
            isUrgent
              ? 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700'
              : 'bg-secondary border-input'
          }`}
        >
          <div className="flex flex-col items-center min-w-6 sm:min-w-8">
            <span
              className={`${styles.timerValue} ${
                isUrgent ? 'text-red-600 dark:text-red-400' : ''
              }`}
            >
              {String(time.h).padStart(2, '0')}
            </span>
            <span className={`${styles.timerLabel} hidden sm:inline`}>Giờ</span>
          </div>
          <span
            className={`${styles.timerValue} pb-0 sm:pb-3 ${
              isUrgent
                ? 'text-red-600 dark:text-red-400 animate-pulse'
                : 'text-muted-foreground'
            }`}
          >
            :
          </span>
          <div className="flex flex-col items-center min-w-6 sm:min-w-8">
            <span
              className={`${styles.timerValue} ${
                isUrgent ? 'text-red-600 dark:text-red-400' : ''
              }`}
            >
              {String(time.m).padStart(2, '0')}
            </span>
            <span className={`${styles.timerLabel} hidden sm:inline`}>
              Phút
            </span>
          </div>
          <span
            className={`${styles.timerValue} pb-0 sm:pb-3 ${
              isUrgent
                ? 'text-red-600 dark:text-red-400 animate-pulse'
                : 'text-muted-foreground'
            }`}
          >
            :
          </span>
          <div className="flex flex-col items-center min-w-6 sm:min-w-8">
            <span
              className={`${styles.timerValue} ${
                isUrgent ? 'text-red-600 dark:text-red-400' : ''
              }`}
            >
              {String(time.s).padStart(2, '0')}
            </span>
            <span className={`${styles.timerLabel} hidden sm:inline`}>
              Giây
            </span>
          </div>
        </div>
        <ModeToggle />
        <Button onClick={onSubmit} className={styles.submitButton}>
          Nộp bài
        </Button>
      </div>
    </header>
  )
}
