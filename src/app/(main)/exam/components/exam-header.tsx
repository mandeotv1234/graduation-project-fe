'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Database } from 'lucide-react'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { formatTime } from '@/lib/utils'

export default function ExamHeader() {
  const [timeLeft, setTimeLeft] = useState(1 * 60 * 60 + 29 * 60 + 59) // 01:29:59

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const time = formatTime(timeLeft)

  return (
    <header className="min-h-16 border-b border-border flex flex-wrap items-center justify-between px-3 sm:px-6 py-2 sm:py-0 bg-card shrink-0 gap-2 sm:gap-0">
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        <span className="font-bold text-base sm:text-lg">
          SQL Learning Platform
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-6">
        {/* Timer - compact version on mobile, full on desktop */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-mono bg-secondary px-2 sm:px-4 py-1 rounded-md border border-input">
          <div className="flex flex-col items-center min-w-6 sm:min-w-8">
            <span className="text-base sm:text-xl font-bold leading-none">
              {String(time.h).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground uppercase mt-0.5 sm:mt-1 hidden sm:inline">
              Giờ
            </span>
          </div>
          <span className="text-base sm:text-xl font-bold pb-0 sm:pb-3 text-muted-foreground">
            :
          </span>
          <div className="flex flex-col items-center min-w-6 sm:min-w-8">
            <span className="text-base sm:text-xl font-bold leading-none">
              {String(time.m).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground uppercase mt-0.5 sm:mt-1 hidden sm:inline">
              Phút
            </span>
          </div>
          <span className="text-base sm:text-xl font-bold pb-0 sm:pb-3 text-muted-foreground">
            :
          </span>
          <div className="flex flex-col items-center min-w-6 sm:min-w-8">
            <span className="text-base sm:text-xl font-bold leading-none">
              {String(time.s).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground uppercase mt-0.5 sm:mt-1 hidden sm:inline">
              Giây
            </span>
          </div>
        </div>
        <ModeToggle />
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-6 font-medium text-sm">
          Nộp bài
        </Button>
      </div>
    </header>
  )
}
