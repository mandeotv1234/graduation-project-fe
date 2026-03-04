import { redirect } from 'next/navigation'
import { getExamQuestionsByExamId } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { ExamQuestionsView } from './components/exam-questions-view'

interface ExamQuestionsPageProps {
  params: Promise<{ examId: string }>
}

export default async function ExamQuestionsPage({
  params
}: ExamQuestionsPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const response = await getExamQuestionsByExamId(examIdNum)
  const questions = response.data || []

  return <ExamQuestionsView examId={examIdNum} initialQuestions={questions} />
}
