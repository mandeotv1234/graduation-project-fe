'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BellRing,
  Filter,
  Loader2,
  ShieldAlert,
  UserX
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/shared/pagination'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useApi } from '@/hooks/use-api'
import { getTeacherExamMonitor, getTeacherExamViolations } from '@/lib/actions'
import {
  forceSubmitStudentExam,
  remindStudent
} from '@/lib/actions/exam.action'
import {
  connectStomp,
  subscribeToConnect,
  subscribeToExamViolations
} from '@/lib/socket'
import {
  TeacherExamMonitorData,
  TeacherExamViolation,
  ViolationNotification
} from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

type StudentMonitorState = {
  studentId: number
  studentName: string
  violationCount: number
  latestViolationType?: string
  latestViolationAt?: string
  isFlagged: boolean
  forceSubmitted: boolean
  examStatus: string
}

type ExamMonitorPanelProps = {
  monitor: TeacherExamMonitorData
  maxViolations?: number
}

const PAGE_SIZE = 10

export function ExamMonitorPanel({
  monitor,
  maxViolations
}: ExamMonitorPanelProps) {
  const highRiskThreshold =
    typeof maxViolations === 'number' ? Math.max(1, maxViolations - 1) : 3

  const { callApi } = useApi()
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<ViolationNotification[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] =
    useState<StudentMonitorState | null>(null)
  const [studentViolations, setStudentViolations] = useState<
    TeacherExamViolation[]
  >([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTypeFilter, setDetailTypeFilter] = useState<string>('all')
  const [detailAttemptFilter, setDetailAttemptFilter] = useState<string>('all')
  const [keyword, setKeyword] = useState('')

  const [sortColumn, setSortColumn] = useState<
    'violationCount' | 'latestViolationAt' | null
  >('violationCount')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const [riskFilter, setRiskFilter] = useState<'all' | 'none' | 'low' | 'high'>(
    'all'
  )
  const [examStatusFilter, setExamStatusFilter] = useState<
    'ALL' | 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'NOT_STARTED'
  >('IN_PROGRESS')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalStudents, setTotalStudents] = useState(monitor.totalStudents)
  const [totalViolators, setTotalViolators] = useState(monitor.totalViolators)
  const [totalHighRisk, setTotalHighRisk] = useState(
    monitor.totalHighRisk ??
      monitor.students.filter(
        (student) => student.violationCount >= highRiskThreshold
      ).length
  )
  const [totalFilteredStudents, setTotalFilteredStudents] = useState(
    monitor.totalFilteredStudents ?? monitor.students.length
  )
  const [refreshKey, setRefreshKey] = useState(0)

  const [monitorMap, setMonitorMap] = useState<
    Record<number, StudentMonitorState>
  >(() =>
    Object.fromEntries(
      monitor.students.map((student) => [
        student.studentId,
        {
          studentId: student.studentId,
          studentName: student.studentName,
          violationCount: student.violationCount,
          latestViolationType: student.latestViolationType ?? undefined,
          latestViolationAt: student.latestViolationAt ?? undefined,
          isFlagged: false,
          forceSubmitted: student.autoSubmitted,
          examStatus: student.examStatus
        }
      ])
    )
  )
  const [monitorOrder, setMonitorOrder] = useState<number[]>(() =>
    monitor.students.map((student) => student.studentId)
  )

  useEffect(() => {
    let cancelled = false

    const fetchMonitorPage = async () => {
      const response = await getTeacherExamMonitor(monitor.examId, {
        page: currentPage,
        size: PAGE_SIZE,
        keyword,
        riskFilter,
        examStatusFilter,
        highRiskThreshold,
        sortColumn: sortColumn ?? 'violationCount',
        sortDirection
      })

      if (cancelled || !response.data) return

      setTotalStudents(response.data.totalStudents)
      setTotalViolators(response.data.totalViolators)
      setTotalHighRisk(
        response.data.totalHighRisk ??
          response.data.students.filter(
            (student) => student.violationCount >= highRiskThreshold
          ).length
      )
      setTotalFilteredStudents(
        response.data.totalFilteredStudents ?? response.data.students.length
      )
      setMonitorMap(
        Object.fromEntries(
          response.data.students.map((student) => [
            student.studentId,
            {
              studentId: student.studentId,
              studentName: student.studentName,
              violationCount: student.violationCount,
              latestViolationType: student.latestViolationType ?? undefined,
              latestViolationAt: student.latestViolationAt ?? undefined,
              isFlagged: false,
              forceSubmitted: student.autoSubmitted,
              examStatus: student.examStatus
            }
          ])
        )
      )
      setMonitorOrder(
        response.data.students.map((student) => student.studentId)
      )
    }

    void fetchMonitorPage()

    return () => {
      cancelled = true
    }
  }, [
    currentPage,
    examStatusFilter,
    highRiskThreshold,
    keyword,
    monitor.examId,
    refreshKey,
    riskFilter,
    sortColumn,
    sortDirection
  ])

  useEffect(() => {
    connectStomp({
      onConnect: () => {
        setConnected(true)
      },
      onDisconnect: () => {
        setConnected(false)
      }
    })

    return () => {}
  }, [])

  useEffect(() => {
    let unsubscribeSub: (() => void) | undefined

    const unSubConnect = subscribeToConnect(() => {
      setConnected(true)
      if (unsubscribeSub) {
        unsubscribeSub()
      }

      unsubscribeSub = subscribeToExamViolations(
        monitor.examId,
        (notification) => {
          if (notification.type !== 'SESSION_STATUS_CHANGED') {
            setEvents((prev) => [notification, ...prev].slice(0, 100))
          }
          setMonitorMap((prev) => {
            const existing = prev[notification.studentId]

            // Determine if it's a NEW attempt (transition from SUBMITTED/AUTO_SUBMITTED to IN_PROGRESS)
            const isNewAttempt =
              notification.type === 'SESSION_STATUS_CHANGED' &&
              notification.examStatus === 'IN_PROGRESS' &&
              existing?.examStatus !== 'IN_PROGRESS'

            const nextCount =
              notification.type === 'SESSION_STATUS_CHANGED'
                ? isNewAttempt
                  ? 0
                  : (existing?.violationCount ?? 0)
                : notification.violationCount

            return {
              ...prev,
              [notification.studentId]: {
                studentId: notification.studentId,
                studentName:
                  notification.studentName ||
                  existing?.studentName ||
                  `Sinh viên #${notification.studentId}`,
                violationCount: nextCount,
                latestViolationType:
                  notification.type === 'SESSION_STATUS_CHANGED'
                    ? isNewAttempt
                      ? undefined
                      : existing?.latestViolationType
                    : notification.violationType,
                latestViolationAt:
                  notification.type === 'SESSION_STATUS_CHANGED'
                    ? isNewAttempt
                      ? undefined
                      : existing?.latestViolationAt
                    : notification.timestamp,
                isFlagged: existing?.isFlagged ?? false,
                forceSubmitted:
                  notification.autoSubmitted ||
                  existing?.forceSubmitted ||
                  false,
                examStatus: notification.autoSubmitted
                  ? 'AUTO_SUBMITTED'
                  : (notification.examStatus ??
                    existing?.examStatus ??
                    'IN_PROGRESS')
              }
            }
          })
          setMonitorOrder((prev) =>
            prev.includes(notification.studentId)
              ? prev
              : [notification.studentId, ...prev]
          )
          setRefreshKey((key) => key + 1)

          if (notification.type === 'SESSION_STATUS_CHANGED') {
            return // Skip toast for pure status updates
          }

          if (notification.autoSubmitted) {
            toast.error(
              `${notification.studentName} đã bị nộp bài tự động do vi phạm ${notification.violationCount} lần.`
            )
          } else {
            toast.warning(
              `${notification.studentName}: Vi phạm lần ${notification.violationCount}: ${notification.description || notification.violationType}`
            )
          }
        }
      )
    })

    return () => {
      unSubConnect()
      unsubscribeSub?.()
    }
  }, [monitor.examId])

  const monitorRows = useMemo(() => {
    return monitorOrder
      .map((studentId) => monitorMap[studentId])
      .filter((row): row is StudentMonitorState => Boolean(row))
  }, [monitorMap, monitorOrder])

  const handleSort = (column: 'violationCount' | 'latestViolationAt') => {
    if (sortColumn === column) {
      if (sortDirection === 'desc') {
        setSortDirection('asc')
      } else {
        setSortColumn('violationCount')
        setSortDirection('desc') // reset
      }
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  const filteredRows = useMemo(() => {
    return monitorRows
  }, [monitorRows])

  const totalPages = Math.ceil(totalFilteredStudents / PAGE_SIZE)
  const paginatedRows = filteredRows

  useEffect(() => {
    setCurrentPage((page) => {
      if (totalPages <= 0) return 1
      return Math.min(page, totalPages)
    })
  }, [totalPages])

  const filteredStudentViolations = useMemo(() => {
    return studentViolations.filter((v) => {
      const matchType =
        detailTypeFilter === 'all' || v.violationType === detailTypeFilter
      const matchAttempt =
        detailAttemptFilter === 'all' ||
        v.attemptNumber?.toString() === detailAttemptFilter
      return matchType && matchAttempt
    })
  }, [studentViolations, detailTypeFilter, detailAttemptFilter])

  const attemptGroups = useMemo(() => {
    return filteredStudentViolations.reduce<
      Record<string, TeacherExamViolation[]>
    >((acc, item) => {
      const key = item.attemptNumber
        ? `Lần thi ${item.attemptNumber}`
        : 'Không rõ lần thi'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {})
  }, [filteredStudentViolations])

  const uniqueViolationTypes = useMemo(() => {
    const types = new Set(studentViolations.map((v) => v.violationType))
    return Array.from(types).filter(Boolean)
  }, [studentViolations])

  const uniqueAttempts = useMemo(() => {
    const attempts = new Set(
      studentViolations.map((v) => v.attemptNumber).filter(Boolean)
    )
    return Array.from(attempts).sort((a, b) => Number(a) - Number(b))
  }, [studentViolations])

  const openStudentDetail = async (row: StudentMonitorState) => {
    setSelectedStudent(row)
    setStudentViolations([])
    setDetailOpen(true)
    setDetailLoading(true)

    const response = await callApi(
      getTeacherExamViolations(monitor.examId, row.studentId),
      false
    )

    const violations = (response.data ?? []).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    setStudentViolations(violations)
    setDetailLoading(false)
  }

  return (
    <>
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setSelectedStudent(null)
            setStudentViolations([])
            setDetailTypeFilter('all')
            setDetailAttemptFilter('all')
          }
        }}
      >
        <DialogContent className="max-w-3xl border-outline bg-surface text-on-surface">
          <DialogHeader>
            <DialogTitle className="text-on-surface">
              Chi tiết vi phạm: {selectedStudent?.studentName ?? 'Sinh viên'}
            </DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              Hiển thị lịch sử vi phạm của sinh viên trong các lần thi của bài
              thi này.
            </DialogDescription>
          </DialogHeader>

          {studentViolations.length > 0 && !detailLoading && (
            <div className="mb-2 flex flex-col gap-3 sm:flex-row">
              <select
                value={detailTypeFilter}
                onChange={(e) => setDetailTypeFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-outline bg-surface-container px-3 text-sm text-on-surface focus:border-sub-primary sm:w-auto"
              >
                <option value="all">Tất cả loại vi phạm</option>
                {uniqueViolationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={detailAttemptFilter}
                onChange={(e) => setDetailAttemptFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-outline bg-surface-container px-3 text-sm text-on-surface focus:border-sub-primary sm:w-auto"
              >
                <option value="all">Tất cả lần thi</option>
                {uniqueAttempts.map((attempt) => (
                  <option key={String(attempt)} value={String(attempt)}>
                    Lần thi {attempt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {detailLoading ? (
            <div className="flex items-center justify-center py-10 text-on-surface-variant">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : studentViolations.length === 0 ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              Chưa có dữ liệu vi phạm cho sinh viên này.
            </p>
          ) : Object.keys(attemptGroups).length === 0 ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              Không tìm thấy vi phạm nào khớp với bộ lọc.
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-4 overflow-auto pr-1">
              {Object.entries(attemptGroups).map(([attemptLabel, items]) => (
                <div
                  key={attemptLabel}
                  className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden"
                >
                  <div className="border-b border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                    {attemptLabel}
                  </div>
                  <div className="divide-y divide-outline-variant">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface px-4 py-3 transition-colors"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={
                              item.violationType === 'DEVTOOLS_OPEN' ||
                              item.violationType === 'PASTE'
                                ? 'border-transparent bg-error-container text-on-error-container hover:bg-error hover:text-on-error'
                                : 'border-transparent bg-secondary-container text-on-secondary-container hover:bg-sub-secondary hover:text-on-secondary'
                            }
                          >
                            {item.violationType}
                          </Badge>
                          <span className="text-xs text-on-surface-variant">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-on-surface">
                          {item.description || 'Không có mô tả'}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          IP: {item.ipAddress || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Giám sát kỳ thi theo thời gian thực
              </h1>
              <p className="text-sm text-muted-foreground">
                Bài thi: {monitor.examTitle} · Lớp {monitor.classCode}
              </p>
            </div>
            <Badge
              variant={connected ? 'default' : 'destructive'}
              className="h-fit w-fit"
            >
              {connected ? 'Socket đang kết nối' : 'Socket đang ngắt kết nối'}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Tổng thí sinh</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {totalStudents}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Có vi phạm</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {totalViolators}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Nguy cơ cao (&gt;={highRiskThreshold} lần)
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {totalHighRisk}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                Danh sách thí sinh đang giám sát
              </h2>
              <div className="grid gap-2 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Tìm theo tên sinh viên..."
                    value={keyword}
                    onChange={(event) => {
                      setKeyword(event.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
                <select
                  value={examStatusFilter}
                  onChange={(event) => {
                    setExamStatusFilter(
                      event.target.value as
                        | 'ALL'
                        | 'IN_PROGRESS'
                        | 'SUBMITTED'
                        | 'AUTO_SUBMITTED'
                        | 'NOT_STARTED'
                    )
                    setCurrentPage(1)
                  }}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="ALL">Mọi trạng thái thi</option>
                  <option value="IN_PROGRESS">Đang thi</option>
                  <option value="NOT_STARTED">Chưa bắt đầu</option>
                </select>

                <div className="flex gap-2">
                  <select
                    value={riskFilter}
                    onChange={(event) => {
                      setRiskFilter(
                        event.target.value as 'all' | 'none' | 'low' | 'high'
                      )
                      setCurrentPage(1)
                    }}
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Mọi mức vi phạm</option>
                    <option value="none">0 lần</option>
                    <option value="low">1-{highRiskThreshold - 1} lần</option>
                    <option value="high">&gt;={highRiskThreshold} lần</option>
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Đặt lại bộ lọc"
                    onClick={() => {
                      setKeyword('')
                      setRiskFilter('all')
                      setExamStatusFilter('IN_PROGRESS')
                      setSortColumn('violationCount')
                      setSortDirection('desc')
                      setCurrentPage(1)
                    }}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Hiển thị {filteredRows.length}/{totalFilteredStudents} sinh viên
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Sinh viên
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/80"
                    onClick={() => handleSort('violationCount')}
                  >
                    <div className="flex items-center gap-2">
                      Số lần vi phạm
                      {sortColumn === 'violationCount' ? (
                        sortDirection === 'desc' ? (
                          <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Vi phạm gần nhất
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/80"
                    onClick={() => handleSort('latestViolationAt')}
                  >
                    <div className="flex items-center gap-2">
                      Thời gian
                      {sortColumn === 'latestViolationAt' ? (
                        sortDirection === 'desc' ? (
                          <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Trạng thái thi
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Hành vi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr
                    key={row.studentId}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.studentName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.violationCount >= highRiskThreshold
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation()
                          void openStudentDetail(row)
                        }}
                        title="Nhấn để xem chi tiết các lần vi phạm"
                      >
                        {row.violationCount}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.latestViolationType ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.latestViolationAt
                        ? formatDateTime(row.latestViolationAt)
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {row.examStatus === 'IN_PROGRESS' ? (
                        <Badge
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Đang thi
                        </Badge>
                      ) : row.examStatus === 'SUBMITTED' ? (
                        <Badge variant="secondary">Đã nộp bài</Badge>
                      ) : row.examStatus === 'AUTO_SUBMITTED' ? (
                        <Badge variant="destructive">
                          Đã bị nộp bài tự động
                        </Badge>
                      ) : (
                        <Badge variant="outline">Chưa bắt đầu</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={row.examStatus !== 'IN_PROGRESS'}
                          onClick={(event) => {
                            event.stopPropagation()
                            callApi(
                              remindStudent(
                                monitor.examId,
                                row.studentId,
                                'Giáo viên yêu cầu bạn nghiêm túc làm bài.'
                              ),
                              false
                            ).then((res) => {
                              if (res?.code !== 'UNHANDLED_ERROR') {
                                toast.info(
                                  `Đã gửi nhắc nhở tới ${row.studentName}`
                                )
                              }
                            })
                          }}
                        >
                          <BellRing className="h-3.5 w-3.5" />
                          Nhắc nhở
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                          disabled={row.examStatus !== 'IN_PROGRESS'}
                          onClick={(event) => {
                            event.stopPropagation()
                            if (
                              window.confirm(
                                `Bạn có chắc chắn muốn nộp bài tự động của ${row.studentName}?`
                              )
                            ) {
                              callApi(
                                forceSubmitStudentExam(
                                  monitor.examId,
                                  row.studentId
                                ),
                                false
                              ).then((res) => {
                                if (res?.code !== 'UNHANDLED_ERROR') {
                                  toast.success(
                                    `Đã cưỡng chế nộp bài của ${row.studentName}`
                                  )
                                }
                              })
                            }
                          }}
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Cưỡng chế nộp
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      Không có sinh viên phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalFilteredStudents > 0 && (
            <Pagination
              className="border-t border-border px-4 py-3"
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalFilteredStudents}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Luồng vi phạm mới nhất
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa ghi nhận vi phạm nào.
            </p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 12).map((event, index) => (
                <div
                  key={`${event.studentId}-${event.timestamp}-${index}`}
                  className="rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        event.autoSubmitted ? 'destructive' : 'secondary'
                      }
                    >
                      {event.autoSubmitted ? 'Auto submit' : 'Violation'}
                    </Badge>
                    <p className="text-sm font-medium text-foreground">
                      {event.studentName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(event.timestamp)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.description || event.violationType} · Tổng vi phạm:{' '}
                    {event.violationCount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
