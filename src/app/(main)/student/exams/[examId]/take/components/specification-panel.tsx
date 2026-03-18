'use client'

import { useState, useEffect } from 'react'
import { Database, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { getExamSpecification } from '@/lib/actions'
import { ExamSpecification } from '@/lib/types'
import { ExamSpecificationView } from '@/components/shared/exam-specification-view'

interface SpecificationPanelProps {
  examId: number
}

export function SpecificationPanel({ examId }: SpecificationPanelProps) {
  const [open, setOpen] = useState(false)
  const [spec, setSpec] = useState<ExamSpecification | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExamSpecification(examId)
      .then((res) => setSpec(res.data ?? null))
      .catch(() => setSpec(null))
      .finally(() => setLoading(false))
  }, [examId])

  // If no spec, don't render the panel at all
  if (!loading && !spec) return null

  return (
    <div
      className={`relative flex flex-col border-r border-border bg-background transition-[width] duration-300 ease-in-out shrink-0 ${
        open ? 'w-[300px] xl:w-[340px]' : 'w-9'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-muted transition-colors"
        title={open ? 'Ẩn đặc tả' : 'Xem đặc tả CSDL'}
      >
        {open ? (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {open && (
        <>
          {/* Panel header */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 bg-primary/5 shrink-0">
            <Database className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide truncate">
              Đặc tả CSDL
            </span>
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : spec ? (
              /* compact=true: single-column stacked, no relation summary panel,
                 but FK legend lines still show on each card and description is
                 fully visible (no truncation) */
              <ExamSpecificationView specification={spec} compact />
            ) : null}
          </div>
        </>
      )}

      {/* Collapsed indicator */}
      {!open && (
        <div className="flex flex-col items-center gap-1 pt-10">
          <Database className="h-4 w-4 text-primary" />
          <span
            className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide"
            style={{ writingMode: 'vertical-rl' }}
          >
            Đặc tả CSDL
          </span>
        </div>
      )}
    </div>
  )
}
