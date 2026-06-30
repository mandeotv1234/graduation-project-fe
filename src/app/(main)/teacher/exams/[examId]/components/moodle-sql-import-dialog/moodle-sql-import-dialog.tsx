'use client'

import { ChangeEvent, useMemo, useRef, useState, useTransition } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  Info,
  Loader2,
  Upload,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { confirmMoodleSqlImport, previewMoodleSqlImport } from '@/lib/actions'
import type { MoodleSqlImportPreviewResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

import styles from './moodle-sql-import-dialog.module.scss'

interface MoodleSqlImportDialogProps {
  examId: number
  onImported: () => void
}

const sqlTemplate = `-- STUDENT_CODE: 22120201

-- QUESTION_ORDER: 1
SELECT ...
-- END_QUESTION

-- QUESTION_ORDER: 2
CREATE TABLE ...
-- END_QUESTION`

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function buildFormData(files: File[]): FormData {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file, file.name)
  })
  return formData
}

function isSuccessfulImportCode(code?: string): boolean {
  return ['OK', 'ACCEPTED', 'SUCCESS', 'CREATED', '200', '201', '202'].includes(
    code ?? ''
  )
}

function getResponseMessage(message: string | undefined, fallback: string) {
  if (!message || message === 'OK') return fallback
  return message
}

export function MoodleSqlImportDialog({
  examId,
  onImported
}: MoodleSqlImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<MoodleSqlImportPreviewResponse | null>(
    null
  )
  const [isPending, startTransition] = useTransition()
  const [isConfirming, setIsConfirming] = useState(false)

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  )

  const canConfirm =
    Boolean(preview?.readyToImport) &&
    !isPending &&
    !isConfirming &&
    files.length > 0

  const resetState = () => {
    setFiles([])
    setPreview(null)
    setIsConfirming(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetState()
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    setFiles(selectedFiles)
    setPreview(null)
  }

  const handleClearFiles = () => {
    setFiles([])
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePreview = () => {
    if (files.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file .sql')
      return
    }

    startTransition(async () => {
      const response = await previewMoodleSqlImport(
        examId,
        buildFormData(files)
      )
      if (!response.data) {
        toast.error(
          getResponseMessage(
            response.message,
            'Không thể đọc kết quả kiểm tra file SQL'
          )
        )
        return
      }

      setPreview(response.data)
      if (response.data.readyToImport) {
        toast.success(`Tất cả ${response.data.validFiles} file đều hợp lệ`)
      } else {
        toast.error(
          `${response.data.invalidFiles} file cần sửa trước khi import`
        )
      }
    })
  }

  const handleConfirm = async () => {
    if (!canConfirm) return

    setIsConfirming(true)
    const response = await confirmMoodleSqlImport(examId, buildFormData(files))
    setIsConfirming(false)

    const isAcceptedWithoutPayload =
      !response.data && isSuccessfulImportCode(response.code)

    if (!response.data && !isAcceptedWithoutPayload) {
      toast.error(
        getResponseMessage(response.message, 'Không thể import bài làm SQL')
      )
      return
    }

    toast.success('Import SQL thành công', {
      description: response.data
        ? `Đã tạo ${response.data.importedCount} bài nộp từ file SQL và đưa ${response.data.queuedCount} bài vào hàng đợi chấm tự động.`
        : 'Hệ thống đã nhận file SQL, tạo bài nộp và bắt đầu chấm tự động. Vào trang kết quả để theo dõi điểm.'
    })
    setOpen(false)
    resetState()
    onImported()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileUp className="h-4 w-4" />
          Import SQL
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl flex-col overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Import file SQL để chấm tự động</DialogTitle>
          <DialogDescription>
            Upload danh sách file sinh viên nộp ngoài hệ thống. Hệ thống sẽ kiểm
            tra mapping trước khi tạo lượt nộp mới và chấm tự động.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-md border bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Điều kiện file</h3>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Mỗi file .sql là bài làm của một sinh viên.</li>
                <li>
                  Tên file hoặc header phải có MSSV/email. MSSV lấy từ email, ví
                  dụ 22120201@student.hcmus.edu.vn có MSSV là 22120201.
                </li>
                <li>
                  Mỗi câu trả lời dùng marker QUESTION_ID hoặc QUESTION_ORDER.
                  QUESTION_ORDER là thứ tự câu hỏi giáo viên thấy trong đề.
                </li>
                <li>
                  File trùng sinh viên, không map được sinh viên, sai marker,
                  hoặc không phải .sql sẽ không được import.
                </li>
                <li>
                  Câu thiếu marker được xem là chưa nộp và sẽ bị chấm như bài
                  trống.
                </li>
              </ol>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Mẫu nội dung file</p>
              <pre className={styles.codeSample}>{sqlTemplate}</pre>
            </div>
          </section>

          <section className="rounded-md border bg-background p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Danh sách file</h3>
                <p className="text-xs text-muted-foreground">
                  Chọn nhiều file .sql, tối đa 5MB mỗi file.
                </p>
              </div>
              {files.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={handleClearFiles}
                >
                  <X className="h-4 w-4" />
                  Xóa chọn
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept=".sql,text/plain"
              multiple
              onChange={handleFileChange}
            />
            <button
              type="button"
              className={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-7 w-7 text-muted-foreground" />
              <span className="text-sm font-semibold">
                Chọn hoặc thay danh sách file SQL
              </span>
              <span className="text-xs text-muted-foreground">
                Hệ thống sẽ kiểm tra file trước khi import.
              </span>
            </button>

            {files.length > 0 && (
              <div className="mt-4 rounded-md border">
                <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
                  <span>
                    {files.length} file, tổng {formatFileSize(totalSize)}
                  </span>
                  <span>Preview trước khi import</span>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {preview && (
            <section className="rounded-md border bg-background">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Kết quả kiểm tra</h3>
                  <p className="text-xs text-muted-foreground">
                    {preview.validFiles}/{preview.totalFiles} file hợp lệ,
                    {` ${preview.totalQuestions}`} câu hỏi trong đề.
                  </p>
                </div>
                <Badge
                  variant={preview.readyToImport ? 'secondary' : 'destructive'}
                >
                  {preview.readyToImport ? 'Sẵn sàng import' : 'Cần sửa file'}
                </Badge>
              </div>

              <div className="max-h-[22rem] overflow-y-auto">
                {preview.files.map((file) => (
                  <div
                    key={file.fileName}
                    className="border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {file.valid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                          <p className="truncate text-sm font-semibold">
                            {file.fileName}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {file.studentName
                            ? `${file.studentName} - ${file.studentEmail}`
                            : file.detectedIdentifier ||
                              'Chưa nhận diện sinh viên'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {file.answeredQuestions}/{preview.totalQuestions} câu
                        </Badge>
                        <Badge
                          variant={file.valid ? 'secondary' : 'destructive'}
                        >
                          {file.valid ? 'Hợp lệ' : 'Có lỗi'}
                        </Badge>
                      </div>
                    </div>

                    {(file.errors.length > 0 || file.warnings.length > 0) && (
                      <div className="mt-3 space-y-2">
                        {file.errors.map((error) => (
                          <div
                            key={error}
                            className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                          >
                            {error}
                          </div>
                        ))}
                        {file.warnings.map((warning) => (
                          <div
                            key={warning}
                            className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {file.answers.map((answer) => (
                        <span
                          key={answer.questionId}
                          className={cn(
                            'rounded-md border px-2 py-1 text-[11px] font-semibold',
                            answer.hasAnswer
                              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'border-border bg-muted text-muted-foreground'
                          )}
                        >
                          Câu {answer.orderIndex ?? answer.questionId}:{' '}
                          {answer.hasAnswer
                            ? `${answer.sqlLength} ký tự`
                            : 'trống'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending || isConfirming}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={isPending || isConfirming || files.length === 0}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Kiểm tra file
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="gap-2"
          >
            {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
            Import và chấm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
