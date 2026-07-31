'use client'

import { useEffect, useState } from 'react'
import { FileText, User, Calendar, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'

import { getExamTemplates } from '@/lib/actions'
import { ExamTemplateListItem } from '@/lib/types'
import { CloneExamTemplateDialog } from './clone-exam-template-dialog'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/time'

export function ExamTemplateLibraryTab() {
  const [templates, setTemplates] = useState<ExamTemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cloneSourceExamId, setCloneSourceExamId] = useState<number | null>(
    null
  )

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const res = await getExamTemplates()
      setTemplates(res.data || [])
    } catch {
      toast.error('Không thể tải danh sách đề thi mẫu')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Chưa có đề thi mẫu nào
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Chia sẻ đề thi từ trang quản lý bài thi để tạo mẫu.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.sourceExamId}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500/60 via-violet-500 to-violet-500/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {template.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Phiên bản mới nhất: v{template.latestVersion} ·{' '}
                    {template.versionCount} phiên bản
                  </p>
                </div>
              </div>

              {template.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {template.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {template.sharedByName}
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" />
                  {template.questionCount} câu hỏi ở bản mới nhất
                </span>
              </div>

              {template.latestSharedAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(template.latestSharedAt)}
                </div>
              )}
            </div>

            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                onClick={() => setCloneSourceExamId(template.sourceExamId)}
              >
                Tạo bản sao vào lớp
              </Button>
            </div>
          </div>
        ))}
      </div>

      <CloneExamTemplateDialog
        sourceExamId={cloneSourceExamId}
        onClose={() => setCloneSourceExamId(null)}
      />
    </>
  )
}
