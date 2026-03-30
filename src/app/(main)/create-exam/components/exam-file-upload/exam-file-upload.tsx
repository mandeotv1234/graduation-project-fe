'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, FileText } from 'lucide-react'
import styles from '@/app/(main)/create-exam/components/exam-file-upload/exam-file-upload.module.scss'

interface ExamFileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export default function ExamFileUpload({
  files,
  onFilesChange
}: ExamFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      onFilesChange([...files, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className={styles.fileUploadContainer}>
      <Label className={styles.sectionTitle}>Tập đính kèm</Label>

      <div
        className={styles.uploadArea}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className={styles.uploadText}>
              Kéo và thả tập tin vào đây hoặc{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-primary"
              >
                nhấn để chọn
              </Button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Hỗ trợ: PDF, DOC, DOCX, TXT (tối đa 10MB)
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, index) => (
            <div key={index} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>
                  {formatFileSize(file.size)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className={styles.removeButton}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
