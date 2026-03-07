'use client'

import { ExamQuestionItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface QuestionSidebarProps {
  questions: ExamQuestionItem[]
  currentIndex: number
  answers: Record<number, string>
  onSelect: (index: number) => void
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  CREATE_TABLE: 'CREATE',
  INSERT_DATA: 'INSERT',
  SELECT_QUERY: 'SELECT',
  TRIGGER: 'TRIGGER',
  FUNCTION: 'FUNCTION',
  STORED_PROCEDURE: 'SP'
}

export function QuestionSidebar({
  questions,
  currentIndex,
  answers,
  onSelect
}: QuestionSidebarProps) {
  return (
    <div className="hidden w-64 shrink-0 overflow-auto border-r border-border bg-card/50 lg:block">
      <div className="p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Danh sách câu hỏi
        </h3>

        <div className="space-y-1.5">
          {questions.map((q, index) => {
            const isActive = index === currentIndex
            const hasAnswer = !!answers[q.id]?.trim()

            return (
              <button
                key={q.id}
                onClick={() => onSelect(index)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : hasAnswer
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {q.orderIndex}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">Câu {q.orderIndex}</p>
                  <p className="text-xs text-muted-foreground">
                    {QUESTION_TYPE_LABELS[q.questionType] || q.questionType} ·{' '}
                    {q.points}đ
                  </p>
                </div>

                {hasAnswer && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
