'use client'

import { FullPageLoadingOverlay } from '@/components/shared/full-page-loading-overlay'

interface LogoutOverlayProps {
  open: boolean
}

export function LogoutOverlay({ open }: LogoutOverlayProps) {
  return (
    <FullPageLoadingOverlay
      open={open}
      label="Đang đăng xuất..."
      ariaLabel="Đang đăng xuất"
    />
  )
}
