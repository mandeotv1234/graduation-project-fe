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
import { TeacherExamDetail } from '@/lib/types'

type InitialData = Partial<ExamFormInput> & {
  id: number
  classId: number
}

interface EditExamModalButtonProps {
  exam: TeacherExamDetail
  onSaved?: (updatedExam: TeacherExamDetail) => void
}

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.substring(0, 16)
}

function buildInitialData(exam: TeacherExamDetail): InitialData {
  return {
    id: exam.id,
    classId: exam.classId,
    title: exam.title,
    specificationId: exam.specificationId,
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

export function EditExamModalButton({
  exam,
  onSaved
}: EditExamModalButtonProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [isOpen, setIsOpen] = useState(false)

  const onSubmit = async (data: ExamFormValues) => {
    const payload = {
      ...data,
      startTime: data.startTime || null,
      endTime: data.endTime || null
    }

    const result = await callApi(updateExam(exam.id, payload), false)

    if (result.code === '200' || result.code === 'OK') {
      const updatedExam: TeacherExamDetail = result.data
        ? result.data
        : {
            ...exam,
            ...payload,
            startTime: payload.startTime,
            endTime: payload.endTime
          }

      onSaved?.(updatedExam)
      toast.success('Cập nhật bài thi thành công')
      setIsOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <Button className="gap-2" onClick={() => setIsOpen(true)}>
        <PencilLine className="h-4 w-4" />
        Chỉnh sửa thông tin
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
              initialData={buildInitialData(exam)}
              onSubmit={onSubmit}
              isLoading={isLoading}
              title="Chỉnh sửa bài thi"
              submitLabel="Lưu thay đổi"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
