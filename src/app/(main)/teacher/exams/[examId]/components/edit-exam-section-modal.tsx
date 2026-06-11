'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, PencilLine, Save } from 'lucide-react'
import { toast } from 'sonner'

import {
  buildExamFormInitialData,
  mergeTeacherExamAfterUpdate
} from './edit-exam-modal-button'
import {
  ExamForm,
  ExamFormFocusSection
} from '@/app/(main)/teacher/exams/components/exam-form'
import { ExamFormValues } from '@/app/(main)/teacher/exams/components/exam-form-schema'
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
import { SpecificationDetailResponse, TeacherExamDetail } from '@/lib/types'
import { cn } from '@/lib/utils'

const SECTION_DIALOG: Record<
  ExamFormFocusSection,
  { title: string; description: string }
> = {
  overview: {
    title: 'Chỉnh sửa tổng quan bài thi',
    description: 'Tiêu đề, đặc tả CSDL, thời lượng và khung thời gian làm bài.'
  },
  submission: {
    title: 'Chỉnh sửa quy định nộp bài',
    description:
      'Xuất bản, số lần làm, nộp trễ, cách tính điểm và hiển thị điểm.'
  },
  antiCheat: {
    title: 'Chỉnh sửa chống gian lận',
    description: 'Copy/paste, toàn màn hình, chuyển tab và nộp khi vi phạm.'
  },
  description: {
    title: 'Chỉnh sửa mô tả và nội quy',
    description: 'Hướng dẫn và quy định hiển thị cho sinh viên.'
  }
}

type EditExamSectionModalProps = {
  exam: TeacherExamDetail
  section: ExamFormFocusSection
  specification?: SpecificationDetailResponse | null
  onSaved?: (updatedExam: TeacherExamDetail) => void
  className?: string
}

export function EditExamSectionModal({
  exam,
  section,
  specification,
  onSaved,
  className
}: EditExamSectionModalProps) {
  const { callApi, isLoading } = useApi()
  const [isOpen, setIsOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const meta = SECTION_DIALOG[section]

  const onSubmit = async (
    data: ExamFormValues,
    pdfFile?: File | null,
    options?: { autoExtractFromPdf?: boolean; removePdf?: boolean }
  ) => {
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
      result = await callApi(
        updateExam(exam.id, { ...payload, removePdf: options?.removePdf }),
        false
      )
    }

    if (result.code === '200' || result.code === 'OK') {
      const updatedExam = mergeTeacherExamAfterUpdate(
        exam,
        payload,
        result.data
      )

      toast.success('Cập nhật bài thi thành công')
      setIsOpen(false)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null
        onSaved?.(updatedExam)
      }, 220)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground',
          className
        )}
        onClick={() => setIsOpen(true)}
        aria-label={meta.title}
      >
        <PencilLine className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
          showCloseButton
        >
          <DialogHeader className="border-b border-border px-6 py-4 text-left">
            <DialogTitle>{meta.title}</DialogTitle>
            <DialogDescription>{meta.description}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4 sm:px-6">
            <ExamForm
              initialData={buildExamFormInitialData(exam)}
              onSubmit={onSubmit}
              isLoading={isLoading}
              title={meta.title}
              submitLabel="Lưu thay đổi"
              focusSection={section}
              initialSpecificationDetail={specification ?? null}
              initialPdfFileName={
                exam.pdfFilePath ? exam.originalPdfFileName : null
              }
            />
          </div>
          <div className="flex shrink-0 justify-end border-t border-border bg-background px-6 py-4">
            <Button
              type="submit"
              form="exam-form"
              disabled={isLoading}
              className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
