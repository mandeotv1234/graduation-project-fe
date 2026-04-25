'use client'

import { memo, useEffect, useState } from 'react'
import styles from '@/app/(main)/exam/components/exam-watermark/exam-watermark.module.scss'
import { formatDateTime } from '@/lib/utils/time'

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
    const update = () => setTime(formatDateTime(new Date()))
    update()
    const interval = setInterval(update, 60_000) // Update mỗi phút
    return () => clearInterval(interval)
  }, [])

  const watermarkText = `${studentId} – ${studentName}`

  return (
    <div className={styles.watermarkContainer} aria-hidden="true">
      <div className={styles.watermarkGrid}>
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className={styles.watermarkText}>
            {watermarkText} | {time}
          </span>
        ))}
      </div>
    </div>
  )
})
