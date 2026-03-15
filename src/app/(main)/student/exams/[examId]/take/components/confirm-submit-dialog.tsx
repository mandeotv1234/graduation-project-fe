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
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                hasUnanswered ? 'bg-amber-500/15' : 'bg-emerald-500/15'
              }`}
            >
              {hasUnanswered ? (
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-emerald-500" />
              )}
            </div>
            <div>
              <AlertDialogTitle>
                {hasUnanswered
                  ? 'Bạn vẫn còn câu chưa trả lời!'
                  : 'Xác nhận nộp bài'}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                {hasUnanswered
                  ? `Bạn đã trả lời ${answeredCount}/${totalQuestions} câu hỏi.`
                  : 'Bạn đã trả lời tất cả các câu hỏi.'}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Status summary */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Tiến độ làm bài
              </p>
              <p className="text-xs text-muted-foreground">
                {answeredCount} câu đã trả lời · {unansweredCount} câu chưa trả
                lời
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {answeredCount}/{totalQuestions}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                hasUnanswered
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
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
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ Những câu chưa trả lời sẽ được tính 0 điểm. Bạn có chắc chắn muốn
            nộp bài?
          </p>
        )}

        {!hasUnanswered && (
          <p className="text-sm text-muted-foreground">
            Sau khi nộp bài, bạn sẽ không thể chỉnh sửa câu trả lời. Hãy kiểm
            tra kỹ trước khi nộp.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Quay lại làm bài
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={
              hasUnanswered
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Đang nộp bài...' : 'Nộp bài ngay'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
