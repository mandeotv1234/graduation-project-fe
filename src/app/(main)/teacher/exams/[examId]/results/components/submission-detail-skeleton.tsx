import { Skeleton } from '@/components/ui/skeleton'

import styles from './submission-detail-view.module.scss'

const OVERVIEW_ITEMS = Array.from({ length: 4 }, (_, index) => index)
const QUESTION_ITEMS = Array.from({ length: 3 }, (_, index) => index)

export function SubmissionDetailSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-label="Đang tải chi tiết bài làm"
    >
      <div className={styles.header}>
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-64 max-w-[60vw]" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>

      <div className={styles.attemptNav}>
        <Skeleton className="h-4 w-24 shrink-0" />
        <div className="flex min-w-0 gap-2 overflow-hidden">
          {QUESTION_ITEMS.map((item) => (
            <Skeleton key={item} className="h-12 w-16 shrink-0 rounded-md" />
          ))}
        </div>
      </div>

      <div className={styles.overviewCard}>
        {OVERVIEW_ITEMS.map((item) => (
          <div key={item} className={styles.statItem}>
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-36 max-w-full" />
          </div>
        ))}
      </div>

      <div className={styles.sectionHeading}>
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>

      <div className={styles.questionList}>
        {QUESTION_ITEMS.map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 max-w-[55vw]" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-40 w-full rounded-md" />
                <Skeleton className="h-40 w-full rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
