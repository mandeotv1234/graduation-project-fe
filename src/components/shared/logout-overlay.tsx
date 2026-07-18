'use client'

import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface LogoutOverlayProps {
  open: boolean
}

export function LogoutOverlay({ open }: LogoutOverlayProps) {
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
      aria-label="Đang đăng xuất"
    >
      <div className="flex flex-col items-center gap-3 text-foreground">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm font-medium">Đang đăng xuất...</p>
      </div>
    </div>,
    document.body
  )
}
