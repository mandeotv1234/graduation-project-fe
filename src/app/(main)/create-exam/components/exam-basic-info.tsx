'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExamBasicInfoProps {
  title: string
  onTitleChange: (title: string) => void
}

export default function ExamBasicInfo({
  title,
  onTitleChange
}: ExamBasicInfoProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Thông tin cơ bản</h2>
      <div className="space-y-2">
        <Label htmlFor="exam-title" className="text-sm">
          Tiêu đề bài tập
        </Label>
        <Input
          id="exam-title"
          placeholder="VD: Bài tập 3: Viết câu lệnh SQL cơ bản"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-background border-input"
        />
      </div>
    </div>
  )
}
