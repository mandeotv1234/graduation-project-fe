'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, Maximize } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { IS_PRODUCTION_ENV } from '@/lib/constants/environment'
import { setBlurred, setFullscreen } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import styles from '@/app/(main)/exam/components/blur-overlay/blur-overlay.module.scss'

interface BlurOverlayProps {
  requireFullscreen?: boolean
}

export function BlurOverlay({ requireFullscreen = false }: BlurOverlayProps) {
  const dispatch = useAppDispatch()
  const { isBlurred, isFullscreen } = useAppSelector((state) => state.antiCheat)
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!IS_PRODUCTION_ENV || !requireFullscreen || !isBlurred || isFullscreen) {
    return null
  }

  const handleReturnToExam = async () => {
    setIsRequesting(true)
    setError(null)
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
      if (!document.fullscreenElement) {
        throw new Error('Fullscreen request was not accepted')
      }
      dispatch(setFullscreen(true))
      dispatch(setBlurred(false))
    } catch {
      setError('Không thể bật toàn màn hình. Vui lòng cấp quyền và thử lại.')
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className={styles.overlayContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.iconContainer}>
          <AlertTriangle className={styles.alertIcon} />
        </div>
        <div className={styles.messageContent}>
          <h2 className={styles.title}>Phát hiện thoát toàn màn hình!</h2>
          <p className={styles.description}>
            Bài thi này bắt buộc ở chế độ toàn màn hình. Nội dung bài làm sẽ bị
            khóa cho đến khi bạn quay lại toàn màn hình.
          </p>
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
        <Button
          onClick={handleReturnToExam}
          size="lg"
          className={styles.returnButton}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <Loader2 className={`${styles.buttonIcon} animate-spin`} />
          ) : (
            <Maximize className={styles.buttonIcon} />
          )}
          {isRequesting ? 'Đang bật toàn màn hình...' : 'Trở lại toàn màn hình'}
        </Button>
      </div>
    </div>
  )
}
