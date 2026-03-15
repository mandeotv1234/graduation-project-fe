'use client'

import { Send, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Timer */}
        <div
          className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 font-mono text-base sm:text-lg font-bold tracking-wider transition-colors ${
            isWarningTime
              ? 'bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse'
              : 'bg-primary/10 text-primary'
          }`}
        >
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>{formatTime(remainingSeconds)}</span>
        </div>

        {/* Progress Info */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <span>
            Đã làm{' '}
            <span className="font-semibold text-foreground">
              {answeredCount}
            </span>
            /{totalQuestions} câu
          </span>
        </div>

        {/* Progress bar */}
        <div className="hidden lg:block h-2.5 w-32 xl:w-48 overflow-hidden rounded-full bg-secondary border border-border/50">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className="h-9 px-3 sm:h-10 sm:px-6 gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all hover:shadow-md"
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
