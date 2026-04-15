'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileCheck,
  CalendarDays,
  Award,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { getMyResults } from '@/lib/actions/student-exam.action'
import { StudentExamResultResponse, PaginatedResult } from '@/lib/types'
import { PATH } from '@/lib/constants'
import styles from '../exam-list/exam-list.module.scss'

export function ResultList() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] =
    useState<PaginatedResult<StudentExamResultResponse> | null>(null)
  const [page, setPage] = useState(0)
  const [showDeniedDialog, setShowDeniedDialog] = useState(false)

  const fetchResults = async (pageNumber: number) => {
    setLoading(true)
    try {
      const response = await getMyResults({ page: pageNumber, size: 10 })
      if (response.code === 'OK' && response.data) {
        setData(response.data)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch results:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults(page)
  }, [page])

  const handleViewDetail = (result: StudentExamResultResponse) => {
    if (!result.allowReview) {
      setShowDeniedDialog(true)
      return
    }
    router.push(PATH.STUDENT_EXAM_RESULT(result.id))
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 w-full animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIconWrap}>
          <FileCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className={styles.emptyTitle}>Chưa có kết quả nào</h3>
        <p className={styles.emptyDescription}>
          Bạn chưa hoàn thành bài thi nào hoặc kết quả chưa được cập nhật.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className={styles.list}>
        {data.data.map((result) => (
          <div
            key={result.id}
            onClick={() => handleViewDetail(result)}
            className={cn(styles.card, 'group cursor-pointer')}
          >
            <div className={cn(styles.cardAccent, 'group-hover:opacity-100')} />
            <div className={styles.cardContent}>
              <div className={styles.cardMain}>
                <div className={styles.titleRow}>
                  <div className={styles.iconBox}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div className={styles.titleBlock}>
                    <h3
                      className={cn(
                        styles.title,
                        'group-hover:text-primary transition-colors'
                      )}
                    >
                      {result.examTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {result.totalScore} / {result.maxScore} điểm
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-xs text-muted-foreground">
                        Lần thi thứ {result.attemptNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <CalendarDays className="h-4 w-4" />
                    <span>Nộp bài: {formatDateTime(result.submittedAt)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        result.status === 'COMPLETED'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      )}
                    />
                    <span>
                      {result.status === 'COMPLETED'
                        ? 'Đã chấm điểm'
                        : 'Đang xử lý'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.actionWrap}>
                <Button
                  variant="ghost"
                  className={cn(styles.enterButton, 'group-hover:text-primary')}
                >
                  Xem chi tiết
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Sau
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <AlertDialog open={showDeniedDialog} onOpenChange={setShowDeniedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Không thể xem lại bài làm
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bài làm này không được phép xem lại do giáo viên đã tắt tính năng
              xem chi tiết kết quả cho bài thi này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDeniedDialog(false)}>
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
