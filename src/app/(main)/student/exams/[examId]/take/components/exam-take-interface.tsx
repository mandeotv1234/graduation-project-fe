'use client'

import { ExamQuestionItem, StudentExamDetail } from '@/lib/types'
import { useExamTake } from '@/app/(main)/student/exams/[examId]/take/hooks/use-exam-take'
import { ExamTakeHeader } from '@/app/(main)/student/exams/[examId]/take/components/exam-take-header'
import { QuestionSidebar } from '@/app/(main)/student/exams/[examId]/take/components/question-sidebar'
import { QuestionPanel } from '@/app/(main)/student/exams/[examId]/take/components/question-panel'
import { QuestionNavigation } from '@/app/(main)/student/exams/[examId]/take/components/question-navigation'
import { SqlEditorPanel } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel'
import { ResultPanel } from '@/app/(main)/student/exams/[examId]/take/components/result-panel'
import { ConfirmSubmitDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-submit-dialog'
import { SubmitResultDialog } from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog'

interface ExamTakeInterfaceProps {
  exam: StudentExamDetail
  questions: ExamQuestionItem[]
}

export function ExamTakeInterface({ exam, questions }: ExamTakeInterfaceProps) {
  const {
    currentQuestion,
    currentQuestionIndex,
    answers,
    sqlResult,
    submitResult,
    isSubmitted,
    isLoading,
    answeredCount,
    unansweredCount,
    showConfirmDialog,
    setShowConfirmDialog,
    updateAnswer,
    goToQuestion,
    handleExecuteSql,
    handleRequestSubmit,
    handleConfirmSubmit,
    handleBackToExams
  } = useExamTake(exam, questions)

  if (isSubmitted && submitResult) {
    return (
      <SubmitResultDialog result={submitResult} onBack={handleBackToExams} />
    )
  }

  return (
    <>
      <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col overflow-hidden">
        <ExamTakeHeader
          answeredCount={answeredCount}
          totalQuestions={questions.length}
          isLoading={isLoading}
          onSubmit={handleRequestSubmit}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Question sidebar (large screens) */}
          <QuestionSidebar
            questions={questions}
            currentIndex={currentQuestionIndex}
            answers={answers}
            onSelect={goToQuestion}
          />

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Left: Question description + Navigation */}
            <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
              <div className="flex-1 overflow-auto p-6">
                {currentQuestion && (
                  <QuestionPanel question={currentQuestion} />
                )}
              </div>

              {/* Question navigation bar */}
              <div className="shrink-0 border-t border-border bg-card/50 px-6 py-3">
                <QuestionNavigation
                  questions={questions}
                  currentIndex={currentQuestionIndex}
                  answers={answers}
                  onNavigate={goToQuestion}
                />
              </div>
            </div>

            {/* Right: SQL Editor + Result */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden border-b border-border">
                {currentQuestion && (
                  <SqlEditorPanel
                    value={answers[currentQuestion.id] || ''}
                    onChange={(val: string) =>
                      updateAnswer(currentQuestion.id, val)
                    }
                    onExecute={handleExecuteSql}
                    isLoading={isLoading}
                  />
                )}
              </div>

              <div className="h-64 overflow-auto">
                <ResultPanel result={sqlResult} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom confirmation dialog */}
      <ConfirmSubmitDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmSubmit}
        unansweredCount={unansweredCount}
        totalQuestions={questions.length}
        isLoading={isLoading}
      />
    </>
  )
}
