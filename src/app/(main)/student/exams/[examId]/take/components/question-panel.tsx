'use client'

import { ExamQuestionItem } from '@/lib/types'
import { Award, Hash } from 'lucide-react'

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
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {question.orderIndex}
          </span>
          <h2 className="text-xl font-semibold text-foreground">
            Câu {question.orderIndex}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${typeConfig.color}`}
          >
            <Hash className="mr-1 h-3 w-3" />
            {typeConfig.label}
          </span>
          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Award className="mr-1 h-3 w-3" />
            {question.points} điểm
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Đề bài
        </h3>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {question.content}
        </div>
      </div>
    </div>
  )
}
