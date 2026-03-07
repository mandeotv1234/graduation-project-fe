import { getExamDetail, getExamQuestionsByExamId } from '@/lib/actions'
import { ExamTakeInterface } from '@/app/(main)/student/exams/[examId]/take/components/exam-take-interface'
import { redirect } from 'next/navigation'
import { PATH } from '@/lib/constants'

interface ExamTakePageProps {
  params: Promise<{ examId: string }>
}

export default async function ExamTakePage({ params }: ExamTakePageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    redirect(PATH.STUDENT_EXAMS)
  }

  const [examRes, questionsRes] = await Promise.all([
    getExamDetail(examIdNum),
    getExamQuestionsByExamId(examIdNum)
  ])

  if (!examRes.data) {
    redirect(PATH.STUDENT_EXAMS)
  }

  return (
    <ExamTakeInterface
      exam={examRes.data}
      questions={questionsRes.data || []}
    />
  )
}
