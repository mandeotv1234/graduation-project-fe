'use client'

import { ExamQuestionItem, StudentExamDetail } from '@/lib/types'
import { useExamTake } from '@/app/(main)/student/exams/[examId]/take/hooks/use-exam-take'
import { useEffect, useState, useCallback } from 'react'
import { startExamSession, getExamTime } from '@/lib/actions/anti-cheat.action'
import { useAntiCheat } from '@/hooks/use-anti-cheat'
import { useExamTimer } from '@/hooks/use-exam-timer'
import { useExamSocket } from '@/hooks/use-exam-socket'
import { ExamTakeHeader } from '@/app/(main)/student/exams/[examId]/take/components/exam-take-header'
import { QuestionSidebar } from '@/app/(main)/student/exams/[examId]/take/components/question-sidebar'
import { QuestionPanel } from '@/app/(main)/student/exams/[examId]/take/components/question-panel'
import { QuestionNavigation } from '@/app/(main)/student/exams/[examId]/take/components/question-navigation'
import { SqlEditorPanel } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel'
import { ResultPanel } from '@/app/(main)/student/exams/[examId]/take/components/result-panel'
import { ConfirmSubmitDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-submit-dialog'
import { SubmitResultDialog } from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog'
import { ViolationWarningModal } from '@/app/(main)/exam/components/violation-warning-modal'

interface ExamTakeInterfaceProps {
  exam: StudentExamDetail
  questions: ExamQuestionItem[]
}

export function ExamTakeInterface({ exam, questions }: ExamTakeInterfaceProps) {
  // Always call hooks at the top
  const [sessionStarted, setSessionStarted] = useState(false)
  const [initialSeconds, setInitialSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Exam logic hooks (always called, never conditionally)
  const examTake = useExamTake(exam, questions)

  const handleForceSubmit = useCallback(() => {
    examTake.handleConfirmSubmit()
  }, [examTake])

  const { setServerTime } = useExamTimer({
    examId: exam.examId,
    initialSeconds,
    enabled: sessionStarted
  })
  useAntiCheat({
    examId: exam.examId,
    enabled: sessionStarted,
    onForceSubmit: handleForceSubmit
  })
  useExamSocket({
    examId: exam.examId,
    enabled: sessionStarted,
    onForceSubmit: handleForceSubmit,
    onTimeSync: setServerTime
  })

  // Only conditionally render UI, never call hooks conditionally
  useEffect(() => {
    async function initSession() {
      setLoading(true)
      setError(null)
      try {
        const sessionRes = await startExamSession(exam.examId)
        if (sessionRes.data && sessionRes.data.sessionStarted) {
          if (sessionRes.data.remainingSeconds > 0) {
            setInitialSeconds(sessionRes.data.remainingSeconds)
          } else {
            // Fallback: get exam time
            const timeRes = await getExamTime(exam.examId)
            if (timeRes.data && timeRes.data.remainingSeconds > 0) {
              setInitialSeconds(timeRes.data.remainingSeconds)
            }
          }
          setSessionStarted(true)
        } else {
          setError(sessionRes.data?.message || 'Không thể bắt đầu phiên thi.')
        }
      } catch (err) {
        // Re-throw Next.js redirects to prevent them from being swallowed
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
          throw err
        }

        let errorObj: Record<string, unknown> = {}
        try {
          if (typeof err === 'string') errorObj = JSON.parse(err)
          else if (err && typeof err === 'object')
            errorObj = err as Record<string, unknown>
        } catch {
          /* parse error */
        }

        const errCode = errorObj?.code as string | undefined
        const errMessage = errorObj?.message as string | undefined

        if (
          errCode === '401' ||
          errCode === 'UNAUTHORIZED' ||
          errMessage === 'Access Denied'
        ) {
          if (typeof window !== 'undefined') window.location.href = '/login'
          return
        }

        if (
          errCode === 'BAD_REQUEST' ||
          errMessage?.includes('expired') ||
          errMessage?.includes('ended')
        ) {
          setError(errMessage || 'Bài thi đã kết thúc hoặc quá hạn.')
        } else {
          setError('Lỗi khi khởi tạo phiên thi.')
        }
      } finally {
        setLoading(false)
      }
    }
    initSession()
  }, [exam.examId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Đang tải phiên thi...
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    )
  }

  if (examTake.isSubmitted && examTake.submitResult) {
    return (
      <SubmitResultDialog
        result={examTake.submitResult}
        onBack={examTake.handleBackToExams}
      />
    )
  }

  return (
    <>
      <ViolationWarningModal />
      <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col overflow-hidden">
        <ExamTakeHeader
          answeredCount={examTake.answeredCount}
          totalQuestions={questions.length}
          isLoading={examTake.isLoading}
          onSubmit={examTake.handleRequestSubmit}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Question sidebar (large screens) */}
          <QuestionSidebar
            questions={questions}
            currentIndex={examTake.currentQuestionIndex}
            answers={examTake.answers}
            onSelect={examTake.goToQuestion}
          />

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Left: Question description + Navigation */}
            <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
              <div className="flex-1 overflow-auto p-6">
                {examTake.currentQuestion && (
                  <QuestionPanel question={examTake.currentQuestion} />
                )}
              </div>

              {/* Question navigation bar */}
              <div className="shrink-0 border-t border-border bg-card/50 px-6 py-3">
                <QuestionNavigation
                  questions={questions}
                  currentIndex={examTake.currentQuestionIndex}
                  answers={examTake.answers}
                  onNavigate={examTake.goToQuestion}
                />
              </div>
            </div>

            {/* Right: SQL Editor + Result */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden border-b border-border">
                {examTake.currentQuestion && (
                  <SqlEditorPanel
                    value={examTake.answers[examTake.currentQuestion.id] || ''}
                    onChange={(val: string) =>
                      examTake.updateAnswer(examTake.currentQuestion.id, val)
                    }
                    onExecute={examTake.handleExecuteSql}
                    isLoading={examTake.isLoading}
                  />
                )}
              </div>

              <div className="h-64 overflow-auto">
                <ResultPanel result={examTake.sqlResult} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom confirmation dialog */}
      <ConfirmSubmitDialog
        open={examTake.showConfirmDialog}
        onOpenChange={examTake.setShowConfirmDialog}
        onConfirm={examTake.handleConfirmSubmit}
        unansweredCount={examTake.unansweredCount}
        totalQuestions={questions.length}
        isLoading={examTake.isLoading}
      />
    </>
  )
}
