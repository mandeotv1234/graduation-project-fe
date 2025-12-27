'use client'

import { useState } from 'react'
import ExamHeader from './exam-header'
import QuestionList from './question-list'
import ExamEditor from './exam-editor'
import ExamBottomPanel from './exam-bottom-panel'
import { ResizablePanel } from '@/components/shared'
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
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">
      <ExamHeader />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Question List */}
        <QuestionList
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={setSelectedQuestionId}
        />

        {/* Right: Editor + Bottom Panel with Resizer */}
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
          <ResizablePanel defaultSize={60} minSize={30} maxSize={80}>
            <ExamEditor question={currentQuestion} />
            <ExamBottomPanel tables={tables} />
          </ResizablePanel>
        </div>
      </div>
    </div>
  )
}
