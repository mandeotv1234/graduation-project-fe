import { cache } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PATH } from '@/lib/constants'
import { getTeacherExamDetail } from '@/lib/actions'
import { EditExamPageClient } from '@/app/(main)/teacher/exams/[examId]/edit/components/edit-exam-page'
import { ExamFormInput } from '@/app/(main)/teacher/exams/components/exam-form-schema'

interface EditExamPageProps {
  params: Promise<{ examId: string }>
}

type InitialData = Partial<ExamFormInput> & {
  id: number
  classId: number
}

const getTeacherExamDetailCached = cache(async (examId: number) =>
  getTeacherExamDetail(examId)
)

export async function generateMetadata({
  params
}: {
  params: Promise<{ examId: string }>
}): Promise<Metadata> {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    return { title: 'Chỉnh sửa bài thi' }
  }

  try {
    const examRes = await getTeacherExamDetailCached(examIdNum)
    const examTitle = examRes.data?.title

    return {
      title: examTitle ? `Chỉnh sửa ${examTitle}` : 'Chỉnh sửa bài thi'
    }
  } catch {
    return { title: 'Chỉnh sửa bài thi' }
  }
}

export default async function EditExamPage({ params }: EditExamPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const response = await getTeacherExamDetailCached(examIdNum)

  if (!response.data) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const data = response.data
  const initialData: InitialData = {
    id: data.id,
    classId: data.classId,
    title: data.title,
    specificationId: data.specificationId,
    durationMinutes: data.durationMinutes,
    startTime: data.startTime ? data.startTime.substring(0, 16) : '',
    endTime: data.endTime ? data.endTime.substring(0, 16) : '',
    description: data.description || '',
    isPublished: data.isPublished,
    maxAttempts: data.maxAttempts,
    lateThreshold: data.lateThreshold,
    settings: data.settings || {}
  }

  return <EditExamPageClient examIdNum={examIdNum} initialData={initialData} />
}
