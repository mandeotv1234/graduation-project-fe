import { getExamDetail } from '@/lib/actions'
import { redirect } from 'next/navigation'
import { PATH } from '@/lib/constants'
import { ExamStartInterface } from '@/app/(main)/student/exams/[examId]/take/components/exam-start-interface/exam-start-interface'

interface ExamStartPageProps {
  params: Promise<{ examId: string }>
}

export default async function ExamStartPage({ params }: ExamStartPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    redirect(PATH.STUDENT_EXAMS)
  }

  const examRes = await getExamDetail(examIdNum)

  if (!examRes.data) {
    redirect(PATH.STUDENT_EXAMS)
  }

  return <ExamStartInterface exam={examRes.data} />
}
