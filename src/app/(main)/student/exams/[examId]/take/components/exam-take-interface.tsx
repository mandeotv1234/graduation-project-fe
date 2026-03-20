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
import { QuestionSidebar } from '@/app/(main)/student/exams/[examId]/take/components/question-sidebar'
import { QuestionPanel } from '@/app/(main)/student/exams/[examId]/take/components/question-panel'
import { SqlEditorPanel } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel'
import type { SchemaTable } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel'
import { ExamTakeBottomPanel } from '@/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel'
import { ConfirmSubmitDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-submit-dialog'
import { SubmitResultDialog } from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog'
import { ViolationWarningModal } from '@/app/(main)/exam/components/violation-warning-modal'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import { PageSpinner } from '@/components/shared'
import type { ExecuteSqlResponse } from '@/lib/types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Clock, Send } from 'lucide-react'

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
            {/* Floating mini status (top-right) */}
            <div className="pointer-events-none absolute right-3 top-3 z-40">
              <div className="pointer-events-auto w-[220px] rounded-xl border border-border bg-background/85 backdrop-blur px-3 py-2 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatTime(remainingSeconds)}</span>
                  </div>
                  <Button
                    onClick={examTake.handleRequestSubmit}
                    disabled={examTake.isLoading}
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Nộp
                  </Button>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary border border-border/50">
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
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {examTake.answeredCount}/{questions.length} câu
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
