'use client'

import { AlertTriangle, Maximize } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { setBlurred, setFullscreen } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import styles from '@/app/(main)/exam/components/blur-overlay/blur-overlay.module.scss'

export function BlurOverlay() {
  const dispatch = useAppDispatch()
  const { isBlurred } = useAppSelector((state) => state.antiCheat)
  const isDev = process.env.NEXT_PUBLIC_ENV === 'development'

  if (isDev || !isBlurred) return null

  const handleReturnToExam = async () => {
    try {
      await document.documentElement.requestFullscreen()
      dispatch(setFullscreen(true))
    } catch {
      // Fullscreen không được hỗ trợ hoặc bị từ chối
    }
    dispatch(setBlurred(false))
  }

  return (
    <div className={styles.overlayContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.iconContainer}>
          <AlertTriangle className={styles.alertIcon} />
        </div>
        <div className={styles.messageContent}>
          <h2 className={styles.title}>Phát hiện rời khỏi bài thi!</h2>
          <p className={styles.description}>
            Hệ thống đã ghi nhận hành vi rời khỏi trang thi. Hành vi này đã được
            ghi lại và thông báo cho giám thị.
          </p>
        </div>
        <Button
          onClick={handleReturnToExam}
          size="lg"
          className={styles.returnButton}
        >
          <Maximize className={styles.buttonIcon} />
          Quay lại bài thi
        </Button>
      </div>
    </div>
  )
}
