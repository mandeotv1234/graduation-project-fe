import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import CreateExamForm from '@/app/(main)/create-exam/components/create-exam-form'
import { getExamSpecification, getTeacherExamDetail } from '@/lib/actions'
import { PATH } from '@/lib/constants'

interface TeacherCreateCommonExamPageProps {
  params: Promise<{ examId: string }>
}

export async function generateMetadata({
  params
}: TeacherCreateCommonExamPageProps): Promise<Metadata> {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (Number.isNaN(examIdNum)) {
    return { title: 'Yeu cau thi chung' }
  }

  try {
    const examRes = await getTeacherExamDetail(examIdNum)
    const examTitle = examRes.data?.title
    return {
      title: examTitle
        ? `${examTitle} - Yeu cau thi chung`
        : `Bai thi ${examId} - Yeu cau thi chung`
    }
  } catch {
    return { title: `Bai thi ${examId} - Yeu cau thi chung` }
  }
}

export default async function TeacherCreateCommonExamPage({
  params
}: TeacherCreateCommonExamPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (Number.isNaN(examIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const [examRes, specRes] = await Promise.all([
    getTeacherExamDetail(examIdNum),
    getExamSpecification(examIdNum).catch(() => ({ data: undefined }))
  ])

  if (!examRes.data) {
    redirect(PATH.TEACHER_CLASSES)
  }

  return (
    <CreateExamForm
      examId={examIdNum}
      initialSpecification={specRes.data ?? null}
    />
  )
}
