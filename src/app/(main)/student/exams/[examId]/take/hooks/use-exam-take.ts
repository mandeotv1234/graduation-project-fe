import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { executeSql, getMyResultDetail, submitExam } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { PATH } from '@/lib/constants'
import {
  ExamQuestionItem,
  StudentExamDetail,
  ExecuteSqlResponse,
  SubmitExamResponse,
  StudentExamResultDetail
} from '@/lib/types'

const GRADING_POLL_INTERVAL_MS = 3000

function isGradingComplete(
  result: Pick<SubmitExamResponse, 'status' | 'totalScore' | 'maxScore'>,
  requireScore: boolean
) {
  if (result.status !== 'COMPLETED') return false
  if (!requireScore) return true

  return (
    typeof result.totalScore === 'number' &&
    Number.isFinite(result.totalScore) &&
    typeof result.maxScore === 'number' &&
    Number.isFinite(result.maxScore)
  )
}

function mapResultDetailToSubmitResponse(
  detail: StudentExamResultDetail,
  previous: SubmitExamResponse | null,
  examId: number,
  resultId: number
): SubmitExamResponse {
  return {
    resultId,
    examId: previous?.examId ?? detail.examId ?? examId,
    studentId: detail.studentId,
    submittedAt: detail.submittedAt,
    status: detail.status,
    totalScore: detail.totalScore ?? undefined,
    maxScore: detail.maxScore ?? undefined,
    correctCount: detail.correctCount,
    totalQuestions: detail.totalQuestions,
    details: detail.questionResults.map((question) => ({
      questionId: question.questionId,
      content: question.content,
      points: question.maxPoints,
      studentQuery: question.studentQuery ?? ''
    })),
    questionResults: detail.questionResults.map((question, index) => ({
      submissionId: question.submissionId ?? 0,
      questionId: question.questionId,
      orderIndex: index + 1,
      studentQuery: question.studentQuery ?? '',
      isCorrect: question.isCorrect,
      scoreEarned: question.scoreEarned,
      maxPoints: question.maxPoints,
      errorMessage: question.errorMessage ?? null,
      executionTimeMs: question.executionTimeMs ?? 0
    }))
  }
}

export function useExamTake(
  exam: StudentExamDetail,
  questions: ExamQuestionItem[]
) {
  const { callApi, isLoading } = useApi()
  const router = useRouter()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    questions.forEach((q) => {
      initial[q.id] = ''
    })
    return initial
  })
  const [sqlResult, setSqlResult] = useState<ExecuteSqlResponse | null>(null)
  const [submitResult, setSubmitResult] = useState<SubmitExamResponse | null>(
    null
  )
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isCloudError, setIsCloudError] = useState(false)
  const isSubmittingRef = useRef(false)
  const shouldShowResult = Boolean(exam.settings?.showResultAfterSubmit)

  const currentQuestion = questions[currentQuestionIndex]

  const updateAnswer = useCallback((questionId: number, sql: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: sql
    }))
  }, [])

  /** Bulk restore answers (used by draft restoration) */
  const restoreAnswers = useCallback(
    (restoredAnswers: Record<number, string>) => {
      setAnswers((prev) => {
        const next = { ...prev }
        for (const [id, content] of Object.entries(restoredAnswers)) {
          const numId = Number(id)
          // Only restore if the question exists and content is non-empty
          if (next[numId] !== undefined && content && content.trim()) {
            next[numId] = content
          }
        }
        return next
      })
    },
    []
  )

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) {
        setCurrentQuestionIndex(index)
        setSqlResult(null)
      }
    },
    [questions.length]
  )

  const handleExecuteSql = useCallback(
    async (selectedSql?: string) => {
      if (!currentQuestion) return

      // If caller passes a selected snippet, run that; otherwise run the full answer
      const sql = selectedSql?.trim() || answers[currentQuestion.id]
      if (!sql?.trim()) {
        toast.warning('Vui lòng nhập câu lệnh SQL')
        return
      }

      const response = await callApi(executeSql(exam.examId, { sql }), false)

      if (response.data) {
        setSqlResult(response.data)
        return response.data
      }
      return null
    },
    [currentQuestion, answers, exam.examId, callApi]
  )

  // Open confirmation dialog instead of window.confirm
  const handleRequestSubmit = useCallback(() => {
    setShowConfirmDialog(true)
  }, [])

  // Actually submit the exam (called from confirmation dialog)
  const handleConfirmSubmit = useCallback(async () => {
    if (isSubmittingRef.current || isSubmitted) return
    isSubmittingRef.current = true
    setShowConfirmDialog(false)
    setIsCloudError(false)

    const submitData = {
      answers: questions.map((q) => ({
        questionId: q.id,
        studentQuery: answers[q.id] || ''
      }))
    }

    try {
      const response = await callApi(submitExam(exam.examId, submitData), false)

      if (response.data) {
        if (isGradingComplete(response.data, shouldShowResult)) {
          setSubmitResult(response.data)
          setIsSubmitted(true)
        } else if (
          response.data.status === 'PENDING' ||
          response.data.status === 'GRADING' ||
          response.data.status === 'COMPLETED'
        ) {
          // A COMPLETED response without a score is not ready for display yet.
          setSubmitResult(response.data)
          setIsGrading(true)
          toast.success(
            'Bài thi đã được nộp thành công. Vui lòng đợi trong giây lát để hệ thống chấm điểm...'
          )
        } else {
          setSubmitResult(response.data)
          setIsGrading(false)
          toast.error(
            'Chấm bài thất bại. Bạn có thể xem trạng thái trong trang kết quả.'
          )
          router.push(PATH.STUDENT_EXAMS)
        }
      } else {
        // If we get an error response (like 401/403/500) during submission,
        // it might be because the backend auto-submit job already finished and cleared the session.
        console.warn(
          'Submission returned no data or error, redirecting to exams list:',
          response
        )
        router.push(PATH.STUDENT_EXAMS)
      }
    } catch (err) {
      console.error('Submission error caught in hook:', err)
      setIsCloudError(true)
      // Redirect anyway to prevent getting stuck
      router.push(PATH.STUDENT_EXAMS)
    } finally {
      // Allow retry if failed (or just keep it locked if success)
      isSubmittingRef.current = false
    }
  }, [
    questions,
    answers,
    exam.examId,
    callApi,
    isSubmitted,
    router,
    shouldShowResult
  ])

  useEffect(() => {
    const resultId = submitResult?.resultId
    if (!isGrading || isSubmitted || typeof resultId !== 'number') return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const pollingResultId = resultId

    function scheduleNextPoll() {
      timer = setTimeout(pollResult, GRADING_POLL_INTERVAL_MS)
    }

    async function pollResult() {
      try {
        const response = await getMyResultDetail(pollingResultId)
        if (cancelled) return

        const detail = response.data
        if (detail) {
          const nextResult = mapResultDetailToSubmitResponse(
            detail,
            submitResult,
            exam.examId,
            pollingResultId
          )

          if (isGradingComplete(nextResult, shouldShowResult)) {
            setSubmitResult(nextResult)
            setIsGrading(false)
            setIsSubmitted(true)
            return
          }
        }

        if (detail?.status === 'FAILED' || detail?.status === 'SYSTEM_ERROR') {
          setSubmitResult((prev) =>
            mapResultDetailToSubmitResponse(
              detail,
              prev,
              exam.examId,
              pollingResultId
            )
          )
          setIsGrading(false)
          toast.error(
            'Chấm bài thất bại. Bạn có thể xem trạng thái trong trang kết quả.'
          )
          router.push(PATH.STUDENT_EXAMS)
          return
        }
      } catch (error) {
        console.warn('[useExamTake] Poll grading result failed:', error)
      }

      if (!cancelled) {
        scheduleNextPoll()
      }
    }

    scheduleNextPoll()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [
    exam.examId,
    isGrading,
    isSubmitted,
    router,
    shouldShowResult,
    submitResult
  ])

  const handleBackToExams = useCallback(() => {
    router.push(PATH.STUDENT_EXAMS)
  }, [router])

  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length

  const unansweredCount = questions.length - answeredCount

  return {
    currentQuestion,
    currentQuestionIndex,
    answers,
    sqlResult,
    submitResult,
    setSubmitResult,
    isSubmitted,
    setIsSubmitted,
    isGrading,
    setIsGrading,
    isLoading,
    answeredCount,
    unansweredCount,
    showConfirmDialog,
    setShowConfirmDialog,
    isCloudError,
    updateAnswer,
    restoreAnswers,
    goToQuestion,
    handleExecuteSql,
    handleRequestSubmit,
    handleConfirmSubmit,
    handleBackToExams
  }
}
