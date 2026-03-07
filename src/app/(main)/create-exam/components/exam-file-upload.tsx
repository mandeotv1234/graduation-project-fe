'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, FileText } from 'lucide-react'

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
    <div className="space-y-3">
      <Label className="text-base font-semibold">Tập đính kèm</Label>

      <div
        className="border-2 border-dashed border-border rounded-md p-8 text-center bg-background hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Nhấp để tải tệp hoặc kéo và thả
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC hoặc các tệp văn bản
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-card border border-border rounded-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                type="button"
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
