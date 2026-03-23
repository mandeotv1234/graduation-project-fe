'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { updateExam } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { ExamForm } from '@/app/(main)/teacher/exams/components/exam-form'
import {
  ExamFormInput,
  ExamFormValues
} from '@/app/(main)/teacher/exams/components/exam-form-schema'

type InitialData = Partial<ExamFormInput> & {
  id: number
  classId: number
}

interface EditExamComponentProps {
  examIdNum: number
  initialData: InitialData
}

export function EditExamComponent({
  examIdNum,
  initialData
}: EditExamComponentProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()

  const onSubmit = async (data: ExamFormValues) => {
    const payload = {
      ...data,
      startTime: data.startTime || null,
      endTime: data.endTime || null
    }

    const result = await callApi(updateExam(examIdNum, payload), false)

    if (result.code === '200' || result.code === 'OK') {
      toast.success('Cập nhật bài thi thành công')
      router.back()
    }
  }

  return (
    <ExamForm
      initialData={initialData}
      onSubmit={onSubmit}
      isLoading={isLoading}
      title="Chỉnh sửa bài thi"
      submitLabel="Lưu thay đổi"
    />
  )
}
