'use client'

import { AlertTriangle, LogOut } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface ConfirmLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmLeaveDialog({
  open,
  onOpenChange,
  onConfirm
}: ConfirmLeaveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-xl font-bold">
                Xác nhận rời khỏi trang?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed">
                Bạn đang trong phiên thi trực tuyến. Mọi dữ liệu câu trả lời
                chưa nộp sẽ bị{' '}
                <span className="font-bold text-destructive">
                  mất hoàn toàn
                </span>{' '}
                nếu bạn thoát lúc này.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="my-4 rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground border border-border/50">
          <p className="font-medium text-foreground mb-1">Lưu ý:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Dữ liệu nháp chỉ được lưu tạm thời trên trình duyệt.</li>
            <li>Hệ thống sẽ ghi nhận hành vi thoát trang vào lịch sử thi.</li>
          </ul>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="flex-1 sm:order-1 border-border/60 hover:bg-muted font-semibold">
            Tiếp tục làm bài
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 sm:order-2 bg-destructive hover:bg-destructive/90 text-white font-bold shadow-sm shadow-destructive/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Xác nhận thoát
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
