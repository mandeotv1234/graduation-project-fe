import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PATH } from '@/lib/constants'
import CreateExamPageClient from '@/app/(main)/teacher/classes/[classId]/create-exam/components/create-exam-page'
import { getClassDetail } from '@/lib/actions'

interface CreateExamPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({
  params
}: CreateExamPageProps): Promise<Metadata> {
  const { classId } = await params
  const classRes = await getClassDetail(Number(classId))
  const classCode = classRes.data?.classCode

  return {
    title: `Tạo bài thi - Lớp ${classCode || classId}`
  }
}

export default async function CreateExamPage({ params }: CreateExamPageProps) {
  const { classId } = await params
  const classIdNum = Number(classId)

  if (isNaN(classIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  return <CreateExamPageClient classId={classId} />
}
