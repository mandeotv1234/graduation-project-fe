'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  hideExamTemplateLineage,
  updateExamTemplateVisibility
} from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { TeacherExamTemplateVersionsResponse } from '@/lib/types'

type TemplateLibraryManagementProps = {
  examId: number
  templateManagement: TeacherExamTemplateVersionsResponse | null
}

export function TemplateLibraryManagement({
  examId,
  templateManagement
}: TemplateLibraryManagementProps) {
  const router = useRouter()

  const [isHidingLineage, setIsHidingLineage] = useState(false)
  const [pendingTemplateId, setPendingTemplateId] = useState<number | null>(
    null
  )

  const versions = templateManagement?.versions ?? []
  const canManage = templateManagement?.canManage ?? false
  const visibleVersions = versions.filter((version) => version.isVisible)

  async function handleHideLineage() {
    setIsHidingLineage(true)
    try {
      await hideExamTemplateLineage(examId)
      toast.success('Đã ẩn đề thi khỏi thư viện')
      router.refresh()
    } catch {
      toast.error('Ẩn đề thi khỏi thư viện thất bại')
    } finally {
      setIsHidingLineage(false)
    }
  }

  async function handleUpdateVisibility(
    templateId: number,
    isVisible: boolean
  ) {
    setPendingTemplateId(templateId)
    try {
      await updateExamTemplateVisibility(templateId, { isVisible })
      toast.success(
        isVisible
          ? 'Đã hiển thị lại phiên bản trong thư viện'
          : 'Đã ẩn phiên bản khỏi thư viện'
      )
      router.refresh()
    } catch {
      toast.error(
        isVisible ? 'Hiện lại phiên bản thất bại' : 'Ẩn phiên bản thất bại'
      )
    } finally {
      setPendingTemplateId(null)
    }
  }

  return (
    <section className="rounded-xl p-4">
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Quản trị phiên bản thư viện
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Xuất bản phiên bản mới được thực hiện ở trang Câu hỏi. Tại đây, bạn
            quản lý hiển thị và lịch sử các phiên bản đã đưa lên thư viện.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={PATH.TEACHER_EXAM_QUESTIONS(examId)}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Tới trang câu hỏi
            </Button>
          </Link>

          {canManage && visibleVersions.length > 0 && (
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleHideLineage}
              disabled={isHidingLineage}
            >
              {isHidingLineage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              Ẩn khỏi thư viện
            </Button>
          )}
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="py-8">
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Bài thi này chưa có phiên bản nào trong thư viện. Hãy vào trang Câu
            hỏi để chia sẻ phiên bản đầu tiên.
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Tổng phiên bản: {versions.length}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
              Đang hiển thị: {visibleVersions.length}
            </span>
          </div>

          {versions.map((version) => (
            <div
              key={version.templateId}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    v{version.version}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      version.isVisible
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {version.isVisible ? 'Đang hiển thị' : 'Đã ẩn'}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {version.title}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {version.sharedByName} ·{' '}
                  {new Date(version.createdAt).toLocaleString('vi-VN')} ·{' '}
                  {version.questionCount} câu hỏi
                </p>

                {version.description && (
                  <p className="text-sm text-muted-foreground">
                    {version.description}
                  </p>
                )}
              </div>

              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 self-start md:self-center"
                  disabled={pendingTemplateId === version.templateId}
                  onClick={() =>
                    handleUpdateVisibility(
                      version.templateId,
                      !version.isVisible
                    )
                  }
                >
                  {pendingTemplateId === version.templateId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : version.isVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {version.isVisible ? 'Ẩn phiên bản' : 'Hiện lại'}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
