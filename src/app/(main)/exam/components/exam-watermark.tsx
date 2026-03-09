'use client'

import { memo, useEffect, useState } from 'react'

interface ExamWatermarkProps {
  studentId: string
  studentName: string
}

export const ExamWatermark = memo(function ExamWatermark({
  studentId,
  studentName
}: ExamWatermarkProps) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleString('vi-VN'))
    update()
    const interval = setInterval(update, 60_000) // Update mỗi phút
    return () => clearInterval(interval)
  }, [])

  const watermarkText = `${studentId} – ${studentName}`

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none"
      aria-hidden="true"
    >
      <div className="absolute inset-[-50%] flex flex-wrap gap-24 -rotate-[25deg] scale-110">
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            className="text-foreground/[0.03] whitespace-nowrap text-base font-semibold tracking-wider"
          >
            {watermarkText} | {time}
          </span>
        ))}
      </div>
    </div>
  )
})
