'use client'

import { Loader2, Maximize, Shield, ShieldCheck } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { startExamSession } from '@/lib/actions/anti-cheat.action'
import { setFullscreen } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import type { StartExamSessionResponse } from '@/lib/types'
import styles from '@/app/(main)/exam/components/fullscreen-gate/fullscreen-gate.module.scss'

interface FullscreenGateProps {
  examId: number
  children: ReactNode
  onSessionStarted?: (session: StartExamSessionResponse) => void
}

export function FullscreenGate({
  examId,
  children,
  onSessionStarted
}: FullscreenGateProps) {
  const dispatch = useAppDispatch()
  const { isFullscreen } = useAppSelector((state) => state.antiCheat)
  const [isSupported, setIsSupported] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsSupported(!!document.documentElement.requestFullscreen)
    if (document.fullscreenElement) {
      dispatch(setFullscreen(true))
    }
  }, [dispatch])

  const handleEnterFullscreen = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Bật fullscreen trước (cần user gesture)
      await document.documentElement.requestFullscreen()
      dispatch(setFullscreen(true))
    } catch {
      setError('Không thể bật chế độ toàn màn hình. Vui lòng thử lại.')
      setIsLoading(false)
      return
    }

    try {
      // 2. Gọi startExamSession sau khi fullscreen thành công
      const result = await startExamSession(examId)

      if (result.data) {
        if (!result.data.sessionStarted) {
          setError(
            result.data.message ||
              'Không thể bắt đầu phiên thi. Có thể bạn đã đăng nhập ở thiết bị khác.'
          )
          // Thoát fullscreen nếu session thất bại
          if (document.fullscreenElement) {
            await document.exitFullscreen()
          }
          dispatch(setFullscreen(false))
          setIsLoading(false)
          return
        }

        // 3. Trả session data cho parent
        onSessionStarted?.(result.data)
      } else {
        // API trả về nhưng không có data — vẫn cho vào thi, timer sẽ sync từ getExamTime
        console.warn(
          '[FullscreenGate] startExamSession returned no data, using fallback'
        )
        onSessionStarted?.({
          sessionStarted: true,
          message: 'Fallback session',
          serverTime: new Date().toISOString(),
          examStartedAt: new Date().toISOString(),
          examEndTime: '',
          remainingSeconds: 0, // Timer sẽ sync từ getExamTime
          durationMinutes: 0
        })
      }
    } catch (err) {
      console.error('[FullscreenGate] startExamSession failed:', err)
      // API lỗi — vẫn cho vào thi, timer sẽ sync từ getExamTime
      onSessionStarted?.({
        sessionStarted: true,
        message: 'Fallback session (API error)',
        serverTime: new Date().toISOString(),
        examStartedAt: new Date().toISOString(),
        examEndTime: '',
        remainingSeconds: 0,
        durationMinutes: 0
      })
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, examId, onSessionStarted])

  if (!isSupported || isFullscreen) {
    return <>{children}</>
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <Shield className={styles.headerIcon} />
          </div>
          <h2 className={styles.title}>Chế độ thi an toàn</h2>
          <p className={styles.description}>
            Để đảm bảo tính công bằng, bạn cần bật chế độ toàn màn hình trước
            khi bắt đầu làm bài.
          </p>
        </div>

        {/* Rules */}
        <div className={styles.rulesSection}>
          <div className={styles.ruleItem}>
            <ShieldCheck className={styles.ruleIcon} />
            <div>
              <p className={styles.ruleTitle}>Hệ thống giám sát</p>
              <p className={styles.ruleDescription}>
                Hệ thống sẽ giám sát các hành vi: chuyển tab, copy/paste, mở
                DevTools và phím tắt bị cấm.
              </p>
            </div>
          </div>
          <div className={styles.ruleItem}>
            <ShieldCheck className={styles.ruleIcon} />
            <div>
              <p className={styles.ruleTitle}>Ghi nhận vi phạm</p>
              <p className={styles.ruleDescription}>
                Mọi vi phạm sẽ được ghi lại và gửi cho giám thị. Sau 10 lần vi
                phạm, bài thi sẽ bị nộp tự động.
              </p>
            </div>
          </div>
          <div className={styles.ruleItem}>
            <ShieldCheck className={styles.ruleIcon} />
            <div>
              <p className={styles.ruleTitle}>Watermark bảo mật</p>
              <p className={styles.ruleDescription}>
                Mã sinh viên của bạn sẽ được hiển thị chìm trên giao diện để
                chống chụp ảnh rò rỉ đề thi.
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.errorMessage}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={handleEnterFullscreen}
          disabled={isLoading}
          size="lg"
          className={styles.ctaButton}
        >
          {isLoading ? (
            <>
              <Loader2 className={styles.spinnerIcon} />
              Đang khởi tạo phiên thi...
            </>
          ) : (
            <>
              <Maximize className={styles.buttonIcon} />
              Bật toàn màn hình & Bắt đầu
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
