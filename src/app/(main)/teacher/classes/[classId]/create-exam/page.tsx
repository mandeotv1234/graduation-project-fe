'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Database } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { createExam, getSchemaTemplates } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { SchemaTemplate } from '@/lib/types'

interface CreateExamPageProps {
  params: Promise<{ classId: string }>
}

export default function CreateExamPage({ params }: CreateExamPageProps) {
  const { classId } = use(params)
  const classIdNum = Number(classId)
  const router = useRouter()
  const { callApi, isLoading } = useApi()

  const [templates, setTemplates] = useState<SchemaTemplate[]>([])
  const [title, setTitle] = useState('')
  const [templateId, setTemplateId] = useState<number | ''>('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    async function fetchTemplates() {
      const res = await getSchemaTemplates()
      if (res.data) setTemplates(res.data)
    }
    fetchTemplates()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!templateId) return

    const result = await callApi(
      createExam({
        templateId: Number(templateId),
        classId: classIdNum,
        title,
        durationMinutes,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        isPublished: true
      })
    )

    if (result.data) {
      router.push(PATH.TEACHER_EXAM_QUESTIONS(result.data.id))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={PATH.TEACHER_CLASS_DETAIL(classIdNum)}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tạo bài thi mới
          </h1>
          <p className="text-muted-foreground">Tạo bài thi SQL cho lớp học</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tiêu đề bài thi <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Bài thi CSDL - Giữa kỳ"
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Schema Template <span className="text-destructive">*</span>
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(Number(e.target.value))}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">Chọn schema template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Thời lượng (phút) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              min={1}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Thời gian bắt đầu
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Thời gian kết thúc
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="gap-2 px-6">
            <Save className="h-4 w-4" />
            {isLoading ? 'Đang tạo...' : 'Tạo bài thi'}
          </Button>
        </div>
      </form>
    </div>
  )
}
