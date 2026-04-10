'use client'

import { ExamQuestionItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/question-sidebar/question-sidebar.module.scss'

interface QuestionSidebarProps {
  questions: ExamQuestionItem[]
  currentIndex: number
  answers: Record<number, string>
  onSelect: (index: number) => void
  onSelectOverview?: () => void
  isOverviewSelected?: boolean
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
  onSelectOverview,
  isOverviewSelected = false,
  header
}: QuestionSidebarProps) {
  return (
    <div className={cn(styles.container, 'scrollbar-thin')}>
      <div className={styles.inner}>
        {header ? <div className={styles.headerSlot}>{header}</div> : null}
        <h3 className={styles.heading}>
          <span>Danh sách câu hỏi</span>
          <span className={styles.countBadge}>{questions.length}</span>
        </h3>

        <div className={styles.list}>
          {onSelectOverview && (
            <button
              onClick={onSelectOverview}
              className={cn(
                styles.item,
                'group',
                isOverviewSelected ? styles.itemActive : styles.itemInactive
              )}
            >
              {isOverviewSelected && <div className={styles.activeStrip} />}
              <span
                className={cn(
                  styles.indexCircle,
                  isOverviewSelected
                    ? styles.indexCircleActive
                    : styles.indexCircleIdle
                )}
              >
                Đ
              </span>
              <div className={styles.content}>
                <p
                  className={cn(
                    styles.questionTitle,
                    isOverviewSelected
                      ? styles.questionTitleActive
                      : styles.questionTitleInactive
                  )}
                >
                  Đặc tả
                </p>
                <p className={styles.meta}>
                  <span className={styles.metaType}>SPEC</span>
                </p>
              </div>
            </button>
          )}

          {questions.map((q, index) => {
            const isActive = !isOverviewSelected && index === currentIndex
            const hasAnswer = !!answers[q.id]?.trim()

            return (
              <button
                key={q.id}
                onClick={() => onSelect(index)}
                className={cn(
                  styles.item,
                  'group',
                  isActive ? styles.itemActive : styles.itemInactive
                )}
              >
                {isActive && <div className={styles.activeStrip} />}
                <span
                  className={cn(
                    styles.indexCircle,
                    isActive
                      ? styles.indexCircleActive
                      : hasAnswer
                        ? styles.indexCircleAnswered
                        : styles.indexCircleIdle
                  )}
                >
                  {q.orderIndex}
                </span>

                <div className={styles.content}>
                  <p
                    className={cn(
                      styles.questionTitle,
                      isActive
                        ? styles.questionTitleActive
                        : styles.questionTitleInactive
                    )}
                  >
                    Câu {q.orderIndex}
                  </p>
                  <p className={styles.meta}>
                    <span className={styles.metaType}>
                      {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                    </span>
                    <span className={styles.metaDot} />
                    <span>{q.points}đ</span>
                  </p>
                </div>

                {hasAnswer && (
                  <div className={styles.answeredBadge}>
                    <span className={styles.answeredDot} />
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
