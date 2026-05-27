'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as Tabs from '@radix-ui/react-tabs'
import {
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Hash,
  Search,
  Download,
  Filter,
  Users,
  RefreshCw,
  BarChart2,
  Loader2,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import styles from './exam-results-view.module.scss'

import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/shared/pagination'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import type {
  TeacherExamResult,
  GradingNotificationDto,
  ExamStatistics,
  PaginationMeta
} from '@/lib/types'
import { subscribeToTeacherGradingResult } from '@/lib/socket'
import { regradeAllExamResults } from '@/lib/actions'
import { getExamResults } from '@/lib/actions/teacher.action'
import { formatDateTime } from '@/lib/utils/time'
import { ExamStatisticsDashboard } from './exam-statistics-dashboard/exam-statistics-dashboard'

interface ExamResultsViewProps {
  examId: number
  examTitle: string
  initialResults: TeacherExamResult[]
  initialPagination?: PaginationMeta
  initialStats: ExamStatistics | null
}

function isScoredStatus(status: TeacherExamResult['status']) {
  return status === 'COMPLETED' || status === 'FAILED'
}

function getResultStatusLabel(status: TeacherExamResult['status']) {
  switch (status) {
    case 'COMPLETED':
      return 'Hoàn tất'
    case 'FAILED':
      return 'Thất bại'
    case 'SYSTEM_ERROR':
      return 'Lỗi hệ thống'
    case 'GRADING':
      return 'Đang chấm'
    default:
      return 'Chờ chấm'
  }
}

export function ExamResultsView({
  examId,
  examTitle,
  initialResults,
  initialPagination,
  initialStats
}: ExamResultsViewProps) {
  const router = useRouter()
  const [results, setResults] = useState<TeacherExamResult[]>(initialResults)
  const [pagination, setPagination] = useState<PaginationMeta | undefined>(
    initialPagination
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [scoreFilter, setScoreFilter] = useState<
    'all' | 'gte5' | 'gte8' | 'gte9'
  >('all')
  const [encounterMode, setEncounterMode] = useState<
    'all' | 'latest' | 'highest'
  >('all')
  const [sortOrder, setSortOrder] = useState<
    'timeDesc' | 'timeAsc' | 'scoreDesc' | 'scoreAsc'
  >('timeDesc')
  const [isRegradingAll, setIsRegradingAll] = useState(false)
  const [selectedSubmissions, setSelectedSubmissions] = useState<
    Record<number, number>
  >({})
  const [activeTab, setActiveTab] = useState('results')
  // Tracks remaining re-grade jobs so socket handler can suppress toasts & block new-entry adds
  const regradingRemainingRef = useRef(0)
  const didMountRef = useRef(false)

  async function handleRegradeAll() {
    setIsRegradingAll(true)

    // Prevent Race Condition: Reflect BE state immediately BEFORE API call
    setResults((prev) =>
      prev.map((r) =>
        r.status === 'COMPLETED' || r.status === 'FAILED'
          ? { ...r, status: 'PENDING' as const }
          : r
      )
    )

    try {
      const res = await regradeAllExamResults(examId)
      if (res.data) {
        const { queuedCount, skippedCount } = res.data
        regradingRemainingRef.current = queuedCount
        toast.loading(
          `Đang chấm lại ${queuedCount} bài...` +
            (skippedCount > 0 ? ` (bỏ qua ${skippedCount} bài)` : ''),
          { id: 'regrade-progress' }
        )
      } else {
        toast.error(res.message ?? 'Không thể chấm lại toàn bộ')
        router.refresh()
      }
    } catch {
      toast.error('Lỗi kết nối khi chấm lại toàn bộ')
      router.refresh()
    } finally {
      setIsRegradingAll(false)
    }
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    let cancelled = false

    const fetchResults = async () => {
      const response = await getExamResults(examId, {
        page: currentPage,
        size: pageSize,
        keyword: searchTerm,
        scoreFilter,
        encounterMode,
        sortOrder
      })

      if (cancelled) return

      setResults(response.data ?? [])
      setPagination(response.meta?.pagination)
    }

    void fetchResults()

    return () => {
      cancelled = true
    }
  }, [
    currentPage,
    encounterMode,
    examId,
    refreshKey,
    scoreFilter,
    searchTerm,
    sortOrder
  ])

  useEffect(() => {
    // Socket connection for real-time updates
    const unsubscribe = subscribeToTeacherGradingResult(
      examId,
      (rawNotification: unknown) => {
        const notification = rawNotification as GradingNotificationDto
        const isBulkRegrade = regradingRemainingRef.current > 0

        setRefreshKey((key) => key + 1)

        if (isBulkRegrade) {
          regradingRemainingRef.current -= 1
          if (regradingRemainingRef.current <= 0) {
            toast.success('Đã chấm lại xong tất cả bài', {
              id: 'regrade-progress'
            })
          }
        } else {
          const score = notification.totalScore ?? notification.score ?? 0
          const name = notification.studentName || 'Học sinh'
          toast.success(`${name} vừa nộp bài — ${score} điểm`)
        }
      }
    )

    return () => {
      unsubscribe?.()
    }
  }, [examId])

  let baseResults = [...results]

  if (encounterMode !== 'all') {
    const studentBest = new Map<number, TeacherExamResult>()
    for (const r of baseResults) {
      const existing = studentBest.get(r.studentId)
      if (!existing) {
        studentBest.set(r.studentId, r)
      } else {
        if (encounterMode === 'latest') {
          if (r.attemptNumber > existing.attemptNumber) {
            studentBest.set(r.studentId, r)
          }
        } else if (encounterMode === 'highest') {
          if (r.totalScore > existing.totalScore) {
            studentBest.set(r.studentId, r)
          } else if (
            r.totalScore === existing.totalScore &&
            r.attemptNumber > existing.attemptNumber
          ) {
            studentBest.set(r.studentId, r)
          }
        }
      }
    }
    baseResults = Array.from(studentBest.values())
  }

  if (scoreFilter !== 'all') {
    baseResults = baseResults.filter((r) => {
      if (!isScoredStatus(r.status)) return false
      if (scoreFilter === 'gte5') return r.totalScore >= 5
      if (scoreFilter === 'gte8') return r.totalScore >= 8
      if (scoreFilter === 'gte9') return r.totalScore >= 9
      return true
    })
  }

  if (searchTerm) {
    const lowerTerm = searchTerm.toLowerCase()
    baseResults = baseResults.filter(
      (r) =>
        r.studentName.toLowerCase().includes(lowerTerm) ||
        r.studentEmail.toLowerCase().includes(lowerTerm)
    )
  }

  interface StudentGroup {
    studentId: number
    studentName: string
    studentEmail: string
    attempts: TeacherExamResult[]
    activeSubmissionId: number
  }

  const groupsMap = new Map<number, StudentGroup>()
  for (const r of baseResults) {
    let group = groupsMap.get(r.studentId)
    if (!group) {
      group = {
        studentId: r.studentId,
        studentName: r.studentName,
        studentEmail: r.studentEmail,
        attempts: [],
        activeSubmissionId: r.submissionId
      }
      groupsMap.set(r.studentId, group)
    }
    group.attempts.push(r)
  }

  const studentGroups = Array.from(groupsMap.values()).map((group) => {
    group.attempts.sort((a, b) => b.attemptNumber - a.attemptNumber)
    const explicitId = selectedSubmissions[group.studentId]
    if (
      explicitId &&
      group.attempts.some((a) => a.submissionId === explicitId)
    ) {
      group.activeSubmissionId = explicitId
    } else {
      group.activeSubmissionId = group.attempts[0].submissionId
    }
    return group
  })

  studentGroups.sort((gA, gB) => {
    const activeA = gA.attempts.find(
      (a) => a.submissionId === gA.activeSubmissionId
    )!
    const activeB = gB.attempts.find(
      (a) => a.submissionId === gB.activeSubmissionId
    )!

    switch (sortOrder) {
      case 'timeDesc':
        return (
          new Date(activeB.submittedAt).getTime() -
          new Date(activeA.submittedAt).getTime()
        )
      case 'timeAsc':
        return (
          new Date(activeA.submittedAt).getTime() -
          new Date(activeB.submittedAt).getTime()
        )
      case 'scoreDesc':
        return activeB.totalScore === activeA.totalScore
          ? new Date(activeB.submittedAt).getTime() -
              new Date(activeA.submittedAt).getTime()
          : activeB.totalScore - activeA.totalScore
      case 'scoreAsc':
        return activeA.totalScore === activeB.totalScore
          ? new Date(activeB.submittedAt).getTime() -
              new Date(activeA.submittedAt).getTime()
          : activeA.totalScore - activeB.totalScore
      default:
        return 0
    }
  })

  const filteredResults = studentGroups
  const totalItems = pagination?.total ?? filteredResults.length
  const effectivePageSize = pagination?.size ?? pageSize
  const totalPages = Math.ceil(totalItems / effectivePageSize)

  useEffect(() => {
    setCurrentPage((page) =>
      Math.min(Math.max(1, page), Math.max(1, totalPages))
    )
  }, [totalPages])

  const paginatedResults = filteredResults

  const uniqueStudentsCount = new Set(results.map((r) => r.studentId)).size
  const gradedResults = results.filter((r) => isScoredStatus(r.status))
  const stats = {
    totalCount: initialStats?.totalSubmissions ?? uniqueStudentsCount,
    passed: initialStats
      ? Math.round(
          (initialStats.totalSubmissions * initialStats.passRate) / 100
        )
      : gradedResults.filter((r) => r.totalScore >= 5).length,
    average: initialStats
      ? initialStats.averageScore.toFixed(1)
      : gradedResults.length > 0
        ? (
            gradedResults.reduce((sum, r) => sum + r.totalScore, 0) /
            gradedResults.length
          ).toFixed(1)
        : 0
  }

  const handleRowClick = (submissionId: number) => {
    router.push(`/teacher/exams/${examId}/results/${submissionId}`)
  }

  const handleExportCSV = async () => {
    const headers = [
      'Học sinh',
      'Email',
      'Thời gian nộp',
      'Lần thi',
      'Trạng thái',
      'Điểm',
      'Điểm tối đa'
    ]

    const exportResponse = await getExamResults(examId, {
      page: 1,
      size: 100000,
      keyword: '',
      scoreFilter: 'all',
      encounterMode: 'all',
      sortOrder: 'timeDesc'
    })
    const exportResults = exportResponse.data ?? []

    const rows = exportResults.map((r) => [
      `"${r.studentName}"`,
      `"${r.studentEmail}"`,
      `"${formatDateTime(r.submittedAt)}"`,
      r.attemptNumber,
      `"${getResultStatusLabel(r.status)}"`,
      r.totalScore,
      r.maxScore
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ket_qua_bai_thi_${examId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={styles.resultsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div>
            <h1>Kết quả bài thi</h1>
            <p>{examTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={isRegradingAll || results.length === 0}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRegradingAll ? 'animate-spin' : ''}`}
                />
                {isRegradingAll ? 'Đang chấm lại...' : 'Chấm lại toàn bộ'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Chấm lại toàn bộ bài thi</AlertDialogTitle>
                <AlertDialogDescription>
                  Tất cả bài đã hoàn tất sẽ được chấm lại từ đầu. Điểm cũ và các
                  chỉnh sửa thủ công sẽ bị ghi đè. Hành động này không thể hoàn
                  tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegradeAll}>
                  Chấm lại toàn bộ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Xuất file CSV
          </Button>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        <Tabs.List
          style={{
            display: 'flex',
            gap: '0.25rem',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '0'
          }}
        >
          <Tabs.Trigger
            value="results"
            id="tab-results"
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '0.5rem 0.5rem 0 0',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background:
                activeTab === 'results'
                  ? 'var(--color-background)'
                  : 'transparent',
              color:
                activeTab === 'results'
                  ? 'var(--color-foreground)'
                  : 'var(--color-muted-foreground)',
              borderBottom:
                activeTab === 'results'
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <Users style={{ width: '0.85rem', height: '0.85rem' }} />
            Danh sách kết quả
          </Tabs.Trigger>

          <Tabs.Trigger
            value="statistics"
            id="tab-statistics"
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '0.5rem 0.5rem 0 0',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background:
                activeTab === 'statistics'
                  ? 'var(--color-background)'
                  : 'transparent',
              color:
                activeTab === 'statistics'
                  ? 'var(--color-foreground)'
                  : 'var(--color-muted-foreground)',
              borderBottom:
                activeTab === 'statistics'
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart2 style={{ width: '0.85rem', height: '0.85rem' }} />
            Thống kê
            {initialStats && initialStats.suspiciousCount > 0 && (
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '999px',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  fontWeight: 700
                }}
              >
                {initialStats.suspiciousCount}
              </span>
            )}
          </Tabs.Trigger>
        </Tabs.List>

        {/* ===== Tab: Danh sách kết quả ===== */}
        <Tabs.Content value="results">
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.iconWrapper} ${styles.blue}`}>
                <Users />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.label}>Số học sinh đã nộp</p>
                <h2 className={styles.value}>{stats.totalCount}</h2>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.iconWrapper} ${styles.green}`}>
                <CheckCircle2 />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.label}>Đã đạt (&gt;= 5đ)</p>
                <h2 className={styles.value}>{stats.passed}</h2>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.iconWrapper} ${styles.orange}`}>
                <Hash />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.label}>Điểm trung bình</p>
                <h2 className={styles.value}>{stats.average}</h2>
              </div>
            </div>
          </div>

          {/* Filter and Table */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <div className={styles.searchWrapper}>
                <Search />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border bg-background text-sm shadow-sm transition-colors hover:bg-muted/50 focus-within:ring-1 focus-within:ring-ring">
                  <Filter className="h-4 w-4 text-muted-foreground drop-shadow-sm" />
                  <select
                    value={encounterMode}
                    onChange={(e) => {
                      setEncounterMode(
                        e.target.value as 'all' | 'latest' | 'highest'
                      )
                      setCurrentPage(1)
                    }}
                    className="h-6 bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer outline-none"
                  >
                    <option value="all">Tất cả lượt thi</option>
                    <option value="latest">Chỉ lần nộp cuối</option>
                    <option value="highest">Chỉ điểm cao nhất</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border bg-background text-sm shadow-sm transition-colors hover:bg-muted/50 focus-within:ring-1 focus-within:ring-ring">
                  <Hash className="h-4 w-4 text-muted-foreground drop-shadow-sm" />
                  <select
                    value={scoreFilter}
                    onChange={(e) => {
                      setScoreFilter(
                        e.target.value as 'all' | 'gte5' | 'gte8' | 'gte9'
                      )
                      setCurrentPage(1)
                    }}
                    className="h-6 bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer outline-none"
                  >
                    <option value="all">Tất cả bài</option>
                    <option value="gte5">{'>'}= 5 điểm</option>
                    <option value="gte8">{'>'}= 8 điểm</option>
                    <option value="gte9">{'>'}= 9 điểm</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border bg-background text-sm shadow-sm transition-colors hover:bg-muted/50 focus-within:ring-1 focus-within:ring-ring">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground drop-shadow-sm" />
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(
                        e.target.value as
                          | 'timeDesc'
                          | 'timeAsc'
                          | 'scoreDesc'
                          | 'scoreAsc'
                      )
                      setCurrentPage(1)
                    }}
                    className="h-6 bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer outline-none"
                  >
                    <option value="timeDesc">Mới nhất</option>
                    <option value="timeAsc">Cũ nhất</option>
                    <option value="scoreDesc">Điểm cao</option>
                    <option value="scoreAsc">Điểm thấp</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>Học sinh</th>
                    <th>Thời gian nộp</th>
                    <th>Lần thi</th>
                    <th>Trạng thái</th>
                    <th className="text-center">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-muted-foreground"
                      >
                        Chưa có lượt nộp bài nào.
                      </td>
                    </tr>
                  ) : (
                    paginatedResults.map((group: StudentGroup) => {
                      const activeResult = group.attempts.find(
                        (a: TeacherExamResult) =>
                          a.submissionId === group.activeSubmissionId
                      )!

                      return (
                        <tr
                          key={group.studentId}
                          onClick={() =>
                            handleRowClick(activeResult.submissionId)
                          }
                        >
                          <td>
                            <div className={styles.studentCell}>
                              <div className={styles.avatar}>
                                {group.studentName.charAt(0).toUpperCase()}
                              </div>
                              <div className={styles.info}>
                                <span className={styles.name}>
                                  {group.studentName}
                                </span>
                                <span className={styles.email}>
                                  <Mail className="h-3 w-3" />
                                  {group.studentEmail}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateTime(activeResult.submittedAt)}
                            </span>
                          </td>
                          <td
                            className="text-center"
                            onClick={(e) => {
                              if (group.attempts.length > 1) {
                                e.stopPropagation()
                              }
                            }}
                          >
                            {group.attempts.length > 1 ? (
                              <div className="relative inline-block min-w-[70px]">
                                <select
                                  value={activeResult.submissionId}
                                  onChange={(e) =>
                                    setSelectedSubmissions((prev) => ({
                                      ...prev,
                                      [group.studentId]: Number(e.target.value)
                                    }))
                                  }
                                  className="absolute opacity-0 w-full h-full left-0 top-0 cursor-pointer"
                                >
                                  {group.attempts.map(
                                    (a: TeacherExamResult) => (
                                      <option
                                        key={a.submissionId}
                                        value={a.submissionId}
                                      >
                                        Lần {a.attemptNumber}{' '}
                                        {!isScoredStatus(a.status)
                                          ? `(${getResultStatusLabel(a.status)})`
                                          : `(${a.totalScore}đ)`}
                                      </option>
                                    )
                                  )}
                                </select>
                                <div className="flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 cursor-pointer shadow-sm mx-auto w-fit">
                                  <span className="text-xs font-bold leading-none py-1">
                                    Lần {activeResult.attemptNumber}
                                  </span>
                                  <ChevronDown className="h-3 w-3" />
                                </div>
                              </div>
                            ) : (
                              <span className={styles.attemptBadge}>
                                Lần {activeResult.attemptNumber}
                              </span>
                            )}
                          </td>
                          <td>
                            {activeResult.status === 'COMPLETED' ? (
                              <span
                                className={`${styles.statusBadge} ${styles.completed}`}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Hoàn tất
                              </span>
                            ) : activeResult.status === 'FAILED' ? (
                              <span
                                className={`${styles.statusBadge} ${styles.failed}`}
                              >
                                <AlertCircle className="h-3 w-3" />
                                Thất bại
                              </span>
                            ) : activeResult.status === 'SYSTEM_ERROR' ? (
                              <span
                                className={`${styles.statusBadge} ${styles.failed}`}
                              >
                                <AlertCircle className="h-3 w-3" />
                                Lỗi hệ thống
                              </span>
                            ) : (
                              <span
                                className={`${styles.statusBadge} ${styles.pending}`}
                              >
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {getResultStatusLabel(activeResult.status)}
                              </span>
                            )}
                          </td>
                          <td className="text-right pr-6">
                            {!isScoredStatus(activeResult.status) ? (
                              <span className="text-xs text-muted-foreground italic">
                                {getResultStatusLabel(activeResult.status)}...
                              </span>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span
                                  className={`${styles.scoreText} ${activeResult.totalScore >= 5 ? styles.passed : styles.failed}`}
                                >
                                  {activeResult.totalScore.toFixed(1)}/
                                  {activeResult.maxScore}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                  {activeResult.totalScore >= 5
                                    ? 'Đạt'
                                    : 'Chưa đạt'}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <Pagination
                className={styles.pagination}
                page={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={effectivePageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </Tabs.Content>

        {/* ===== Tab: Thống kê ===== */}
        <Tabs.Content value="statistics">
          {initialStats ? (
            <ExamStatisticsDashboard stats={initialStats} />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                color: 'var(--color-muted-foreground)',
                fontSize: '0.85rem'
              }}
            >
              <BarChart2
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  margin: '0 auto 0.75rem',
                  opacity: 0.4
                }}
              />
              <p>Chưa có dữ liệu thống kê.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Thống kê sẽ hiển thị khi có bài nộp đã được chấm xong.
              </p>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
