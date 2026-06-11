'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PATH } from '@/lib/constants'
import { createExam } from '@/lib/actions'
import { createExamWithPdf } from '@/lib/api/exam-client'
import { useApi } from '@/hooks/use-api'
import { ExamForm } from '@/app/(main)/teacher/exams/components/exam-form'
import { ExamFormValues } from '@/app/(main)/teacher/exams/components/exam-form-schema'
import { PdfUploadDialog } from '@/app/(main)/teacher/exams/[examId]/questions/components/pdf-upload-dialog/pdf-upload-dialog'

interface CreateExamPageClientProps {
  classId: string
}

export default function CreateExamPageClient({
  classId
}: CreateExamPageClientProps) {
  const classIdNum = Number(classId)
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [pendingExamId, setPendingExamId] = useState<number | null>(null)

  const onSubmit = async (
    data: ExamFormValues,
    pdfFile?: File | null,
    options?: { autoExtractFromPdf?: boolean; removePdf?: boolean }
  ) => {
    const payload = {
      ...data,
      classId: classIdNum,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined
    }

    const result = pdfFile
      ? await callApi(createExamWithPdf(payload, pdfFile))
      : await callApi(createExam(payload))

    if (!result.data) return

    if (pdfFile && options?.autoExtractFromPdf) {
      // PDF uploaded + giáo viên chọn tách câu hỏi → mở hộp thoại AI trước khi điều hướng
      setPendingExamId(result.data.id)
    } else {
      router.push(PATH.TEACHER_EXAM_DETAIL(result.data.id))
    }
  }

  return (
    <>
      <ExamForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        title="Tạo bài thi mới"
        submitLabel="Tạo bài thi"
      />

      {pendingExamId !== null && (
        <PdfUploadDialog
          open
          examId={pendingExamId}
          onQuestionsCreated={() => {
            router.push(PATH.TEACHER_EXAM_QUESTIONS(pendingExamId))
          }}
          onClose={() => {
            router.push(PATH.TEACHER_EXAM_DETAIL(pendingExamId))
          }}
        />
      )}
    </>
  )
}
