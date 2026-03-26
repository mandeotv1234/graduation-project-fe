'use client'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/shared/mode-toggle'
import styles from '@/app/(main)/create-exam/components/create-exam-header/create-exam-header.module.scss'

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
    <header className={styles.headerContainer}>
      <h1 className={styles.title}>Tạo/Chỉnh sửa Bài tập</h1>
      <div className={styles.actions}>
        <ModeToggle />
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className={styles.cancelButton}
        >
          Hủy bỏ
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className={styles.saveButton}
        >
          {isSaving ? 'Đang lưu...' : 'Lưu Bài tập'}
        </Button>
      </div>
    </header>
  )
}
