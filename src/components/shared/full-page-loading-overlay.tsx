'use client'

import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface FullPageLoadingOverlayProps {
  open: boolean
  label?: string
  ariaLabel?: string
}

export function FullPageLoadingOverlay({
  open,
  label = 'Đang tải dữ liệu...',
  ariaLabel = label
}: FullPageLoadingOverlayProps) {
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-background/90 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
      aria-label={ariaLabel}
    >
      <div className="flex flex-col items-center gap-3 text-foreground">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>,
    document.body
  )
}
