'use client'

import { useCallback, useState, useEffect } from 'react'
import ExamHeader from '@/app/(main)/exam/components/exam-header'
import QuestionList from '@/app/(main)/exam/components/question-list'
import ExamEditor from '@/app/(main)/exam/components/exam-editor'
import ExamBottomPanel from '@/app/(main)/exam/components/exam-bottom-panel'
import { BlurOverlay } from '@/app/(main)/exam/components/blur-overlay'
import { ViolationWarningModal } from '@/app/(main)/exam/components/violation-warning-modal'
import { ExamWatermark } from '@/app/(main)/exam/components/exam-watermark'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import { Question, TableSchema } from '@/lib/types'
import { useAntiCheat } from '@/hooks/use-anti-cheat'
import { useExamTimer } from '@/hooks/use-exam-timer'
import { useExamSocket } from '@/hooks/use-exam-socket'
import { resetAntiCheat } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch } from '@/lib/redux/hooks'

interface ExamInterfaceProps {
  examId: number
  questions: Question[]
  tables: TableSchema[]
  studentId?: string
  studentName?: string
}

export default function ExamInterface({
  examId,
  questions,
  tables,
  studentId = 'SV001',
  studentName = 'Sinh viên'
}: ExamInterfaceProps) {
  const dispatch = useAppDispatch()
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    questions[0]?.id || 1
  )
  const [sessionStarted, setSessionStarted] = useState(false)
  const [initialSeconds, setInitialSeconds] = useState(0)
  const currentQuestion =
    questions.find((q) => q.id === selectedQuestionId) || questions[0]

  // Force submit handler
  const handleForceSubmit = useCallback(() => {
    // TODO: call submitExam API then redirect
    console.warn('[Exam] Force submit triggered')
    dispatch(resetAntiCheat())
  }, [dispatch])

  // Handle normal submit
  const handleSubmit = useCallback(() => {
    // TODO: call submitExam API then redirect
    console.log('[Exam] Manual submit')
    dispatch(resetAntiCheat())
  }, [dispatch])

  // Start exam session and sync timer on mount
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { remainingSeconds, setServerTime } = useExamTimer({
    examId,
    initialSeconds,
    enabled: sessionStarted
  })

  useAntiCheat({
    examId,
    enabled: sessionStarted
  })

  useExamSocket({
    examId,
    enabled: sessionStarted,
    onForceSubmit: handleForceSubmit,
    onTimeSync: setServerTime
  })

  // Call startExamSession and getExamTime on mount
  useEffect(() => {
    async function initSession() {
      setLoading(true)
      setError(null)
      try {
        const sessionRes = await import('@/lib/actions/anti-cheat.action').then(
          (m) => m.startExamSession(examId)
        )
        if (sessionRes.data && sessionRes.data.sessionStarted) {
          if (sessionRes.data.remainingSeconds > 0) {
            setInitialSeconds(sessionRes.data.remainingSeconds)
          } else {
            // Fallback: get exam time
            const timeRes = await import(
              '@/lib/actions/anti-cheat.action'
            ).then((m) => m.getExamTime(examId))
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

        // Handle "Exam time has expired" gracefully
        if (
          errCode === 'BAD_REQUEST' ||
          errMessage?.includes('expired') ||
          errMessage?.includes('ended')
        ) {
          setError(errMessage || 'Bài thi đã kết thúc hoặc quá hạn.')
        } else {
          setError(errMessage || 'Lỗi khi khởi tạo phiên thi.')
        }
      } finally {
        setLoading(false)
      }
    }
    initSession()
  }, [examId])

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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden relative">
      {/* Watermark — chìm phía dưới content */}
      <ExamWatermark studentId={studentId} studentName={studentName} />

      {/* Blur overlay — chặn khi chuyển tab */}
      <BlurOverlay />

      {/* Warning modal */}
      <ViolationWarningModal />

      <ExamHeader timeLeft={remainingSeconds} onSubmit={handleSubmit} />

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
