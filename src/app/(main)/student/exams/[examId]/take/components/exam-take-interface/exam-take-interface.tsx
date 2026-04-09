'use client'

import {
  ExamQuestionItem,
  StudentExamDetail,
  ExamSpecification,
  SubmitExamResponse
} from '@/lib/types'
import { useExamTake } from '@/app/(main)/student/exams/[examId]/take/hooks/use-exam-take'
import { useExamDraft } from '@/app/(main)/student/exams/[examId]/take/hooks/use-exam-draft'
import { useEffect, useState, useCallback } from 'react'
import { getExamTime } from '@/lib/actions/anti-cheat.action'
import { getExamSpecification, getMe } from '@/lib/actions'
import { User as UserType } from '@/lib/types'
import { useAntiCheat } from '@/hooks/use-anti-cheat'
import { useExamTimer } from '@/hooks/use-exam-timer'
import { useExamSocket } from '@/hooks/use-exam-socket'
import { QuestionSidebar } from '@/app/(main)/student/exams/[examId]/take/components/question-sidebar/question-sidebar'
import { QuestionPanel } from '@/app/(main)/student/exams/[examId]/take/components/question-panel/question-panel'
import { SqlEditorPanel } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel/sql-editor-panel'
import type { SchemaTable } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel/sql-editor-panel'
import { ExamTakeBottomPanel } from '@/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel/exam-take-bottom-panel'
import { SaveStatusIndicator } from '@/app/(main)/student/exams/[examId]/take/components/save-status-indicator'
import { DraftRestoredBanner } from '@/app/(main)/student/exams/[examId]/take/components/draft-restored-banner'
import { NetworkStatusBanner } from '@/app/(main)/student/exams/[examId]/take/components/network-status-banner'
import { downloadAnswersBackup } from '@/lib/utils/export-exam-answers'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import type { ExecuteSqlResponse } from '@/lib/types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Clock, Send, User } from 'lucide-react'
import { ViolationWarningModal } from '@/app/(main)/exam/components/violation-warning-modal/violation-warning-modal'
import styles from './exam-take-interface.module.scss'
import { SubmitResultDialog } from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog/submit-result-dialog'
import { ConfirmLeaveDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-leave-dialog/confirm-leave-dialog'
import { ConfirmSubmitDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-submit-dialog/confirm-submit-dialog'
import { PageSpinner } from '@/components/shared'

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
  const [showRestoredBanner, setShowRestoredBanner] = useState(false)

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

  const examActive = sessionStarted && !examTake.isSubmitted

  const { bypassAntiCheat } = useAntiCheat({
    examId: exam.examId,
    enabled: examActive,
    settings: exam.settings
  })

  const {
    saveStatus,
    lastSavedAt,
    isServerReachable,
    getRestoredAnswers,
    handleManualSave,
    clearLocalDraft
  } = useExamDraft(exam.examId, examTake.answers, examActive)

  const handleDownloadBackup = useCallback(() => {
    downloadAnswersBackup(
      exam.title || 'Exam',
      user?.fullName || 'Student',
      user?.studentId || user?.email || 'N/A',
      examTake.answers,
      questions
    )
  }, [exam.title, user, examTake.answers, questions])

  const handleForceSubmit = useCallback(() => {
    toast.info('Đã hết thời gian làm bài, hệ thống đang nộp bài tự động...')
    bypassAntiCheat()
    window.onbeforeunload = null
    clearLocalDraft()
    examTake.handleConfirmSubmit()
  }, [examTake, bypassAntiCheat, clearLocalDraft])

  const { setServerTime, remainingSeconds } = useExamTimer({
    examId: exam.examId,
    initialSeconds,
    enabled: examActive,
    allowOvertime: exam.settings?.allowOvertime,
    onTimeUp: !exam.settings?.allowOvertime ? handleForceSubmit : undefined
  })

  useExamSocket({
    examId: exam.examId,
    studentId: user?.id,
    enabled: examActive,
    onForceSubmit: handleForceSubmit,
    onTimeSync: setServerTime,
    onKicked: useCallback(() => {
      bypassAntiCheat()
      window.onbeforeunload = null
      window.location.href = '/student/exams'
    }, [bypassAntiCheat]),
    onGradingResult: (rawResult: unknown) => {
      const result = rawResult as {
        status: string
        reason?: string
      } & SubmitExamResponse
      if (result.status === 'COMPLETED') {
        examTake.setSubmitResult((prev) => ({
          ...(prev || {}),
          ...result,
          // Prefer old details if new ones aren't provided in socket message
          details: result.details || prev?.details || []
        }))
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

    // Push dummy state to intercept first back action if not already present
    if (window.history.state?.guard !== true) {
      window.history.pushState({ guard: true }, '', window.location.href)
    }

    const handlePopState = () => {
      setShowLeaveDialog(true)
      // Immediately replace state instead of push to avoid history stack accumulation
      // while still keeping the user on the current page URL
      window.history.replaceState({ guard: true }, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [examActive])

  // Fetch exam specification to provide schema IntelliSense in SQL editor
  useEffect(() => {
    if (exam.schema && exam.schema.length > 0) {
      applySchemaMeta(exam.schema)
      return
    }

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
  }, [applySchemaMeta, exam.examId, exam.schema])

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

  // Timer milestones and toasts
  useEffect(() => {
    if (!examActive) return

    if (remainingSeconds === 300) {
      toast.warning('Còn lại 5 phút!')
    } else if (remainingSeconds === 60) {
      toast.error('Chỉ còn 1 phút! Hãy kiểm tra lại bài làm.')
    } else if (remainingSeconds === 30) {
      toast.error('Cảnh báo: Chỉ còn 30 giây cuối cùng!')
    }
  }, [remainingSeconds, examActive])

  const getTimerState = useCallback((seconds: number) => {
    if (seconds <= 30) return 'critical'
    if (seconds <= 60) return 'danger'
    if (seconds <= 300) return 'warning'
    return 'normal'
  }, [])

  const timerState = getTimerState(remainingSeconds)
  const timerClass =
    timerState === 'critical'
      ? styles.critical
      : timerState === 'danger'
        ? styles.danger
        : timerState === 'warning'
          ? styles.warning
          : ''

  // Update document title with remaining time
  useEffect(() => {
    if (!examActive) return
    const time = formatTime(remainingSeconds)
    const storedTitle = document.title
    document.title = `[${time}] ${exam.title}`
    return () => {
      document.title = storedTitle
    }
  }, [remainingSeconds, examActive, exam.title, formatTime])

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

          const restoredAnswers = await getRestoredAnswers()
          if (restoredAnswers) {
            examTake.restoreAnswers(restoredAnswers)
            setShowRestoredBanner(true)
            // Auto-hide restorative banner after 3 seconds
            setTimeout(() => setShowRestoredBanner(false), 3000)
          }
        } else if (timeRes.data && !timeRes.data.studentStartedAt) {
          // No active session — redirect user back to the waiting room to click Start
          window.location.href = `/student/exams/${exam.examId}/take`
          return
        } else {
          setError('Phiên thi đã kết thúc hoặc không tồn tại.')
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
      <div className={styles.timeProgressBar}>
        <div
          className={`${styles.timeFill} ${styles[timerState]}`}
          style={{
            width: `${Math.max(
              0,
              (remainingSeconds / (exam.durationMinutes * 60)) * 100
            )}%`
          }}
        />
      </div>
      <ViolationWarningModal />
      <NetworkStatusBanner
        isReachable={isServerReachable}
        onDownloadBackup={handleDownloadBackup}
      />
      {showRestoredBanner && (
        <DraftRestoredBanner onDismiss={() => setShowRestoredBanner(false)} />
      )}
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
                <SaveStatusIndicator
                  status={saveStatus}
                  lastSavedAt={lastSavedAt}
                  onManualSave={handleManualSave}
                  isServerReachable={isServerReachable}
                />
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
                  <div className={`${styles.timer} ${timerClass}`}>
                    <Clock
                      className={`h-4 w-4 ${
                        timerState === 'normal' ? 'text-primary' : ''
                      }`}
                    />
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
        onConfirm={() => {
          clearLocalDraft()
          examTake.handleConfirmSubmit()
        }}
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
