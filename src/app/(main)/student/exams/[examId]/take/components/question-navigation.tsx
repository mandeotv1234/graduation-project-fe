'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExamQuestionItem } from '@/lib/types'

interface QuestionNavigationProps {
  questions: ExamQuestionItem[]
  currentIndex: number
  answers: Record<number, string>
  onNavigate: (index: number) => void
}

export function QuestionNavigation({
  questions,
  currentIndex,
  answers,
  onNavigate
}: QuestionNavigationProps) {
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < questions.length - 1

  return (
    <div className="space-y-3">
      {/* Prev / Next buttons */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={!hasPrev}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Câu trước
        </Button>

        <span className="text-sm font-medium text-muted-foreground">
          {currentIndex + 1} / {questions.length}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={!hasNext}
          className="gap-1.5"
        >
          Câu tiếp
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile question grid (visible on small screens where sidebar is hidden) */}
      <div className="flex flex-wrap gap-1.5 lg:hidden">
        {questions.map((q, index) => {
          const isActive = index === currentIndex
          const hasAnswer = !!answers[q.id]?.trim()

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(index)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : hasAnswer
                    ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {q.orderIndex}
            </button>
          )
        })}
      </div>
    </div>
  )
}
