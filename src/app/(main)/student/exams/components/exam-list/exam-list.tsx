'use client'

import Link from 'next/link'
import { Clock, CalendarDays, ArrowRight, FileText, Timer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { StudentExamListItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDateTime, getExamStatus } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/components/exam-list/exam-list.module.scss'

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
    <span className={cn(styles.statusBadge, className)}>
      <span className={styles.statusDot} />
      {label}
    </span>
  )
}

function ExamCard({ exam }: { exam: StudentExamListItem }) {
  const status = getExamStatus(exam.startTime, exam.endTime)
  const isAccessible = status === 'in_progress'
  return (
    <Link href={PATH.STUDENT_EXAM_TAKE(exam.examId)} className={styles.link}>
      <div className={cn(styles.card, 'group')}>
        {/* Gradient accent */}
        <div className={cn(styles.cardAccent, 'group-hover:opacity-100')} />

        <div className={styles.cardContent}>
          <div className={styles.cardMain}>
            <div className={styles.titleRow}>
              <div className={styles.iconBox}>
                <FileText className="h-5 w-5" />
              </div>
              <div className={styles.titleBlock}>
                <h3
                  className={cn(
                    styles.title,
                    'group-hover:text-primary transition-colors'
                  )}
                >
                  {exam.title}
                </h3>
                <ExamStatusBadge status={status} />
              </div>
            </div>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <CalendarDays className="h-4 w-4" />
                <span>Bắt đầu: {formatDateTime(exam.startTime)}</span>
              </div>
              <div className={styles.metaItem}>
                <Clock className="h-4 w-4" />
                <span>Kết thúc: {formatDateTime(exam.endTime)}</span>
              </div>
              {exam.durationMinutes && (
                <div className={styles.metaItem}>
                  <Timer className="h-4 w-4" />
                  <span>{exam.durationMinutes} phút</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actionWrap}>
            {isAccessible ? (
              <Button className={styles.enterButton}>
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
      <div className={styles.emptyState}>
        <div className={styles.emptyIconWrap}>
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className={styles.emptyTitle}>Chưa có bài thi nào</h3>
        <p className={styles.emptyDescription}>
          Bạn chưa được đăng ký vào lớp nào có bài thi.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {exams.map((exam) => (
        <ExamCard key={exam.examId} exam={exam} />
      ))}
    </div>
  )
}
