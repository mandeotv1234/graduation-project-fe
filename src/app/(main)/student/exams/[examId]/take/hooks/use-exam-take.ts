import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { executeSql, submitExam } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { PATH } from '@/lib/constants'
import {
  ExamQuestionItem,
  StudentExamDetail,
  ExecuteSqlResponse,
  SubmitExamResponse
} from '@/lib/types'

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  const updateAnswer = useCallback((questionId: number, sql: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: sql
    }))
  }, [])

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) {
        setCurrentQuestionIndex(index)
        setSqlResult(null)
      }
    },
    [questions.length]
  )

  const handleExecuteSql = useCallback(async () => {
    if (!currentQuestion) return

    const sql = answers[currentQuestion.id]
    if (!sql?.trim()) {
      toast.warning('Vui lòng nhập câu lệnh SQL')
      return
    }

    const response = await callApi(executeSql(exam.examId, { sql }), false)

    if (response.data) {
      setSqlResult(response.data)
      if (response.data.errorMessage) {
        toast.error(response.data.errorMessage)
      } else {
        toast.success(
          `Thực thi thành công (${response.data.executionTimeMs}ms, ${response.data.rowCount} dòng)`
        )
      }
    }
  }, [currentQuestion, answers, exam.examId, callApi])

  // Open confirmation dialog instead of window.confirm
  const handleRequestSubmit = useCallback(() => {
    setShowConfirmDialog(true)
  }, [])

  // Actually submit the exam (called from confirmation dialog)
  const handleConfirmSubmit = useCallback(async () => {
    setShowConfirmDialog(false)

    const submitData = {
      answers: questions.map((q) => ({
        questionId: q.id,
        studentQuery: answers[q.id] || ''
      }))
    }

    const response = await callApi(submitExam(exam.examId, submitData))

    if (response.data) {
      setSubmitResult(response.data)
      setIsSubmitted(true)
    }
  }, [questions, answers, exam.examId, callApi])

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
  }
}
