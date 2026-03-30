'use client'

import { useRouter } from 'next/navigation'

import { useApi } from '@/hooks/use-api'
import { createExam } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { SpecificationResponse } from '@/lib/types'
import { ExamSettingsForm } from '@/app/(main)/teacher/exams/components/exam-settings-form'
import { ExamSettingsFormValues } from '@/app/(main)/teacher/exams/components/exam-settings-form-schema'

interface CreateExamViewProps {
  classId: number
  specifications: SpecificationResponse[]
}

export function CreateExamView({
  classId,
  specifications
}: CreateExamViewProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()

  async function handleSubmit(data: ExamSettingsFormValues) {
    const payload = {
      ...data,
      classId,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined
    }

    const result = await callApi(createExam(payload))
    if (result.data?.id) {
      router.push(PATH.TEACHER_EXAM_SPECIFICATION(result.data.id))
    }
  }

  return (
    <ExamSettingsForm
      mode="create"
      formId="create-exam-form"
      pageTitle="Tạo bài thi mới"
      pageDescription="Thiết lập thông tin và các quy định cho bài kiểm tra SQL"
      submitLabel="Tạo bài thi"
      backHref={PATH.TEACHER_CLASS_DETAIL(classId)}
      specifications={specifications}
      initialValues={{
        title: '',
        specificationId: 0,
        durationMinutes: 60,
        startTime: '',
        endTime: '',
        description: '',
        isPublished: true,
        maxAttempts: 1,
        lateThreshold: 0,
        settings: {
          preventCopyPaste: true,
          forceFullscreen: true,
          trackTabSwitch: true,
          autoSubmitOnViolation: false,
          allowReview: true,
          scoreDisplayMode: 'after_closed',
          allowOvertime: false,
          gradingMethod: 'highest_score'
        }
      }}
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
    />
  )
}
