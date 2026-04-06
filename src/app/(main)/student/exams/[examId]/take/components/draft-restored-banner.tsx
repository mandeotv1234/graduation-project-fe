'use client'

import { RotateCcw, X } from 'lucide-react'

interface DraftRestoredBannerProps {
  onDismiss: () => void
}

export function DraftRestoredBanner({ onDismiss }: DraftRestoredBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300 animate-in slide-in-from-top-2 duration-300">
      <RotateCcw className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        <strong>
          Hệ thống đã tự động khôi phục bản nháp gần nhất của bạn.
        </strong>{' '}
        Hãy kiểm tra lại các câu trả lời.
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
        aria-label="Đóng thông báo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
