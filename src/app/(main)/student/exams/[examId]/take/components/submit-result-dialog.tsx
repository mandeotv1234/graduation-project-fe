'use client'

import {
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubmitExamResponse } from '@/lib/types'

interface SubmitResultDialogProps {
  result: SubmitExamResponse
  onBack: () => void
}

export function SubmitResultDialog({
  result,
  onBack
}: SubmitResultDialogProps) {
  const totalScore = result.totalScore ?? 0
  const maxScore = result.maxScore ?? 0
  const percentage =
    maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : '0'

  const isPassed = Number(percentage) >= 50

  return (
    <div className="flex min-h-[calc(100dvh-65px)] items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Score card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div
            className={`px-8 py-10 text-center ${
              isPassed
                ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
                : 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent'
            }`}
          >
            <div
              className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                isPassed ? 'bg-emerald-500/15' : 'bg-amber-500/15'
              }`}
            >
              <Trophy
                className={`h-10 w-10 ${
                  isPassed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              />
            </div>

            <h1 className="text-3xl font-bold text-foreground">
              Đã nộp bài thành công!
            </h1>

            <div className="mt-6 flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-4xl font-extrabold text-foreground">
                  {totalScore}/{maxScore}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Điểm số</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-4xl font-extrabold text-foreground">
                  {percentage}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Tỷ lệ</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-4xl font-extrabold text-foreground">
                  {result.correctCount ?? 0}/{result.totalQuestions ?? 0}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Đúng</p>
              </div>
            </div>
          </div>

          {/* Question results */}
          <div className="divide-y divide-border">
            <div className="px-8 py-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Chi tiết từng câu
              </h3>
            </div>

            {(result.questionResults || []).map((qr) => (
              <div
                key={qr.questionId}
                className="flex items-center justify-between px-8 py-3"
              >
                <div className="flex items-center gap-3">
                  {qr.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Câu {qr.orderIndex}
                    </p>
                    {qr.errorMessage && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {qr.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {qr.executionTimeMs}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    <span
                      className={
                        qr.isCorrect
                          ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground'
                      }
                    >
                      {qr.scoreEarned}/{qr.maxPoints}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về danh sách bài thi
          </Button>
        </div>
      </div>
    </div>
  )
}
