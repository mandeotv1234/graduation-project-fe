import { redirect } from 'next/navigation'
import { getExamSpecification } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { ExamSpecificationEditor } from '@/app/(main)/teacher/exams/[examId]/specification/components/exam-specification-editor'

interface ExamSpecificationPageProps {
  params: Promise<{ examId: string }>
}

export default async function ExamSpecificationPage({
  params
}: ExamSpecificationPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const response = await getExamSpecification(examIdNum)
  const specification = response.data ?? null

  return (
    <ExamSpecificationEditor
      examId={examIdNum}
      initialSpecification={specification}
    />
  )
}
