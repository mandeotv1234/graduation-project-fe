import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getExamSpecification, getTeacherExamDetail } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { ExamSpecificationEditor } from '@/app/(main)/teacher/exams/[examId]/specification/components/exam-specification-editor'

interface ExamSpecificationPageProps {
  params: Promise<{ examId: string }>
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ examId: string }>
}): Promise<Metadata> {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    return { title: 'Đặc tả bài thi' }
  }

  try {
    const examRes = await getTeacherExamDetail(examIdNum)
    const examTitle = examRes.data?.title

    return {
      title: examTitle
        ? `${examTitle} - Đặc tả CSDL`
        : `Bài thi ${examId} - Đặc tả CSDL`
    }
  } catch {
    return { title: `Bài thi ${examId} - Đặc tả CSDL` }
  }
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
      readOnly
    />
  )
}
