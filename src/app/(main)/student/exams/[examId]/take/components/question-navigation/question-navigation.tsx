'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExamQuestionItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/question-navigation/question-navigation.module.scss'

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
    <div className={styles.container}>
      {/* Prev / Next buttons */}
      <div className={styles.navRow}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={!hasPrev}
          className={styles.navButton}
        >
          <ChevronLeft className="h-4 w-4" />
          Câu trước
        </Button>

        <span className={styles.indexLabel}>
          {currentIndex + 1} / {questions.length}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={!hasNext}
          className={styles.navButton}
        >
          Câu tiếp
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile question grid (visible on small screens where sidebar is hidden) */}
      <div className={styles.mobileGrid}>
        {questions.map((q, index) => {
          const isActive = index === currentIndex
          const hasAnswer = !!answers[q.id]?.trim()

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(index)}
              className={cn(
                styles.questionButton,
                isActive
                  ? styles.questionButtonActive
                  : hasAnswer
                    ? styles.questionButtonAnswered
                    : styles.questionButtonIdle
              )}
            >
              {q.orderIndex}
            </button>
          )
        })}
      </div>
    </div>
  )
}
