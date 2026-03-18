'use client'

import { ExamQuestionItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface QuestionSidebarProps {
  questions: ExamQuestionItem[]
  currentIndex: number
  answers: Record<number, string>
  onSelect: (index: number) => void
  header?: React.ReactNode
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
  onSelect,
  header
}: QuestionSidebarProps) {
  return (
    <div className="hidden w-[180px] xl:w-[200px] shrink-0 overflow-auto border-r border-border bg-card/40 lg:block scrollbar-thin">
      <div className="p-2">
        {header ? <div className="mb-3">{header}</div> : null}
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          <span>Danh sách câu hỏi</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">
            {questions.length}
          </span>
        </h3>

        <div className="space-y-2">
          {questions.map((q, index) => {
            const isActive = index === currentIndex
            const hasAnswer = !!answers[q.id]?.trim()

            return (
              <button
                key={q.id}
                onClick={() => onSelect(index)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition-all duration-200 group relative overflow-hidden',
                  isActive
                    ? 'bg-primary/5 border border-primary/20 shadow-sm'
                    : 'border border-transparent hover:bg-muted/60 hover:border-border/50'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
                )}
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all shadow-sm',
                    isActive
                      ? 'bg-primary text-primary-foreground scale-110 shadow-primary/20'
                      : hasAnswer
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-secondary text-muted-foreground group-hover:bg-muted-foreground/10'
                  )}
                >
                  {q.orderIndex}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate font-medium transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-foreground group-hover:text-primary/80'
                    )}
                  >
                    Câu {q.orderIndex}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span className="inline-block max-w-[64px] truncate">
                      {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{q.points}đ</span>
                  </p>
                </div>

                {hasAnswer && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
