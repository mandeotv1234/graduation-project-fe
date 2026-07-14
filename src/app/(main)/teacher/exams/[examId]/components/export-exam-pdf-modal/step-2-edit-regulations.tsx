'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import type { Step2Props } from './export-exam-pdf-modal.types'

const MAX_REGULATIONS_LENGTH = 5000

export function Step2EditRegulations({
  regulations,
  onRegulationsChange,
  onBack,
  onNext,
  isLoading
}: Step2Props) {
  const [isAdvancing, setIsAdvancing] = useState(false)

  const handleNext = async () => {
    setIsAdvancing(true)
    try {
      await onNext()
    } finally {
      setIsAdvancing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Bước 2: Quy định bài thi
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Nhập quy định hiển thị trong đề thi. Để trống để dùng mô tả bài thi
          mặc định.
        </p>
      </div>

      <Textarea
        value={regulations}
        onChange={(e) => onRegulationsChange(e.target.value)}
        placeholder="Nhập quy định bài thi (nội quy, hướng dẫn, ...)..."
        className="min-h-[200px] resize-y text-sm"
        maxLength={MAX_REGULATIONS_LENGTH}
        disabled={isLoading || isAdvancing}
      />

      <p className="text-right text-xs text-muted-foreground">
        {regulations.length}/{MAX_REGULATIONS_LENGTH}
      </p>

      <div className="-mx-6 -mb-5 mt-auto flex shrink-0 justify-between border-t border-border bg-background px-6 py-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading || isAdvancing}
        >
          Quay lại
        </Button>
        <Button onClick={handleNext} disabled={isLoading || isAdvancing}>
          {isAdvancing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Xem trước PDF
        </Button>
      </div>
    </div>
  )
}
