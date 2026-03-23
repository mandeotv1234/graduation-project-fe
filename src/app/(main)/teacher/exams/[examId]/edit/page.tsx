import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PATH } from '@/lib/constants'
import { getTeacherExamDetail } from '@/lib/actions'
import { EditExamComponent } from '@/app/(main)/teacher/exams/[examId]/edit/components/edit-exam-component'
import { ExamFormInput } from '@/app/(main)/teacher/exams/components/exam-form-schema'

interface EditExamPageProps {
  params: Promise<{ examId: string }>
}

type InitialData = Partial<ExamFormInput> & {
  id: number
  classId: number
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    if (value === 1) return true
    if (value === 0) return false
    return undefined
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0') return false
  }

  return undefined
}

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
    const examRes = await getTeacherExamDetail(examIdNum)
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

  const response = await getTeacherExamDetail(examIdNum)

  if (!response.data) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const data = response.data
  const dataRecord = data as unknown as Record<string, unknown>
  const normalizedIsPublished =
    toBoolean(data.isPublished) ??
    toBoolean(dataRecord.published) ??
    toBoolean(dataRecord.is_published) ??
    toBoolean(dataRecord.ispuhlished) ??
    toBoolean(dataRecord.isPuhlished) ??
    true

  const initialData: InitialData = {
    id: data.id,
    classId: data.classId,
    title: data.title,
    specificationId: data.specificationId,
    durationMinutes: data.durationMinutes,
    startTime: data.startTime ? data.startTime.substring(0, 16) : '',
    endTime: data.endTime ? data.endTime.substring(0, 16) : '',
    description: data.description || '',
    isPublished: normalizedIsPublished,
    maxAttempts: data.maxAttempts,
    lateThreshold: data.lateThreshold,
    settings: data.settings || {}
  }

  return <EditExamComponent examIdNum={examIdNum} initialData={initialData} />
}
