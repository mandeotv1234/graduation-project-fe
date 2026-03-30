'use client'

import {
  ExamQuestionItem,
  StudentExamDetail,
  ExamSpecification,
  SubmitExamResponse
} from '@/lib/types'
import { useExamTake } from '@/app/(main)/student/exams/[examId]/take/hooks/use-exam-take'
import { useEffect, useState, useCallback } from 'react'
import { getExamTime } from '@/lib/actions/anti-cheat.action'
import { getExamSpecification, getMe } from '@/lib/actions'
import { User as UserType } from '@/lib/types'
import { useAntiCheat } from '@/hooks/use-anti-cheat'
import { useExamTimer } from '@/hooks/use-exam-timer'
import { useExamSocket } from '@/hooks/use-exam-socket'
import { QuestionSidebar } from '@/app/(main)/student/exams/[examId]/take/components/question-sidebar'
import { QuestionPanel } from '@/app/(main)/student/exams/[examId]/take/components/question-panel'
import { SqlEditorPanel } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel'
import type { SchemaTable } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel'
import { ExamTakeBottomPanel } from '@/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel'
import { ConfirmSubmitDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-submit-dialog'
import { SubmitResultDialog } from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import { PageSpinner } from '@/components/shared/spinner'
import type { ExecuteSqlResponse } from '@/lib/types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Clock, Send, User } from 'lucide-react'
import { ViolationWarningModal } from '@/app/(main)/exam/components/violation-warning-modal/violation-warning-modal'

interface ExamTakeInterfaceProps {
  exam: StudentExamDetail
  questions: ExamQuestionItem[]
}

export function ExamTakeInterface({ exam, questions }: ExamTakeInterfaceProps) {
  // Always call hooks at the top
  const [sessionStarted, setSessionStarted] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [initialSeconds, setInitialSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editorSchema, setEditorSchema] = useState<SchemaTable[]>([])
  const [schemaMeta, setSchemaMeta] =
    useState<ExecuteSqlResponse['schema']>(null)

  const applySchemaMeta = useCallback(
    (schema: ExecuteSqlResponse['schema']) => {
      setSchemaMeta(schema)
      setEditorSchema(
        schema
          ? schema.map((table) => ({
              tableName: table.tableName,
              columns: table.columns.map((col) => ({
                name: col.columnName,
                type: col.dataType
              }))
            }))
          : []
      )
    },
    []
  )

  // Exam logic hooks (always called, never conditionally)
  const examTake = useExamTake(exam, questions)

  const handleForceSubmit = useCallback(() => {
    toast.info('Đã hết thời gian làm bài, hệ thống đang nộp bài tự động...')
    examTake.handleConfirmSubmit()
  }, [examTake])

  const examActive = sessionStarted && !examTake.isSubmitted

  const { setServerTime, remainingSeconds } = useExamTimer({
    examId: exam.examId,
    initialSeconds,
    enabled: examActive,
    allowOvertime: exam.settings?.allowOvertime,
    onTimeUp: !exam.settings?.allowOvertime ? handleForceSubmit : undefined
  })
  useAntiCheat({
    examId: exam.examId,
    enabled: examActive,
    settings: exam.settings
  })
  useExamSocket({
    examId: exam.examId,
    enabled: examActive,
    onForceSubmit: handleForceSubmit,
    onTimeSync: setServerTime,
    onGradingResult: (rawResult: unknown) => {
      const result = rawResult as {
        status: string
        reason?: string
      } & SubmitExamResponse
      if (result.status === 'COMPLETED') {
        examTake.setSubmitResult(result)
        examTake.setIsGrading(false)
        examTake.setIsSubmitted(true)
      } else if (result.status === 'FAILED') {
        toast.error(
          'Chấm bài thất bại: ' + (result.reason || 'Lỗi không xác định')
        )
        examTake.setIsGrading(false)
      }
    }
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

  const handleExecuteSqlAndRefreshSchema = useCallback(async () => {
    const res = await examTake.handleExecuteSql()

    const schema = res?.schema
    if (!schema || schema.length === 0) return

    applySchemaMeta(schema)
  }, [examTake, applySchemaMeta])

  const formatTime = useCallback((seconds: number): string => {
    const sAbs = Math.abs(seconds)
    const h = Math.floor(sAbs / 3600)
    const m = Math.floor((sAbs % 3600) / 60)
    const s = Math.floor(sAbs % 60)
    let text = ''
    if (h > 0) {
      text = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    } else {
      text = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return seconds < 0 ? `-${text}` : text
  }, [])

  // Only conditionally render UI, never call hooks conditionally
  useEffect(() => {
    async function initSession() {
      setLoading(true)
      setError(null)
      try {
        // Fetch user info in parallel
        const [timeRes, userRes] = await Promise.all([
          getExamTime(exam.examId),
          getMe()
        ])

        if (userRes.data) setUser(userRes.data)

        if (timeRes.data && timeRes.data.remainingSeconds > 0) {
          setInitialSeconds(timeRes.data.remainingSeconds)
          setSessionStarted(true)
        } else {
          setError(
            timeRes.message || 'Phiên thi đã kết thúc hoặc không tồn tại.'
          )
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
      {examTake.isGrading && (
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Hệ thống đang chấm bài...
              </h2>
              <p className="mt-2 text-muted-foreground">
                Vui lòng không thoát trang web này. Kết quả sẽ hiển thị ngay khi
                hoàn tất.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Question sidebar */}
          <QuestionSidebar
            questions={questions}
            currentIndex={examTake.currentQuestionIndex}
            answers={examTake.answers}
            onSelect={examTake.goToQuestion}
            header={null}
          />

          {/* Right: Prompt + Editor + Bottom panel */}
          <div className="relative flex flex-1 min-w-0 flex-col overflow-hidden">
            {/* Top Header Bar */}
            <div className="shrink-0 flex items-center justify-between border-b border-border bg-card px-4 py-2 sm:px-6 z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold overflow-hidden">
                  {user?.fullName?.charAt(0) || <User className="h-4 w-4" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {user?.fullName || 'Đang tải...'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate font-medium">
                    {user?.studentId || user?.email || '...'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="text-xs text-muted-foreground mb-1">
                    Tiến độ: {examTake.answeredCount}/{questions.length} câu
                  </div>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary border border-border/50">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                      style={{
                        width: `${
                          questions.length > 0
                            ? (examTake.answeredCount / questions.length) * 100
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-foreground bg-primary/5 px-3 py-1.5 rounded-md border border-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{formatTime(remainingSeconds)}</span>
                  </div>
                  <Button
                    onClick={examTake.handleRequestSubmit}
                    disabled={examTake.isLoading}
                    size="sm"
                    className="h-8 px-4 text-sm gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                    Nộp bài
                  </Button>
                </div>
              </div>
            </div>

            {/* Prompt (compact) */}
            <div className="shrink-0 border-b border-border bg-background px-4 py-3 sm:px-6">
              {examTake.currentQuestion ? (
                <div className="max-w-5xl">
                  <QuestionPanel question={examTake.currentQuestion} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Chọn một câu hỏi để bắt đầu
                </div>
              )}
            </div>

            {/* Editor + Bottom Panel with Resizer */}
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden bg-background">
              <ResizablePanel defaultSize={65} minSize={30} maxSize={85}>
                {examTake.currentQuestion ? (
                  <SqlEditorPanel
                    value={examTake.answers[examTake.currentQuestion.id] || ''}
                    onChange={(val: string) =>
                      examTake.updateAnswer(examTake.currentQuestion.id, val)
                    }
                    onExecute={handleExecuteSqlAndRefreshSchema}
                    isLoading={examTake.isLoading}
                    schema={editorSchema}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Chọn một câu hỏi để bắt đầu
                  </div>
                )}

                <ExamTakeBottomPanel
                  schema={editorSchema}
                  result={examTake.sqlResult}
                  schemaMeta={schemaMeta}
                  examId={exam.examId}
                  onSchemaMetaChange={applySchemaMeta}
                />
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
