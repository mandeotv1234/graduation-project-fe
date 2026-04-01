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
import { ConfirmLeaveDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-leave-dialog'
import { SubmitResultDialog } from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import { PageSpinner } from '@/components/shared/spinner'
import type { ExecuteSqlResponse } from '@/lib/types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Clock, Send, User } from 'lucide-react'
import { ViolationWarningModal } from '@/app/(main)/exam/components/violation-warning-modal/violation-warning-modal'
import styles from './exam-take-interface.module.scss'

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
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

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

  // 1. Navigation Guard (Back button) - Intercept with Custom Dialog
  useEffect(() => {
    if (!examActive) return

    // Push dummy state to intercept first back action
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      setShowLeaveDialog(true)
      // Immediately push state back so the URL stays on this page while dialog is open
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [examActive])

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
        showResult={exam.settings?.showResultAfterSubmit}
        onBack={examTake.handleBackToExams}
      />
    )
  }

  return (
    <>
      <ViolationWarningModal />
      {examTake.isGrading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loaderContent}>
            <div className={styles.spinnerBox}>
              <div className={styles.spinnerBg} />
              <div className={styles.spinnerFg} />
            </div>
            <div>
              <h2 className={styles.title}>Hệ thống đang chấm bài...</h2>
              <p className={styles.subtitle}>
                Vui lòng không thoát trang web này. Kết quả sẽ hiển thị ngay khi
                hoàn tất.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className={styles.interfaceContainer}>
        <div className={styles.mainContent}>
          {/* Left: Question sidebar */}
          <QuestionSidebar
            questions={questions}
            currentIndex={examTake.currentQuestionIndex}
            answers={examTake.answers}
            onSelect={examTake.goToQuestion}
            header={null}
          />

          {/* Right: Prompt + Editor + Bottom panel */}
          <div className={styles.rightPanel}>
            {/* Top Header Bar */}
            <div className={styles.headerBar}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {user?.fullName?.charAt(0) || <User className="h-4 w-4" />}
                </div>
                <div className={styles.details}>
                  <span className={styles.name}>
                    {user?.fullName || 'Đang tải...'}
                  </span>
                  <span className={styles.id}>
                    {user?.studentId || user?.email || '...'}
                  </span>
                </div>
              </div>

              <div className={styles.statusActions}>
                <div className={styles.progressContainer}>
                  <div className={styles.progressText}>
                    Tiến độ: {examTake.answeredCount}/{questions.length} câu
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
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

                <div className={styles.actions}>
                  <div className={styles.timer}>
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{formatTime(remainingSeconds)}</span>
                  </div>
                  <Button
                    onClick={examTake.handleRequestSubmit}
                    disabled={examTake.isLoading}
                    size="sm"
                    className={styles.submitBtn}
                  >
                    <Send className="h-4 w-4" />
                    Nộp bài
                  </Button>
                </div>
              </div>
            </div>

            {/* Prompt (compact) */}
            <div className={styles.questionPrompt}>
              {examTake.currentQuestion ? (
                <div className={styles.panelWrapper}>
                  <QuestionPanel question={examTake.currentQuestion} />
                </div>
              ) : (
                <div className={styles.emptyState}>
                  Chọn một câu hỏi để bắt đầu
                </div>
              )}
            </div>

            {/* Editor + Bottom Panel with Resizer */}
            <div className={styles.editorArea}>
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
                  <div className={styles.emptyStateCenter}>
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

      {/* Custom confirmation dialogs */}
      <ConfirmSubmitDialog
        open={examTake.showConfirmDialog}
        onOpenChange={examTake.setShowConfirmDialog}
        onConfirm={examTake.handleConfirmSubmit}
        unansweredCount={examTake.unansweredCount}
        totalQuestions={questions.length}
        isLoading={examTake.isLoading}
      />

      <ConfirmLeaveDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        onConfirm={() => {
          // Force back navigation after user confirms
          setShowLeaveDialog(false)
          // Double back usually needed because we pushed one state
          window.history.go(-2)
        }}
      />
    </>
  )
}
