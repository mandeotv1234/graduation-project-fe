'use client'

import Link from 'next/link'
import { Clock, CalendarDays, ArrowRight, FileText, Timer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { StudentExamListItem } from '@/lib/types'
import { formatDateTime, getExamStatus } from '@/lib/utils'

interface ExamListProps {
  exams: StudentExamListItem[]
}

function ExamStatusBadge({ status }: { status: string }) {
  const config = {
    upcoming: {
      label: 'Sắp diễn ra',
      className:
        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    },
    in_progress: {
      label: 'Đang diễn ra',
      className:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    ended: {
      label: 'Đã kết thúc',
      className:
        'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20'
    }
  }

  const { label, className } =
    config[status as keyof typeof config] || config.ended

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

function ExamCard({ exam }: { exam: StudentExamListItem }) {
  const status = getExamStatus(exam.startTime, exam.endTime)
  const isAccessible = status === 'in_progress'
  return (
    <Link href={PATH.STUDENT_EXAM_TAKE(exam.examId)} className="block">
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
        {/* Gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {exam.title}
                </h3>
                <ExamStatusBadge status={status} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <span>Bắt đầu: {formatDateTime(exam.startTime)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Kết thúc: {formatDateTime(exam.endTime)}</span>
              </div>
              {exam.durationMinutes && (
                <div className="flex items-center gap-1.5">
                  <Timer className="h-4 w-4" />
                  <span>{exam.durationMinutes} phút</span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {isAccessible ? (
              <Button className="gap-2">
                Vào thi
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" disabled>
                {status === 'upcoming' ? 'Chưa mở' : 'Đã kết thúc'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export function ExamList({ exams }: ExamListProps) {
  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Chưa có bài thi nào
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn chưa được đăng ký vào lớp nào có bài thi.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => (
        <ExamCard key={exam.examId} exam={exam} />
      ))}
    </div>
  )
}
