'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import styles from '@/app/(main)/create-exam/components/exam-basic-info/exam-basic-info.module.scss'

interface ExamBasicInfoProps {
  title: string
  onTitleChange: (title: string) => void
}

export default function ExamBasicInfo({
  title,
  onTitleChange
}: ExamBasicInfoProps) {
  return (
    <div className={styles.basicInfoContainer}>
      <h2 className={styles.sectionTitle}>Thông tin cơ bản</h2>
      <div className={styles.titleField}>
        <Label htmlFor="exam-title" className={styles.fieldLabel}>
          Tiêu đề bài tập
        </Label>
        <Input
          id="exam-title"
          placeholder="VD: Bài tập 3: Viết câu lệnh SQL cơ bản"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={styles.titleInput}
        />
      </div>
    </div>
  )
}
