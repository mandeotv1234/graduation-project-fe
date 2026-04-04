'use client'

import { useState, useEffect } from 'react'
import { Database, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { getExamSpecification } from '@/lib/actions'
import { ExamSpecification } from '@/lib/types'
import { ExamSpecificationView } from '@/components/shared/exam-specification-view'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/specification-panel/specification-panel.module.scss'

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
    <div className={cn(styles.container, open ? styles.open : styles.closed)}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={styles.toggleButton}
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
          <div className={styles.header}>
            <Database className={styles.headerIcon} />
            <span className={styles.headerTitle}>Đặc tả CSDL</span>
          </div>

          {/* Content — scrollable */}
          <div className={styles.content}>
            {loading ? (
              <div className={styles.loadingState}>
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
        <div className={styles.collapsedState}>
          <Database className={styles.collapsedIcon} />
          <span
            className={styles.collapsedText}
            style={{ writingMode: 'vertical-rl' }}
          >
            Đặc tả CSDL
          </span>
        </div>
      )}
    </div>
  )
}
