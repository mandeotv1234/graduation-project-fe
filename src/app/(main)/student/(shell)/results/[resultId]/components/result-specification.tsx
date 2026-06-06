'use client'

import { useEffect, useMemo, useState } from 'react'
import { Database, FileText, Loader2 } from 'lucide-react'
import { ExamSpecificationView } from '@/components/shared'
import { getExamSpecification } from '@/lib/actions'
import { fetchExamPdfBlobUrl } from '@/lib/api/pdf-client'
import type { ExamSpecification } from '@/lib/types'

interface ResultSpecificationProps {
  examId: number
  pdfFilePath?: string | null
  originalPdfFileName?: string | null
}

export function ResultSpecification({
  examId,
  pdfFilePath,
  originalPdfFileName
}: ResultSpecificationProps) {
  const [spec, setSpec] = useState<ExamSpecification | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const hasPdf = useMemo(
    () => Boolean(pdfFilePath && pdfFilePath.trim().length > 0),
    [pdfFilePath]
  )

  useEffect(() => {
    let cancelled = false

    if (hasPdf) {
      fetchExamPdfBlobUrl(examId)
        .then((url) => !cancelled && setPdfBlobUrl(url))
        .catch(() => !cancelled && setPdfBlobUrl(null))
        .finally(() => !cancelled && setLoading(false))
      return () => {
        cancelled = true
      }
    }

    getExamSpecification(examId)
      .then((res) => !cancelled && setSpec(res.data ?? null))
      .catch(() => !cancelled && setSpec(null))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [examId, hasPdf])

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
    }
  }, [pdfBlobUrl])

  // Nothing to show once loading finishes with no content.
  if (!loading && !spec && !pdfBlobUrl) return null

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <header className="flex items-center gap-2 border-b px-5 py-3">
        {hasPdf ? (
          <FileText className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Database className="h-4 w-4 text-muted-foreground" />
        )}
        <h2 className="text-sm font-bold text-foreground">Đề bài</h2>
        {hasPdf && (
          <span className="truncate text-xs text-muted-foreground">
            {originalPdfFileName || 'Đặc tả PDF'}
          </span>
        )}
      </header>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : hasPdf && pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            title={originalPdfFileName || 'Đề bài PDF'}
            className="h-[75vh] w-full rounded-md border-0"
          />
        ) : spec ? (
          <ExamSpecificationView specification={spec} />
        ) : null}
      </div>
    </section>
  )
}
