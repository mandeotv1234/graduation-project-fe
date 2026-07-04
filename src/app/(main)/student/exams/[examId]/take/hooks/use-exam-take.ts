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
  TeacherExamResultDetail
} from '@/lib/types'

const GRADING_POLL_INTERVAL_MS = 3000
const GRADING_POLL_TIMEOUT_MS = 5 * 60 * 1000

function mapResultDetailToSubmitResponse(
  detail: TeacherExamResultDetail,
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
    totalScore: detail.totalScore,
    maxScore: detail.maxScore,
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
        if (response.data.status === 'COMPLETED') {
          setSubmitResult(response.data)
          setIsSubmitted(true)
        } else {
          // ACCEPTED or PENDING — save details for later merge with grading result
          setSubmitResult(response.data)
          setIsGrading(true)
          toast.success(
            'Bài thi đã được nộp thành công. Vui lòng đợi trong giây lát để hệ thống chấm điểm...'
          )
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
  }, [questions, answers, exam.examId, callApi, isSubmitted])

  useEffect(() => {
    const resultId = submitResult?.resultId
    if (!isGrading || isSubmitted || typeof resultId !== 'number') return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const startedAt = Date.now()
    const pollingResultId = resultId

    function scheduleNextPoll() {
      timer = setTimeout(pollResult, GRADING_POLL_INTERVAL_MS)
    }

    async function pollResult() {
      try {
        const response = await getMyResultDetail(pollingResultId)
        if (cancelled) return

        const detail = response.data
        if (detail?.status === 'COMPLETED') {
          setSubmitResult((prev) =>
            mapResultDetailToSubmitResponse(
              detail,
              prev,
              exam.examId,
              pollingResultId
            )
          )
          setIsGrading(false)
          setIsSubmitted(true)
          return
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

      if (Date.now() - startedAt >= GRADING_POLL_TIMEOUT_MS) {
        toast.info(
          'Bài đã được nộp và vẫn đang chấm. Bạn có thể theo dõi kết quả trong danh sách bài thi.'
        )
        router.push(PATH.STUDENT_EXAMS)
        return
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
  }, [exam.examId, isGrading, isSubmitted, router, submitResult?.resultId])

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
