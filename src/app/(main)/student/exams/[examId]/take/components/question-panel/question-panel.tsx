'use client'

import { ExamQuestionItem } from '@/lib/types'
import { Award, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/question-panel/question-panel.module.scss'

interface QuestionPanelProps {
  question: ExamQuestionItem
}

const QUESTION_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  CREATE_TABLE: {
    label: 'Tạo bảng',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  },
  INSERT_DATA: {
    label: 'Thêm dữ liệu',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  },
  SELECT_QUERY: {
    label: 'Truy vấn',
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
  },
  TRIGGER: {
    label: 'Trigger',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  },
  FUNCTION: {
    label: 'Function',
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
  },
  STORED_PROCEDURE: {
    label: 'Stored Procedure',
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
  }
}

export function QuestionPanel({ question }: QuestionPanelProps) {
  const typeConfig = QUESTION_TYPE_CONFIG[question.questionType] || {
    label: question.questionType,
    color: 'bg-muted text-muted-foreground'
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.headerMeta}>
          <h2 className={styles.questionTitle}>Câu {question.orderIndex}</h2>
          <span className={cn(styles.typeBadge, typeConfig.color)}>
            <Hash className="mr-1 h-3 w-3" />
            {typeConfig.label}
          </span>
          <span className={styles.pointsBadge}>
            <Award className="mr-1 h-3 w-3" />
            {question.points} điểm
          </span>
        </div>
      </div>

      <div className={styles.bodySection}>
        <h3 className={styles.sectionTitle}>Đề bài</h3>
        <div className="editor-container">
          <div
            className={cn(styles.contentHtml, 'ProseMirror')}
            dangerouslySetInnerHTML={{ __html: question.content || '' }}
          />
        </div>
      </div>
    </div>
  )
}
