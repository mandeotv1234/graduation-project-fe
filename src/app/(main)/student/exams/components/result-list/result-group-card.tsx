import { BarChart3, CalendarDays, FileText, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'
import styles from '../exam-list/exam-list.module.scss'
import { ResultGroup } from './result-list.types'
import { formatScore } from './result-list.utils'

export function ResultGroupCard({
  group,
  onViewProgress,
  onViewLatest
}: {
  group: ResultGroup
  onViewProgress: () => void
  onViewLatest: () => void
}) {
  return (
    <div
      onClick={onViewProgress}
      className={cn(styles.card, 'group cursor-pointer shadow-none!')}
    >
      <div className={cn(styles.cardAccent, 'group-hover:opacity-100')} />
      <div className={styles.cardContent}>
        <div className={styles.cardMain}>
          <div className={styles.titleRow}>
            <div className={styles.titleBlock}>
              <h3
                className={cn(
                  styles.title,
                  'group-hover:text-primary transition-colors'
                )}
              >
                {group.examTitle}
              </h3>
              <div className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Điểm gần nhất: {formatScore(group.latest.totalScore)} điểm
              </div>
            </div>
          </div>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <CalendarDays className="h-4 w-4" />
              <span>
                Nộp gần nhất: {formatDateTime(group.latest.submittedAt)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <Send className="h-4 w-4" />
              <span>{group.attempts.length} lần nộp</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            styles.actionWrap,
            'flex flex-wrap items-center justify-start gap-2 sm:justify-end'
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation()
              onViewLatest()
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            Lần nộp gần nhất
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className={cn(
              styles.enterButton,
              'h-8 gap-1.5 px-3 text-xs font-semibold shadow-none'
            )}
            onClick={(event) => {
              event.stopPropagation()
              onViewProgress()
            }}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Tổng quan
          </Button>
        </div>
      </div>
    </div>
  )
}
