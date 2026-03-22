'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PATH } from '@/lib/constants'
import { getTeacherExamDetail, updateExam } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { ExamForm } from '@/app/(main)/teacher/exams/components/exam-form'
import {
  ExamFormInput,
  ExamFormValues
} from '@/app/(main)/teacher/exams/components/exam-form-schema'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EditExamPageProps {
  params: Promise<{ examId: string }>
}

type InitialData = Partial<ExamFormInput> & {
  id: number
  classId: number
}

export default function EditExamPage({ params }: EditExamPageProps) {
  const { examId } = use(params)
  const examIdNum = Number(examId)
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [initialData, setInitialData] = useState<InitialData | undefined>(
    undefined
  )
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    async function fetchExamDetail() {
      try {
        const response = await getTeacherExamDetail(examIdNum)
        if (response.data) {
          // Map backend response to form values
          const data = response.data
          setInitialData({
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
          })
        } else {
          toast.error('Không tìm thấy thông tin bài thi')
          router.back()
        }
      } catch (error) {
        console.error('Error fetching exam detail:', error)
        toast.error('Có lỗi xảy ra khi tải thông tin bài thi')
        router.back()
      } finally {
        setIsFetching(false)
      }
    }
    fetchExamDetail()
  }, [examIdNum, router])

  const onSubmit = async (data: ExamFormValues) => {
    // Treat empty string dates as undefined/null for backend
    const payload = {
      ...data,
      startTime: data.startTime || null,
      endTime: data.endTime || null
    }

    const result = await callApi(updateExam(examIdNum, payload), false)

    if (result.code === '200' || result.code === 'OK') {
      toast.success('Cập nhật bài thi thành công')
      // Determine back path - could be class detail if we had classId,
      // but for now let's just go back or to a sensible default
      router.back()
    }
  }

  if (isFetching) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!initialData) return null

  return (
    <ExamForm
      initialData={initialData}
      onSubmit={onSubmit}
      isLoading={isLoading}
      title="Chỉnh sửa bài thi"
      submitLabel="Lưu thay đổi"
      backPath={PATH.TEACHER_CLASS_DETAIL(initialData.classId)}
    />
  )
}
