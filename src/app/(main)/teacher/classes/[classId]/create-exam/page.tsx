'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Database,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  FileText,
  ChevronDown
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { createExam, getSpecifications } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { ExamSpecification, SpecificationResponse } from '@/lib/types'
import { ExamSpecificationView } from '@/components/shared'

interface CreateExamPageProps {
  params: Promise<{ classId: string }>
}

export default function CreateExamPage({ params }: CreateExamPageProps) {
  const { classId } = use(params)
  const classIdNum = Number(classId)
  const router = useRouter()
  const { callApi, isLoading } = useApi()

  const [specifications, setSpecifications] = useState<SpecificationResponse[]>(
    []
  )
  const [loadingSpecs, setLoadingSpecs] = useState(true)

  const [title, setTitle] = useState('')
  const [selectedSpecId, setSelectedSpecId] = useState<number | ''>('')
  const [selectedSpec, setSelectedSpec] =
    useState<SpecificationResponse | null>(null)
  const [showSpecPreview, setShowSpecPreview] = useState(false)

  const [durationMinutes, setDurationMinutes] = useState(60)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    async function fetchSpecifications() {
      setLoadingSpecs(true)
      const specificationsRes = await getSpecifications()
      if (!specificationsRes.data) {
        setLoadingSpecs(false)
        return
      }
      setSpecifications(specificationsRes.data)
      setLoadingSpecs(false)
    }
    fetchSpecifications()
  }, [])

  const handleSelectSpec = (specId: number | '') => {
    setSelectedSpecId(specId)
    setShowSpecPreview(false)
    if (specId === '') {
      setSelectedSpec(null)
      return
    }
    const spec = specifications.find((s) => s.id === specId) ?? null
    setSelectedSpec(spec)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSpec?.id) return

    const result = await callApi(
      createExam({
        specificationId: selectedSpec.id,
        classId: classIdNum,
        title,
        durationMinutes,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        isPublished: true
      })
    )

    if (result.data) {
      router.push(PATH.TEACHER_EXAM_SPECIFICATION(result.data.id))
    }
  }

  const selectedSpecPreview: ExamSpecification | null = selectedSpec
    ? {
        id: selectedSpec.id,
        name: selectedSpec.name,
        description: selectedSpec.description ?? '',
        entities: (selectedSpec.entities ?? []).map((entity) => ({
          entityName: entity.entityName,
          displayName: entity.displayName ?? entity.entityName,
          description: entity.description ?? '',
          orderIndex: entity.orderIndex,
          attributes: (entity.attributes ?? []).map((attribute) => ({
            attributeName: attribute.attributeName,
            dataType: attribute.dataType,
            description: attribute.description ?? '',
            isPrimaryKey: attribute.isPrimaryKey,
            isNullable: attribute.isNullable,
            orderIndex: attribute.orderIndex
          }))
        }))
      }
    : null

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
            <label className="text-sm font-medium text-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Chọn đặc tả CSDL <span className="text-destructive">*</span>
              </div>
              {selectedSpec && (
                <button
                  type="button"
                  onClick={() => setShowSpecPreview((v) => !v)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {showSpecPreview ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Ẩn chi tiết
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Xem chi tiết
                    </>
                  )}
                </button>
              )}
            </label>

            {loadingSpecs ? (
              <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-background text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách đặc tả...
              </div>
            ) : specifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300">
                Chưa có đặc tả nào. Bạn cần tạo specification trước.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedSpecId}
                  onChange={(e) =>
                    handleSelectSpec(
                      e.target.value ? Number(e.target.value) : ''
                    )
                  }
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">-- Chọn đặc tả CSDL --</option>
                  {specifications.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name ?? `Specification #${spec.id}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Đặc tả mô tả các bảng và cột của CSDL mà sinh viên sẽ thao tác
              trong bài thi.
            </p>

            <Link
              href={PATH.TEACHER_SPECIFICATIONS}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Tạo specification mới
            </Link>
          </div>

          {showSpecPreview && selectedSpecPreview && (
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Chi tiết đặc tả
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSpecPreview(false)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Đóng
                </button>
              </div>
              <ExamSpecificationView
                specification={selectedSpecPreview}
                compact
              />
            </div>
          )}

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
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Tạo bài thi
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
