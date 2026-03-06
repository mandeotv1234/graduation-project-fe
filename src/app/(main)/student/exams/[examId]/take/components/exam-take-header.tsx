'use client'

import { Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExamTakeHeaderProps {
  answeredCount: number
  totalQuestions: number
  isLoading: boolean
  onSubmit: () => void
}

export function ExamTakeHeader({
  answeredCount,
  totalQuestions,
  isLoading,
  onSubmit
}: ExamTakeHeaderProps) {
  const progress =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>
            <span className="font-semibold text-foreground">
              {answeredCount}
            </span>
            /{totalQuestions} câu đã trả lời
          </span>
        </div>

        {/* Progress bar */}
        <div className="hidden h-2 w-48 overflow-hidden rounded-full bg-muted sm:block">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
      >
        <Send className="h-4 w-4" />
        {isLoading ? 'Đang nộp...' : 'Nộp bài'}
      </Button>
    </div>
  )
}
