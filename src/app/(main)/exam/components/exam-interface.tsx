'use client'

import { useState } from 'react'
import ExamHeader from './exam-header'
import QuestionList from './question-list'
import ExamEditor from './exam-editor'
import ExamSidebar from './exam-sidebar'
import { Question, TableSchema } from '@/lib/types'

interface ExamInterfaceProps {
  questions: Question[]
  tables: TableSchema[]
}

export default function ExamInterface({
  questions,
  tables
}: ExamInterfaceProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    questions[0]?.id || 1
  )
  const currentQuestion =
    questions.find((q) => q.id === selectedQuestionId) || questions[0]

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden">
      <ExamHeader />

      <div className="flex flex-1 min-h-0">
        <QuestionList
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={setSelectedQuestionId}
        />

        <ExamEditor question={currentQuestion} />

        <ExamSidebar tables={tables} />
      </div>
    </div>
  )
}
