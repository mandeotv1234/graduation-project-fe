'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, FileCheck } from 'lucide-react'
import { Pagination } from '@/components/shared/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { getMyResults } from '@/lib/actions/student-exam.action'
import { PATH } from '@/lib/constants'
import { PaginatedResult, StudentExamResultResponse } from '@/lib/types'
import styles from '../exam-list/exam-list.module.scss'
import { DeniedReviewDialog } from './denied-review-dialog'
import { ResultGroupCard } from './result-group-card'
import { ResultGroup } from './result-list.types'

export function ResultList() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] =
    useState<PaginatedResult<StudentExamResultResponse> | null>(null)
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC')
  const [showDeniedDialog, setShowDeniedDialog] = useState(false)
  const fetchSize = 100
  const pageSize = 5

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        const response = await getMyResults({
          page: 0,
          size: fetchSize,
          sortBy: 'SUBMITTED_AT',
          sortOrder
        })
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

    fetchResults()
  }, [sortOrder])

  const groupedResults = useMemo<ResultGroup[]>(() => {
    const groups = new Map<
      number,
      {
        examId: number
        examTitle: string
        attempts: StudentExamResultResponse[]
      }
    >()

    for (const result of data?.data ?? []) {
      const group = groups.get(result.examId) ?? {
        examId: result.examId,
        examTitle: result.examTitle,
        attempts: []
      }
      group.attempts.push(result)
      groups.set(result.examId, group)
    }

    return Array.from(groups.values())
      .map((group) => {
        const attempts = [...group.attempts].sort(
          (a, b) => a.attemptNumber - b.attemptNumber
        )
        const latest = attempts.reduce((current, item) =>
          new Date(item.submittedAt).getTime() >
          new Date(current.submittedAt).getTime()
            ? item
            : current
        )
        return {
          ...group,
          attempts,
          latest
        }
      })
      .sort((a, b) => {
        const diff =
          new Date(a.latest.submittedAt).getTime() -
          new Date(b.latest.submittedAt).getTime()
        return sortOrder === 'DESC' ? -diff : diff
      })
  }, [data?.data, sortOrder])

  const handleViewLatest = (result: StudentExamResultResponse) => {
    if (!result.allowReview) {
      setShowDeniedDialog(true)
      return
    }
    router.push(PATH.STUDENT_EXAM_RESULT(result.id))
  }

  const totalPages = Math.max(1, Math.ceil(groupedResults.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedGroups = groupedResults.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Kết quả học tập
          </h1>
          <p className="text-muted-foreground">
            Kênh xem kết quả các bài thi đã thực hiện.
          </p>
        </div>
        <Select
          value={sortOrder}
          onValueChange={(value) => {
            setSortOrder(value as 'DESC' | 'ASC')
            setPage(1)
          }}
        >
          <SelectTrigger size="sm" className="w-[132px]">
            <ArrowUpDown className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="DESC">Mới nhất</SelectItem>
            <SelectItem value="ASC">Cũ nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && !data ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 w-full animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrap}>
            <FileCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className={styles.emptyTitle}>Chưa có kết quả nào</h3>
          <p className={styles.emptyDescription}>
            Bạn chưa hoàn thành bài thi nào hoặc kết quả chưa được cập nhật.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {paginatedGroups.map((group) => (
              <ResultGroupCard
                key={group.examId}
                group={group}
                onViewProgress={() =>
                  router.push(PATH.STUDENT_EXAM_RESULT_PROGRESS(group.examId))
                }
                onViewLatest={() => handleViewLatest(group.latest)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              totalItems={groupedResults.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <DeniedReviewDialog
        open={showDeniedDialog}
        onOpenChange={setShowDeniedDialog}
      />
    </div>
  )
}
