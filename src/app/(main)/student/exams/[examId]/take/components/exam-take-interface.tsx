'use client'

import {
  ExamQuestionItem,
  StudentExamDetail,
  ExamSpecification
} from '@/lib/types'
import { useExamTake } from '@/app/(main)/student/exams/[examId]/take/hooks/use-exam-take'
import { useEffect, useState, useCallback } from 'react'
import { startExamSession, getExamTime } from '@/lib/actions/anti-cheat.action'
import { getExamSpecification } from '@/lib/actions'
import { useAntiCheat } from '@/hooks/use-anti-cheat'
import { useExamTimer } from '@/hooks/use-exam-timer'
import { useExamSocket } from '@/hooks/use-exam-socket'
import { ExamTakeHeader } from '@/app/(main)/student/exams/[examId]/take/components/exam-take-header'
import { QuestionSidebar } from '@/app/(main)/student/exams/[examId]/take/components/question-sidebar'
import { QuestionPanel } from '@/app/(main)/student/exams/[examId]/take/components/question-panel'
import { QuestionNavigation } from '@/app/(main)/student/exams/[examId]/take/components/question-navigation'
import { SqlEditorPanel } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel'
import type { SchemaTable } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel'
import { ResultPanel } from '@/app/(main)/student/exams/[examId]/take/components/result-panel'
import { ConfirmSubmitDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-submit-dialog'
import { SubmitResultDialog } from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog'
import { ViolationWarningModal } from '@/app/(main)/exam/components/violation-warning-modal'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import { SpecificationPanel } from '@/app/(main)/student/exams/[examId]/take/components/specification-panel'
import { PageSpinner } from '@/components/shared'

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
  const [editorSchema, setEditorSchema] = useState<SchemaTable[]>([])

  // Exam logic hooks (always called, never conditionally)
  const examTake = useExamTake(exam, questions)

  const handleForceSubmit = useCallback(() => {
    examTake.handleConfirmSubmit()
  }, [examTake])

  const { setServerTime, remainingSeconds } = useExamTimer({
    examId: exam.examId,
    initialSeconds,
    enabled: sessionStarted
  })
  useAntiCheat({
    examId: exam.examId,
    enabled: sessionStarted
  })
  useExamSocket({
    examId: exam.examId,
    enabled: sessionStarted,
    onForceSubmit: handleForceSubmit,
    onTimeSync: setServerTime
  })

  // Fetch exam specification to provide schema IntelliSense in SQL editor
  useEffect(() => {
    getExamSpecification(exam.examId)
      .then((res) => {
        const spec: ExamSpecification | null = res.data ?? null
        if (!spec) return
        const tables: SchemaTable[] = spec.entities.map((entity) => ({
          tableName: entity.entityName,
          columns: entity.attributes.map((attr) => ({
            name: attr.attributeName,
            type: attr.dataType
          }))
        }))
        setEditorSchema(tables)
      })
      .catch(() => {
        /* silent – IntelliSense just won't have schema context */
      })
  }, [exam.examId])

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
    return <PageSpinner label="Đang tải phiên thi..." />
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
      <div className="flex h-[calc(100dvh-65px)] flex-col overflow-hidden">
        <ExamTakeHeader
          answeredCount={examTake.answeredCount}
          totalQuestions={questions.length}
          remainingSeconds={remainingSeconds}
          isLoading={examTake.isLoading}
          onSubmit={examTake.handleRequestSubmit}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* DB Specification panel (collapsible) */}
          <SpecificationPanel examId={exam.examId} />

          {/* Question sidebar (large screens) */}
          <QuestionSidebar
            questions={questions}
            currentIndex={examTake.currentQuestionIndex}
            answers={examTake.answers}
            onSelect={examTake.goToQuestion}
          />

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden md:flex-row bg-muted/20">
            {/* Left: Question description + Navigation */}
            <div className="flex flex-col md:w-[45%] lg:w-[35%] xl:w-[30%] flex-1 md:flex-none overflow-hidden border-b md:border-b-0 md:border-r border-border bg-background shadow-sm z-10">
              <div className="flex-1 overflow-auto p-4 sm:p-5 lg:p-6 scrollbar-thin">
                {examTake.currentQuestion && (
                  <QuestionPanel question={examTake.currentQuestion} />
                )}
              </div>

              {/* Question navigation bar */}
              <div className="shrink-0 border-t border-border bg-muted/10 px-4 py-3 sm:px-5 lg:px-6">
                <QuestionNavigation
                  questions={questions}
                  currentIndex={examTake.currentQuestionIndex}
                  answers={examTake.answers}
                  onNavigate={examTake.goToQuestion}
                />
              </div>
            </div>

            {/* Right: SQL Editor + Result */}
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
              <ResizablePanel defaultSize={60} minSize={20} maxSize={80}>
                {/* Editor Section */}
                <div className="flex h-full flex-col">
                  {examTake.currentQuestion && (
                    <SqlEditorPanel
                      value={
                        examTake.answers[examTake.currentQuestion.id] || ''
                      }
                      onChange={(val: string) =>
                        examTake.updateAnswer(examTake.currentQuestion.id, val)
                      }
                      onExecute={examTake.handleExecuteSql}
                      isLoading={examTake.isLoading}
                      schema={editorSchema}
                    />
                  )}
                </div>

                {/* Result Section */}
                <div className="flex h-full flex-col bg-background">
                  <ResultPanel result={examTake.sqlResult} />
                </div>
              </ResizablePanel>
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
