'use client'

import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import DOMPurify from 'dompurify'
import { SqlViewer } from '@/components/shared/sql-viewer/sql-viewer'
import type { QuestionResultDetail } from '@/lib/types'

interface ResultQuestionListProps {
  questionResults: QuestionResultDetail[]
}

export function ResultQuestionList({
  questionResults
}: ResultQuestionListProps) {
  return (
    <div className="space-y-4">
      {questionResults.map((q, index) => (
        <div
          key={q.questionId}
          className="bg-card border rounded-xl overflow-hidden"
        >
          <div className="p-5 border-b flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Câu {index + 1}
              </span>
              <div
                className="font-medium text-foreground"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(q.content)
                }}
              />
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span
                className={cn(
                  'flex items-center gap-1.5 text-sm font-bold',
                  q.isCorrect
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {q.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {q.scoreEarned} / {q.maxPoints} đ
              </span>
              <Badge variant="outline" className="text-[10px] uppercase">
                {q.questionType}
              </Badge>
            </div>
          </div>

          <div className="p-5 space-y-4 bg-muted/30">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                Câu truy vấn của bạn:
              </label>
              <div className="rounded-lg overflow-hidden border border-white/10">
                <SqlViewer value={q.studentQuery || '-- Trống'} />
              </div>
            </div>

            {q.correctQuery && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70 uppercase flex items-center gap-1.5">
                  Đáp án tham khảo:
                </label>
                <div className="rounded-lg overflow-hidden border border-emerald-500/20">
                  <SqlViewer value={q.correctQuery} />
                </div>
              </div>
            )}

            {q.errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex gap-3">
                <Info className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-red-700 dark:text-red-400">
                    Lỗi thực thi:
                  </p>
                  <p className="text-xs text-red-600/80 font-mono break-all leading-relaxed">
                    {q.errorMessage}
                  </p>
                </div>
              </div>
            )}

            {q.teacherComment && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1">
                  Nhận xét của giáo viên:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 italic">
                  &quot;{q.teacherComment}&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
