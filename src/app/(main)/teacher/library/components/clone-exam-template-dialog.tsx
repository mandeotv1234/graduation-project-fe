'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  cloneExamTemplate,
  getClasses,
  getExamTemplateVersions
} from '@/lib/actions'
import { ClassListItem, ExamTemplateVersionItem } from '@/lib/types'
import { PATH } from '@/lib/constants'

interface CloneExamTemplateDialogProps {
  sourceExamId: number | null
  onClose: () => void
}

export function CloneExamTemplateDialog({
  sourceExamId,
  onClose
}: CloneExamTemplateDialogProps) {
  const router = useRouter()
  const [versions, setVersions] = useState<ExamTemplateVersionItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  )
  const [classes, setClasses] = useState<ClassListItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [cloning, setCloning] = useState(false)

  useEffect(() => {
    if (sourceExamId) {
      setSelectedClassId(null)
      setSelectedTemplateId(null)
      setLoading(true)
      Promise.all([getExamTemplateVersions(sourceExamId), getClasses(1, 100)])
        .then(([versionsResponse, classesResponse]) => {
          const nextVersions = versionsResponse.data || []
          setVersions(nextVersions)
          setSelectedTemplateId(nextVersions[0]?.templateId ?? null)
          setClasses(classesResponse.data || [])
        })
        .catch(() =>
          toast.error('Không thể tải phiên bản đề thi hoặc danh sách lớp')
        )
        .finally(() => setLoading(false))
    }
  }, [sourceExamId])

  async function handleClone() {
    if (!selectedTemplateId || !selectedClassId) return

    setCloning(true)
    try {
      const res = await cloneExamTemplate(selectedTemplateId, {
        classId: selectedClassId
      })
      toast.success(
        `Đã tạo đề thi "${res.data?.title}" với ${res.data?.questionCount} câu hỏi`
      )
      onClose()
      if (res.data?.examId) {
        router.push(PATH.TEACHER_EXAM_DETAIL(res.data.examId))
      }
    } catch {
      toast.error('Tạo bảng sao đề thi thất bại')
    } finally {
      setCloning(false)
    }
  }

  return (
    <Dialog open={sourceExamId !== null} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo bảng sao từ đề thi mẫu vào lớp</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Chọn phiên bản</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có phiên bản đề thi nào khả dụng.
              </p>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {versions.map((version) => (
                  <button
                    key={version.templateId}
                    type="button"
                    onClick={() => setSelectedTemplateId(version.templateId)}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                      selectedTemplateId === version.templateId
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30 hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">v{version.version}</span>
                      <span className="text-xs text-muted-foreground">
                        {version.questionCount} câu hỏi
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {version.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Chọn lớp học</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bạn chưa có lớp học nào.
              </p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                      selectedClassId === cls.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30 hover:bg-accent'
                    }`}
                  >
                    <span className="font-medium">{cls.classCode}</span>
                    <span className="ml-2 text-muted-foreground">
                      HK {cls.semester}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleClone}
            disabled={!selectedClassId || !selectedTemplateId || cloning}
            className="gap-2"
          >
            {cloning && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Clone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
