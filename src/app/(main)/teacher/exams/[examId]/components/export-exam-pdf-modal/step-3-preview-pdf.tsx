'use client'

import { Download, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { Step3Props } from './export-exam-pdf-modal.types'

export function Step3PreviewPdf({
  pdfBlobUrl,
  filename,
  isLoading,
  error,
  onBack,
  onDownload
}: Step3Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Bước 3: Xem trước và tải xuống
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {filename && !isLoading ? (
            <>
              File: <span className="font-medium">{filename}</span>
            </>
          ) : (
            'Đang tạo PDF...'
          )}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-md border border-border bg-muted/20">
        {isLoading && (
          <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Đang tạo PDF, vui lòng chờ...</p>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex h-[60vh] items-center justify-center px-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                Không thể tạo PDF
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && pdfBlobUrl && (
          <iframe
            src={pdfBlobUrl}
            title={filename}
            className="h-[60vh] w-full border-0"
          />
        )}
      </div>

      <div className="flex justify-between border-t border-border pt-3">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Quay lại chỉnh sửa
        </Button>
        <Button onClick={onDownload} disabled={isLoading || !pdfBlobUrl}>
          <Download className="mr-2 h-4 w-4" />
          Tải xuống PDF
        </Button>
      </div>
    </div>
  )
}
