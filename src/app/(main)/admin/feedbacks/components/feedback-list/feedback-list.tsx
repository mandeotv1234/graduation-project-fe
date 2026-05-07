'use client'

import { useEffect, useState, useTransition } from 'react'
import { Star, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'

import { getAdminFeedbacks } from '@/lib/actions/admin.action'
import type { FeedbackItem } from '@/lib/types/admin.type'
import type { PaginationMeta } from '@/lib/types/teacher.type'
import { cn } from '@/lib/utils'

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < value
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/30'
          )}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">
        {value}/{max}
      </span>
    </div>
  )
}

function NpsScore({ value }: { value: number }) {
  const color =
    value >= 9
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : value >= 7
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        color
      )}
    >
      {value}/10
    </span>
  )
}

export function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const res = await getAdminFeedbacks({ page, size: 20 })
      if (res.data) setFeedbacks(res.data)
      if (res.meta?.pagination) setPagination(res.meta.pagination)
    })
  }, [page])

  if (isPending && feedbacks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isPending && feedbacks.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <MessageSquare className="h-10 w-10 opacity-30" />
        <p className="text-sm">Chưa có feedback nào</p>
      </div>
    )
  }

  const totalPages = pagination ? Math.ceil(pagination.total / 20) : 1

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-surface-container/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Sinh viên
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Mã đề thi
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  UI/UX
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Độ tin cậy
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  NPS
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Tính năng mong muốn
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Nhận xét chung
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {feedbacks.map((fb) => (
                <tr
                  key={fb.id}
                  className="hover:bg-surface-container/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {fb.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fb.studentEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    #{fb.examId}
                  </td>
                  <td className="px-4 py-3">
                    <StarRating value={fb.uiUxRating} />
                  </td>
                  <td className="px-4 py-3">
                    <StarRating value={fb.systemReliabilityRating} />
                  </td>
                  <td className="px-4 py-3">
                    <NpsScore value={fb.npsScore} />
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {fb.featureRequests ? (
                      <p
                        className="truncate text-foreground"
                        title={fb.featureRequests}
                      >
                        {fb.featureRequests}
                      </p>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {fb.generalFeedback ? (
                      <p
                        className="truncate text-foreground"
                        title={fb.generalFeedback}
                      >
                        {fb.generalFeedback}
                      </p>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(fb.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
            {pagination && <span> · {pagination.total} feedback</span>}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-surface-container disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-surface-container disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
