'use client'

import { AlertTriangle, Maximize } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { setBlurred, setFullscreen } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'

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
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-xl">
      <div className="mx-4 max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="size-10 text-red-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Phát hiện rời khỏi bài thi!
          </h2>
          <p className="text-gray-300">
            Hệ thống đã ghi nhận hành vi rời khỏi trang thi. Hành vi này đã được
            ghi lại và thông báo cho giám thị.
          </p>
        </div>
        <Button
          onClick={handleReturnToExam}
          size="lg"
          className="bg-white text-black hover:bg-gray-200"
        >
          <Maximize className="mr-2 size-5" />
          Quay lại bài thi
        </Button>
      </div>
    </div>
  )
}
