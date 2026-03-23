'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { PATH } from '@/lib/constants'
import { createExam } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { ExamForm } from '@/app/(main)/teacher/exams/components/exam-form'
import { ExamFormValues } from '@/app/(main)/teacher/exams/components/exam-form-schema'

interface CreateExamPageProps {
  params: Promise<{ classId: string }>
}

export default function CreateExamPage({ params }: CreateExamPageProps) {
  const { classId } = use(params)
  const classIdNum = Number(classId)
  const router = useRouter()
  const { callApi, isLoading } = useApi()

  const onSubmit = async (data: ExamFormValues) => {
    // Treat empty string dates as undefined
    const payload = {
      ...data,
      classId: classIdNum,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined
    }

    const result = await callApi(createExam(payload))

    if (result.data) {
      router.push(PATH.TEACHER_EXAM_QUESTIONS(result.data.id))
    }
  }

  return (
    <ExamForm
      onSubmit={onSubmit}
      isLoading={isLoading}
      title="Tạo bài thi mới"
      submitLabel="Tạo bài thi"
      backPath={PATH.TEACHER_CLASS_DETAIL(classIdNum)}
    />
  )
}
