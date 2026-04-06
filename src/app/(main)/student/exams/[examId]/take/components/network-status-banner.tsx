'use client'

import { WifiOff, AlertTriangle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NetworkStatusBannerProps {
  isReachable: boolean
  onDownloadBackup: () => void
}

export function NetworkStatusBanner({
  isReachable,
  onDownloadBackup
}: NetworkStatusBannerProps) {
  if (isReachable) return null

  return (
    <div className="sticky top-0 z-50 w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col items-center justify-between gap-4 border-b border-destructive/20 bg-destructive/10 px-4 py-3 backdrop-blur-md sm:flex-row sm:px-6">
        <div className="flex items-center gap-3 text-destructive">
          <div className="rounded-full bg-destructive/20 p-2">
            <WifiOff className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight">
              Mất kết nối với máy chủ!
            </span>
            <p className="text-xs opacity-90">
              Hãy tiếp tục làm bài. Hệ thống đang lưu bài làm vào bộ nhớ trình
              duyệt (LocalStorage).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadBackup}
            className="h-8 gap-1.5 border-destructive/30 bg-background/50 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive"
          >
            <Download className="h-3.5 w-3.5" />
            Tải bản sao lưu (.json)
          </Button>

          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            Giữ nguyên màn hình này
          </div>
        </div>
      </div>
    </div>
  )
}
