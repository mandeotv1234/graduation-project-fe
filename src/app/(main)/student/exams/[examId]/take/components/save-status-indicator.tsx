'use client'

import { Cloud, CloudOff, CloudCheck, Loader2, AlertCircle } from 'lucide-react'
import type { SaveStatus } from '../hooks/use-exam-draft'

interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSavedAt: Date | null
  onManualSave: () => void
  isServerReachable?: boolean
  isSaving?: boolean
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function SaveStatusIndicator({
  status,
  lastSavedAt,
  onManualSave,
  isServerReachable = true
}: SaveStatusIndicatorProps) {
  const effectiveStatus = !isServerReachable ? 'offline' : status

  return (
    <div className="flex items-center gap-2">
      {/* Cloud status icon + text */}
      <button
        type="button"
        onClick={onManualSave}
        title="Lưu tạm bây giờ"
        disabled={effectiveStatus === 'saving'}
        className="flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs transition-all hover:bg-muted/60 disabled:opacity-60"
      >
        {effectiveStatus === 'saving' && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="text-muted-foreground">Đang lưu...</span>
          </>
        )}
        {effectiveStatus === 'saved' && (
          <>
            <CloudCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">
              Đã lưu{lastSavedAt ? ` lúc ${formatTime(lastSavedAt)}` : ''}
            </span>
          </>
        )}
        {effectiveStatus === 'offline' && (
          <>
            <CloudOff className="h-3.5 w-3.5 animate-pulse text-destructive" />
            <span className="text-destructive font-bold">
              Mất kết nối — Đang lưu cục bộ
            </span>
          </>
        )}
        {effectiveStatus === 'error' && (
          <>
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400">
              Lưu lỗi — Thử lại
            </span>
          </>
        )}
        {effectiveStatus === 'idle' && (
          <>
            <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {lastSavedAt
                ? `Đã lưu lúc ${formatTime(lastSavedAt)}`
                : 'Lưu tạm'}
            </span>
          </>
        )}
      </button>
    </div>
  )
}
