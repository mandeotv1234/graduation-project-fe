'use client'

import DOMPurify from 'dompurify'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SqlViewer } from '@/components/shared/sql-viewer/sql-viewer'
import type { QuestionResultDetail } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ResultQuestionListProps {
  questionResults: QuestionResultDetail[]
}

export function ResultQuestionList({
  questionResults
}: ResultQuestionListProps) {
  return (
    <main className="min-w-0 space-y-5">
      {questionResults.map((question, index) => (
        <QuestionResultCard
          key={question.questionId}
          question={question}
          index={index}
        />
      ))}
    </main>
  )
}

function QuestionResultCard({
  question,
  index
}: {
  question: QuestionResultDetail
  index: number
}) {
  const isSuccess = question.isCorrect && !question.errorMessage

  return (
    <article
      id={`question-${question.questionId}`}
      className="scroll-mt-5 overflow-hidden rounded-lg border bg-card shadow-xs"
    >
      <header className="flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">
              Câu {index + 1}
            </h2>
            <Badge variant="secondary" className="text-[10px] uppercase">
              {question.questionType}
            </Badge>
          </div>
          <div
            className="text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(question.content)
            }}
          />
        </div>

        <div
          className={cn(
            'inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-sm font-bold',
            isSuccess
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
          )}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {formatScore(question.scoreEarned)} /{' '}
          {formatScore(question.maxPoints)}đ
        </div>
      </header>

      <div className="space-y-5 bg-muted/20 p-5">
        <SqlBlock
          label="Câu truy vấn của bạn"
          value={question.studentQuery || '-- Trống'}
        />

        {question.correctQuery && (
          <SqlBlock label="Đáp án tham khảo" value={question.correctQuery} />
        )}

        {question.errorMessage && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">
                Lỗi thực thi
              </p>
              <p className="break-words font-mono text-xs leading-relaxed text-red-700/90 dark:text-red-300">
                {question.errorMessage}
              </p>
            </div>
          </div>
        )}

        {question.teacherComment && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4" />
              Nhận xét của giáo viên
            </div>
            <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-300">
              {question.teacherComment}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}

function SqlBlock({ label, value }: { label: string; value: string }) {
  return (
    <section className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-wide text-foreground">
        {label}
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <SqlViewer value={value} />
      </div>
    </section>
  )
}

function formatScore(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}
