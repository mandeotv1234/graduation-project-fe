'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BellRing,
  Eye,
  Filter,
  Loader2,
  ShieldAlert,
  UserX
} from 'lucide-react'
import { toast } from 'sonner'

import { getTeacherExamViolations } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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
}

type ExamMonitorPanelProps = {
  monitor: TeacherExamMonitorData
}

export function ExamMonitorPanel({ monitor }: ExamMonitorPanelProps) {
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
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'normal' | 'violating' | 'auto_submitted'
  >('all')
  const [riskFilter, setRiskFilter] = useState<'all' | 'none' | 'low' | 'high'>(
    'all'
  )

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
          forceSubmitted: student.autoSubmitted
        }
      ])
    )
  )

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
          setEvents((prev) => [notification, ...prev].slice(0, 100))
          setMonitorMap((prev) => {
            const existing = prev[notification.studentId]
            const nextCount = notification.violationCount

            return {
              ...prev,
              [notification.studentId]: {
                studentId: notification.studentId,
                studentName:
                  notification.studentName ||
                  existing?.studentName ||
                  `Sinh viên #${notification.studentId}`,
                violationCount: nextCount,
                latestViolationType: notification.violationType,
                latestViolationAt: notification.timestamp,
                isFlagged: existing?.isFlagged ?? false,
                forceSubmitted:
                  notification.autoSubmitted ||
                  existing?.forceSubmitted ||
                  false
              }
            }
          })

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

  useEffect(() => {
    const fetchLatestAttempts = async () => {
      const violators = monitor.students.filter((s) => s.violationCount > 0)
      if (violators.length === 0) return

      try {
        const promises = violators.map((s) =>
          getTeacherExamViolations(monitor.examId, s.studentId)
            .then((res) => ({
              studentId: s.studentId,
              violations: res.data ?? []
            }))
            .catch(() => null)
        )
        const results = await Promise.all(promises)

        setMonitorMap((prev) => {
          const next = { ...prev }
          let changed = false
          results.forEach((res) => {
            if (!res) return
            if (res.violations.length === 0) {
              if (
                next[res.studentId] &&
                next[res.studentId].violationCount !== 0
              ) {
                next[res.studentId] = {
                  ...next[res.studentId],
                  violationCount: 0
                }
                changed = true
              }
              return
            }

            const maxAttempt = Math.max(
              ...res.violations.map((v) => v.attemptNumber ?? 1),
              1
            )
            const latestCount = res.violations.filter(
              (v) => (v.attemptNumber ?? 1) === maxAttempt
            ).length

            if (
              next[res.studentId] &&
              next[res.studentId].violationCount !== latestCount
            ) {
              next[res.studentId] = {
                ...next[res.studentId],
                violationCount: latestCount
              }
              changed = true
            }
          })
          return changed ? next : prev
        })
      } catch {
        // silent
      }
    }

    void fetchLatestAttempts()
  }, [monitor.examId, monitor.students])

  const monitorRows = useMemo(() => {
    return Object.values(monitorMap).sort((a, b) => {
      if (a.forceSubmitted !== b.forceSubmitted) {
        return a.forceSubmitted ? 1 : -1
      }
      if (a.violationCount !== b.violationCount) {
        return b.violationCount - a.violationCount
      }
      return a.studentName.localeCompare(b.studentName)
    })
  }, [monitorMap])

  const filteredRows = useMemo(() => {
    return monitorRows.filter((row) => {
      const byKeyword =
        keyword.trim().length === 0 ||
        row.studentName.toLowerCase().includes(keyword.trim().toLowerCase())

      const byStatus =
        statusFilter === 'all' ||
        (statusFilter === 'normal' &&
          !row.forceSubmitted &&
          row.violationCount === 0) ||
        (statusFilter === 'violating' &&
          !row.forceSubmitted &&
          row.violationCount > 0) ||
        (statusFilter === 'auto_submitted' && row.forceSubmitted)

      const byRisk =
        riskFilter === 'all' ||
        (riskFilter === 'none' && row.violationCount === 0) ||
        (riskFilter === 'low' &&
          row.violationCount > 0 &&
          row.violationCount < 3) ||
        (riskFilter === 'high' && row.violationCount >= 3)

      return byKeyword && byStatus && byRisk
    })
  }, [keyword, monitorRows, riskFilter, statusFilter])

  const totalViolators = monitorRows.filter(
    (row) => row.violationCount > 0
  ).length
  const highRisk = monitorRows.filter((row) => row.violationCount >= 3).length

  const handleFlag = (studentId: number) => {
    setMonitorMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isFlagged: !prev[studentId]?.isFlagged
      }
    }))
  }

  const attemptGroups = useMemo(() => {
    return studentViolations.reduce<Record<string, TeacherExamViolation[]>>(
      (acc, item) => {
        const key = item.attemptNumber
          ? `Lần thi ${item.attemptNumber}`
          : 'Không rõ lần thi'
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(item)
        return acc
      },
      {}
    )
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
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Chi tiết vi phạm: {selectedStudent?.studentName ?? 'Sinh viên'}
            </DialogTitle>
            <DialogDescription>
              Hiển thị lịch sử vi phạm của sinh viên trong các lần thi của bài
              thi này.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : studentViolations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu vi phạm cho sinh viên này.
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-4 overflow-auto pr-1">
              {Object.entries(attemptGroups).map(([attemptLabel, items]) => (
                <div
                  key={attemptLabel}
                  className="rounded-xl border border-border"
                >
                  <div className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-semibold text-foreground">
                    {attemptLabel}
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div key={item.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              item.violationType === 'DEVTOOLS_OPEN' ||
                              item.violationType === 'PASTE'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {item.violationType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground">
                          {item.description || 'Không có mô tả'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
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
        <div className="rounded-xl border border-border bg-card p-5">
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
              {monitorRows.length}
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
              Nguy cơ cao (&gt;=3 lần)
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600">{highRisk}</p>
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
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | 'all'
                        | 'normal'
                        | 'violating'
                        | 'auto_submitted'
                    )
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="normal">Bình thường</option>
                  <option value="violating">Đang vi phạm</option>
                  <option value="auto_submitted">Đã nộp tự động</option>
                </select>
                <div className="flex gap-2">
                  <select
                    value={riskFilter}
                    onChange={(event) =>
                      setRiskFilter(
                        event.target.value as 'all' | 'none' | 'low' | 'high'
                      )
                    }
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Mọi mức vi phạm</option>
                    <option value="none">0 lần</option>
                    <option value="low">1-2 lần</option>
                    <option value="high">&gt;=3 lần</option>
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Đặt lại bộ lọc"
                    onClick={() => {
                      setKeyword('')
                      setStatusFilter('all')
                      setRiskFilter('all')
                    }}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Hiển thị {filteredRows.length}/{monitorRows.length} sinh viên
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
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Số lần vi phạm
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Vi phạm gần nhất
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Hành vi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
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
                          row.violationCount >= 3 ? 'destructive' : 'secondary'
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
                      {row.forceSubmitted ? (
                        <Badge variant="destructive">Đã nộp tự động</Badge>
                      ) : row.isFlagged ? (
                        <Badge variant="secondary">Theo dõi đặc biệt</Badge>
                      ) : (
                        <Badge variant="outline">Bình thường</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={(event) => {
                            event.stopPropagation()
                            toast.info(`Đã gửi nhắc nhở tới ${row.studentName}`)
                          }}
                        >
                          <BellRing className="h-3.5 w-3.5" />
                          Nhắc nhở
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleFlag(row.studentId)
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {row.isFlagged ? 'Bỏ theo dõi' : 'Theo dõi'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={(event) => {
                            event.stopPropagation()
                            toast.warning(
                              `Chức năng cưỡng chế nộp bài cho ${row.studentName} cần backend endpoint riêng.`
                            )
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
