'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Database } from 'lucide-react'

export default function ExamHeader() {
  const [timeLeft, setTimeLeft] = useState(1 * 60 * 60 + 29 * 60 + 59) // 01:29:59

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return { h, m, s }
  }

  const time = formatTime(timeLeft)

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0">
      <div className="flex items-center gap-2">
        <Database className="w-6 h-6 text-blue-500" />
        <span className="font-bold text-lg">SQL Learning Platform</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm font-mono bg-slate-800 px-4 py-1 rounded-md border border-slate-700">
          <div className="flex flex-col items-center min-w-8">
            <span className="text-xl font-bold leading-none">
              {String(time.h).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 uppercase mt-1">
              Giờ
            </span>
          </div>
          <span className="text-xl font-bold pb-3 text-slate-600">:</span>
          <div className="flex flex-col items-center min-w-8">
            <span className="text-xl font-bold leading-none">
              {String(time.m).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 uppercase mt-1">
              Phút
            </span>
          </div>
          <span className="text-xl font-bold pb-3 text-slate-600">:</span>
          <div className="flex flex-col items-center min-w-8">
            <span className="text-xl font-bold leading-none">
              {String(time.s).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 uppercase mt-1">
              Giây
            </span>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-medium">
          Nộp bài
        </Button>
      </div>
    </header>
  )
}
