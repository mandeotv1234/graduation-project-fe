'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Database,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText
} from 'lucide-react'
import { getExamSpecification } from '@/lib/actions'
import { ExamSpecification } from '@/lib/types'
import { ExamSpecificationView } from '@/components/shared/exam-specification-view'
import { fetchExamPdfBlobUrl } from '@/lib/api/pdf-client'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/specification-panel/specification-panel.module.scss'

interface SpecificationPanelProps {
  examId: number
  pdfFilePath?: string | null
  originalPdfFileName?: string | null
}

export function SpecificationPanel({
  examId,
  pdfFilePath,
  originalPdfFileName
}: SpecificationPanelProps) {
  const [open, setOpen] = useState(false)
  const [spec, setSpec] = useState<ExamSpecification | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  const hasPdf = useMemo(
    () => Boolean(pdfFilePath && pdfFilePath.trim().length > 0),
    [pdfFilePath]
  )

  useEffect(() => {
    if (hasPdf) {
      fetchExamPdfBlobUrl(examId)
        .then((url) => setPdfBlobUrl(url))
        .catch(() => setPdfBlobUrl(null))
        .finally(() => setLoading(false))
      return
    }

    getExamSpecification(examId)
      .then((res) => setSpec(res.data ?? null))
      .catch(() => setSpec(null))
      .finally(() => setLoading(false))
  }, [examId, hasPdf])

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
    }
  }, [pdfBlobUrl])

  if (!loading && !spec && !hasPdf) return null

  return (
    <div className={cn(styles.container, open ? styles.open : styles.closed)}>
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
          <div className={styles.header}>
            {hasPdf ? (
              <FileText className={styles.headerIcon} />
            ) : (
              <Database className={styles.headerIcon} />
            )}
            <span className={styles.headerTitle}>
              {hasPdf ? originalPdfFileName || 'Đặc tả PDF' : 'Đặc tả CSDL'}
            </span>
          </div>

          <div className={styles.content}>
            {loading ? (
              <div className={styles.loadingState}>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : hasPdf && pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                title={originalPdfFileName || 'Exam PDF'}
                className="h-full w-full border-0"
                style={{ minHeight: 'calc(100vh - 120px)' }}
              />
            ) : spec ? (
              <ExamSpecificationView specification={spec} compact />
            ) : null}
          </div>
        </>
      )}

      {!open && (
        <div className={styles.collapsedState}>
          {hasPdf ? (
            <FileText className={styles.collapsedIcon} />
          ) : (
            <Database className={styles.collapsedIcon} />
          )}
          <span
            className={styles.collapsedText}
            style={{ writingMode: 'vertical-rl' }}
          >
            {hasPdf ? 'Đặc tả PDF' : 'Đặc tả CSDL'}
          </span>
        </div>
      )}
    </div>
  )
}
