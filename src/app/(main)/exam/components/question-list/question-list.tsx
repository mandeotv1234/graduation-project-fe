'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, Circle } from 'lucide-react'
import { Question } from '@/lib/types'
import styles from '@/app/(main)/exam/components/question-list/question-list.module.scss'

interface QuestionListProps {
  questions: Question[]
  selectedQuestionId: number
  onQuestionSelect: (id: number) => void
}

export default function QuestionList({
  questions,
  selectedQuestionId,
  onQuestionSelect
}: QuestionListProps) {
  return (
    <aside className={styles.sidebarContainer}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.examTitle}>SQL Final Exam</h2>
        <p className={styles.subtitle}>Danh sách câu hỏi</p>
      </div>
      <ScrollArea className={styles.scrollArea}>
        <div className={styles.questionListContainer}>
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => onQuestionSelect(q.id)}
              className={`${styles.questionItem} ${
                q.id === selectedQuestionId
                  ? styles.selected
                  : styles.unselected
              }`}
            >
              {q.id === selectedQuestionId ? (
                <CheckCircle2 className={styles.icon} />
              ) : (
                <Circle className={styles.icon} />
              )}
              <span className={styles.questionNumber}>Câu {q.id}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  )
}
