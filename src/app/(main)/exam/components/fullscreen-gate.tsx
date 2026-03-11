'use client'

import { Loader2, Maximize, Shield, ShieldCheck } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { startExamSession } from '@/lib/actions/anti-cheat.action'
import { setFullscreen } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import type { StartExamSessionResponse } from '@/lib/types'

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-800/50 p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-500/10">
            <Shield className="size-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Chế độ thi an toàn</h2>
          <p className="mt-2 text-sm text-slate-400">
            Để đảm bảo tính công bằng, bạn cần bật chế độ toàn màn hình trước
            khi bắt đầu làm bài.
          </p>
        </div>

        {/* Rules */}
        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-slate-700/50 p-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-medium text-white">
                Hệ thống giám sát
              </p>
              <p className="text-xs text-slate-400">
                Hệ thống sẽ giám sát các hành vi: chuyển tab, copy/paste, mở
                DevTools và phím tắt bị cấm.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-slate-700/50 p-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-medium text-white">Ghi nhận vi phạm</p>
              <p className="text-xs text-slate-400">
                Mọi vi phạm sẽ được ghi lại và gửi cho giám thị. Sau 10 lần vi
                phạm, bài thi sẽ bị nộp tự động.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-slate-700/50 p-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-medium text-white">
                Watermark bảo mật
              </p>
              <p className="text-xs text-slate-400">
                Mã sinh viên của bạn sẽ được hiển thị chìm trên giao diện để
                chống chụp ảnh rò rỉ đề thi.
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={handleEnterFullscreen}
          disabled={isLoading}
          size="lg"
          className="mt-6 w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Đang khởi tạo phiên thi...
            </>
          ) : (
            <>
              <Maximize className="mr-2 size-5" />
              Bật toàn màn hình & Bắt đầu
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
