'use client'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/shared/mode-toggle'

interface CreateExamHeaderProps {
  onCancel: () => void
  onSave: () => void
  isSaving?: boolean
}

export default function CreateExamHeader({
  onCancel,
  onSave,
  isSaving = false
}: CreateExamHeaderProps) {
  return (
    <header className="min-h-16 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
      <h1 className="text-lg font-bold">Tạo/Chỉnh sửa Bài tập</h1>
      <div className="flex items-center gap-4">
        <ModeToggle />
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="px-6"
        >
          Hủy bỏ
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu Bài tập'}
        </Button>
      </div>
    </header>
  )
}
