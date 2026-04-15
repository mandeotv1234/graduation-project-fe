'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PencilLine } from 'lucide-react'
import { toast } from 'sonner'

import { ExamForm } from '@/app/(main)/teacher/exams/components/exam-form'
import {
  ExamFormInput,
  ExamFormValues
} from '@/app/(main)/teacher/exams/components/exam-form-schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useApi } from '@/hooks/use-api'
import { updateExam } from '@/lib/actions'
import { updateExamWithPdf } from '@/lib/api/exam-client'
import { TeacherExamDetail } from '@/lib/types'
import { cn } from '@/lib/utils'

type InitialData = Partial<ExamFormInput> & {
  id: number
  classId: number
}

interface EditExamModalButtonProps {
  exam: TeacherExamDetail
  onSaved?: (updatedExam: TeacherExamDetail) => void
  triggerLabel?: string
  triggerClassName?: string
}

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.substring(0, 16)
}

export function buildExamFormInitialData(exam: TeacherExamDetail): InitialData {
  return {
    id: exam.id,
    classId: exam.classId,
    title: exam.title,
    specificationId: Number(exam.specificationId ?? 0),
    durationMinutes: exam.durationMinutes,
    startTime: toDateTimeLocalValue(exam.startTime),
    endTime: toDateTimeLocalValue(exam.endTime),
    description: exam.description || '',
    isPublished: Boolean(exam.isPublished),
    maxAttempts: exam.maxAttempts,
    lateThreshold: exam.lateThreshold,
    settings: exam.settings || {}
  }
}

/** Payload gửi updateExam: form dùng undefined, API dùng null cho slot trống. */
export type ExamUpdateMergePayload = Omit<
  ExamFormValues,
  'startTime' | 'endTime'
> & {
  startTime: string | null
  endTime: string | null
}

/** Gộp payload đã gửi với response — tránh mất specificationId khi API trả thiếu field. */
export function mergeTeacherExamAfterUpdate(
  exam: TeacherExamDetail,
  payload: ExamUpdateMergePayload,
  resultData: TeacherExamDetail | undefined | null
): TeacherExamDetail {
  const specFromPayload = Number(payload.specificationId)
  let specificationId: number
  if (resultData != null) {
    const sid = resultData.specificationId
    if (sid != null && sid > 0) {
      specificationId = sid
    } else if (sid === null) {
      specificationId = 0
    } else {
      specificationId =
        specFromPayload > 0
          ? specFromPayload
          : Number(exam.specificationId ?? 0)
    }
  } else {
    specificationId =
      specFromPayload > 0 ? specFromPayload : Number(exam.specificationId ?? 0)
  }

  const pdfFilePath =
    resultData != null ? (resultData.pdfFilePath ?? null) : exam.pdfFilePath
  const originalPdfFileName =
    resultData != null
      ? (resultData.originalPdfFileName ?? null)
      : exam.originalPdfFileName

  return {
    ...exam,
    ...(resultData || {}),
    ...payload,
    startTime: payload.startTime,
    endTime: payload.endTime,
    specificationId,
    pdfFilePath,
    originalPdfFileName
  }
}

export function EditExamModalButton({
  exam,
  onSaved,
  triggerLabel = 'Chỉnh sửa thông tin',
  triggerClassName
}: EditExamModalButtonProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [isOpen, setIsOpen] = useState(false)

  const onSubmit = async (data: ExamFormValues, pdfFile?: File | null) => {
    const payload = {
      ...data,
      startTime: data.startTime || null,
      endTime: data.endTime || null
    }

    let result
    if (pdfFile) {
      result = await callApi(
        updateExamWithPdf(exam.id, payload, pdfFile),
        false
      )
    } else {
      result = await callApi(updateExam(exam.id, payload), false)
    }

    if (result.code === '200' || result.code === 'OK') {
      const updatedExam = mergeTeacherExamAfterUpdate(
        exam,
        payload,
        result.data
      )

      onSaved?.(updatedExam)
      toast.success('Cập nhật bài thi thành công')
      setIsOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <Button
        className={cn('gap-2', triggerClassName)}
        onClick={() => setIsOpen(true)}
      >
        <PencilLine className="h-4 w-4" />
        {triggerLabel}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="w-[96vw] h-[90vh] overflow-y-auto sm:max-w-[96vw] lg:max-w-7xl"
          showCloseButton
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Chỉnh sửa bài thi</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin bài thi và lưu cập nhật.
            </DialogDescription>
          </DialogHeader>
          <div className="[&_.sticky]:static [&_h1.text-3xl]:text-2xl">
            <ExamForm
              initialData={buildExamFormInitialData(exam)}
              onSubmit={onSubmit}
              isLoading={isLoading}
              title="Chỉnh sửa bài thi"
              submitLabel="Lưu thay đổi"
              initialPdfFileName={
                exam.pdfFilePath ? exam.originalPdfFileName : null
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
