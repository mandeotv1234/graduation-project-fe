'use client'

import { Loader2, Maximize, Shield, ShieldCheck } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { setFullscreen } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import type { StartExamSessionResponse, ApiResponse } from '@/lib/types'
import { WaitingApprovalOverlay } from '@/app/(main)/exam/components/waiting-approval-overlay/waiting-approval-overlay'
import styles from '@/app/(main)/exam/components/fullscreen-gate/fullscreen-gate.module.scss'

/**
 * Client-side fetch to the Next.js proxy route that forwards requests to the
 * backend WITH the real browser IP and User-Agent.
 *
 * We intentionally do NOT use a Server Action here because Server Actions run
 * on the Node.js server — their IP would be 127.0.0.1 and UA would be Node.js,
 * making device fingerprinting useless.
 */
async function callStartSession(
  examId: number
): Promise<ApiResponse<StartExamSessionResponse>> {
  try {
    const res = await fetch(`/api/exams/${examId}/start-session`, {
      method: 'POST',
      credentials: 'include'
    })
    const body = (await res.json()) as ApiResponse<StartExamSessionResponse>
    if (!res.ok) {
      return {
        code: body.code ?? String(res.status),
        message: body.message ?? 'Failed to start session',
        data: undefined as unknown as StartExamSessionResponse
      }
    }
    return body
  } catch {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error — could not reach server',
      data: undefined as unknown as StartExamSessionResponse
    }
  }
}

interface FullscreenGateProps {
  examId: number
  studentId?: number
  children: ReactNode
  onSessionStarted?: (session: StartExamSessionResponse) => void
}

export function FullscreenGate({
  examId,
  studentId,
  children,
  onSessionStarted
}: FullscreenGateProps) {
  const dispatch = useAppDispatch()
  const { isFullscreen } = useAppSelector((state) => state.antiCheat)
  const [isSupported, setIsSupported] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [pendingConflict, setPendingConflict] = useState<{
    conflictId: string
  } | null>(null)

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
      const result = await callStartSession(examId)

      if (result.data) {
        // Conflict pending — student must wait for teacher approval
        if (result.data.conflictPending && result.data.conflictId) {
          setPendingConflict({ conflictId: result.data.conflictId })
          setIsLoading(false)
          return
        }

        if (!result.data.sessionStarted) {
          setError(
            result.data.message ||
              'Không thể bắt đầu phiên thi. Có thể bạn đã đăng nhập ở thiết bị khác.'
          )
          // Exit fullscreen if session failed
          if (document.fullscreenElement) {
            await document.exitFullscreen()
          }
          dispatch(setFullscreen(false))
          setIsLoading(false)
          return
        }

        // 3. Pass session data to parent
        setIsVerified(true)
        onSessionStarted?.(result.data)
      } else {
        // API returned but no data
        console.error('[FullscreenGate] startExamSession returned no data')
        setError(
          'Không nhận được phản hồi hợp lệ từ máy chủ. Vui lòng thử lại.'
        )
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
        dispatch(setFullscreen(false))
      }
    } catch (err) {
      console.error('[FullscreenGate] startExamSession failed:', err)
      setError(
        'Lỗi kết nối máy chủ. Vui lòng kiểm tra đường truyền và thử lại.'
      )
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      dispatch(setFullscreen(false))
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, examId, onSessionStarted])

  // Auto-verify if already in fullscreen on mount
  useEffect(() => {
    if (isFullscreen && !isVerified && !isLoading && !pendingConflict) {
      handleEnterFullscreen()
    }
  }, [
    isFullscreen,
    isVerified,
    isLoading,
    pendingConflict,
    handleEnterFullscreen
  ])

  if (!isSupported || (isFullscreen && isVerified)) {
    return <>{children}</>
  }

  // Show waiting overlay if conflict is pending
  if (pendingConflict) {
    if (!studentId) {
      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <Loader2 className={styles.spinnerIcon} />
            <p>Đang tải thông tin sinh viên...</p>
          </div>
        </div>
      )
    }
    return (
      <WaitingApprovalOverlay
        examId={examId}
        studentId={studentId}
        conflictId={pendingConflict.conflictId}
        onApproved={async () => {
          setPendingConflict(null)
          setError(null)
          // Retry startSession — session is now force-overridden by teacher
          const result = await callStartSession(examId)
          if (result.data?.sessionStarted) {
            onSessionStarted?.(result.data)
          } else {
            setError('Không thể kết nối lại phiên thi. Vui lòng thử lại.')
          }
        }}
        onRejected={(reason: string) => {
          setPendingConflict(null)
          setError(reason)
          if (document.fullscreenElement) {
            document.exitFullscreen()
          }
          dispatch(setFullscreen(false))
        }}
      />
    )
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
