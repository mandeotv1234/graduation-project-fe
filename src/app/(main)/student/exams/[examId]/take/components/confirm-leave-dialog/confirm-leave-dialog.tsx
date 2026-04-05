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
import styles from '@/app/(main)/student/exams/[examId]/take/components/confirm-leave-dialog/confirm-leave-dialog.module.scss'

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
      <AlertDialogContent className={styles.container}>
        <AlertDialogHeader>
          <div className={styles.header}>
            <div className={styles.iconContainer}>
              <AlertTriangle className={styles.icon} />
            </div>
            <div className={styles.titleContainer}>
              <AlertDialogTitle className={styles.title}>
                Xác nhận rời khỏi trang?
              </AlertDialogTitle>
              <AlertDialogDescription className={styles.description}>
                Bạn đang trong phiên thi trực tuyến. Mọi dữ liệu câu trả lời
                chưa nộp sẽ bị{' '}
                <span className={styles.warningText}>mất hoàn toàn</span> nếu
                bạn thoát lúc này.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className={styles.noticeBox}>
          <p className={styles.noticeTitle}>Lưu ý:</p>
          <ul className={styles.noticeList}>
            <li>Dữ liệu nháp chỉ được lưu tạm thời trên trình duyệt.</li>
            <li>Hệ thống sẽ ghi nhận hành vi thoát trang vào lịch sử thi.</li>
          </ul>
        </div>

        <AlertDialogFooter className={styles.footer}>
          <AlertDialogCancel className={styles.cancelButton}>
            Tiếp tục làm bài
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={styles.confirmButton}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Xác nhận thoát
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
