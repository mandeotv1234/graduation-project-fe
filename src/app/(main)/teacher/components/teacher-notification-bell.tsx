'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Trash2, CheckCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { connectStomp, getStompClient, subscribeToConnect } from '@/lib/socket'
import { VIOLATION_LABELS, ViolationType } from '@/lib/constants/violation'
import type {
  ViolationNotification,
  TeacherNotificationDto,
  GradingNotificationDto
} from '@/lib/types'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadNotificationCount,
  getMe
} from '@/lib/actions'
import { formatDateTime } from '@/lib/utils/time'
import { PATH } from '@/lib/constants'

// ─── Unified NotificationItem (supports both API & realtime) ─────────
interface NotificationItem {
  id: string | number
  examId: number
  resultId?: number
  studentId?: number
  attemptNumber?: number
  studentName: string
  violationType: string
  description: string
  violationCount: number
  autoSubmitted: boolean
  timestamp: string
  read: boolean
  /** true = came from API (has a real DB id) */
  persisted: boolean
}

function extractAttemptNumber(description?: string | null) {
  const match = description?.match(/lần\s+(\d+)/i)
  return match ? Number(match[1]) : undefined
}

function mapDtoToItem(dto: TeacherNotificationDto): NotificationItem {
  return {
    id: dto.id,
    examId: dto.examId,
    resultId: dto.resultId,
    studentId: dto.studentId,
    attemptNumber: extractAttemptNumber(dto.description),
    studentName: dto.studentName,
    violationType: dto.violationType,
    description: dto.description,
    violationCount: dto.violationCount,
    autoSubmitted: dto.autoSubmitted,
    timestamp: dto.createdAt,
    read: dto.isRead,
    persisted: true
  }
}

function mapWsToItem(payload: ViolationNotification): NotificationItem {
  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    examId: payload.examId,
    studentId: payload.studentId,
    attemptNumber: payload.attemptNumber,
    studentName: payload.studentName || `SV #${payload.studentId}`,
    violationType: payload.violationType,
    description: payload.description,
    violationCount: payload.violationCount,
    autoSubmitted: payload.autoSubmitted,
    timestamp: payload.timestamp || new Date().toISOString(),
    read: false,
    persisted: false
  }
}

function getGradingRealtimeKey(payload: GradingNotificationDto) {
  return `grade-${payload.examId}-${payload.studentId}-${payload.attemptNumber ?? 'unknown'}-${payload.status}-${payload.gradedAt ?? payload.message ?? ''}`
}

function getNotificationTime(item: NotificationItem) {
  const time = new Date(item.timestamp).getTime()
  return Number.isNaN(time) ? 0 : time
}

function getNotificationIdRank(item: NotificationItem) {
  return typeof item.id === 'number' ? item.id : 0
}

function sortNotifications(items: NotificationItem[]) {
  return [...items].sort((a, b) => {
    const timeDiff = getNotificationTime(b) - getNotificationTime(a)
    if (timeDiff !== 0) return timeDiff

    return getNotificationIdRank(b) - getNotificationIdRank(a)
  })
}

// ─── Toast-style popup (Facebook-like) ────────────────────────────────
/*
function showViolationToast(item: NotificationItem) {
  const label =
    VIOLATION_LABELS[item.violationType as ViolationType] || item.violationType

  const toastId = `violation-${item.examId}-${item.violationCount}-${Date.now()}`
  activeToastIds.add(toastId)
  syncDismissAllToast()

  toast.custom(
    (id) => (
      <div className="flex w-[360px] items-start gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-xl animate-in slide-in-from-top-2 fade-in duration-300">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15">
          <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {item.studentName}
            </span>
            {item.autoSubmitted && (
              <Badge
                variant="destructive"
                className="px-1.5 py-0 text-[10px] shrink-0"
              >
                Tự động nộp
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs font-medium text-red-500">{label}</p>
          {item.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.description}
            </p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground">
            Vi phạm #{item.violationCount}
          </p>
        </div>

        <button
          onClick={() => {
            activeToastIds.delete(id)
            syncDismissAllToast()
            toast.dismiss(id)
          }}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ),
    {
      id: toastId,
      duration: 5000,
      position: 'top-right',
      onDismiss: () => {
        activeToastIds.delete(toastId)
        syncDismissAllToast()
      },
      onAutoClose: () => {
        activeToastIds.delete(toastId)
        syncDismissAllToast()
      }
    }
  )
}
*/

// ─── Main Component ──────────────────────────────────────────────────
export function TeacherNotificationBell() {
  const router = useRouter()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)

  const [unreadCount, setUnreadCount] = useState(0)
  const [deleteId, setDeleteId] = useState<string | number | null>(null)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentTeacherId, setCurrentTeacherId] = useState<number | null>(null)
  const pageRef = useRef(1)
  const initialFetched = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<NotificationItem[]>([])
  const realtimeNotificationKeysRef = useRef<Set<string>>(new Set())
  const reconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const PAGE_SIZE = 15

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount()
      setUnreadCount(res.data?.unreadCount ?? 0)
    } catch {
      // silent
    }
  }, [])

  const reconcileUnreadCount = useCallback(() => {
    // Debounce: cancel previous timer so only the LAST one fires.
    // This prevents multiple rapid notifications from triggering
    // multiple API calls that overwrite the badge unpredictably.
    if (reconcileTimerRef.current) {
      clearTimeout(reconcileTimerRef.current)
    }
    reconcileTimerRef.current = setTimeout(() => {
      reconcileTimerRef.current = null
      void refreshUnreadCount()
    }, 2000)
  }, [refreshUnreadCount])

  const markRealtimeNotificationSeen = useCallback((key: string) => {
    if (realtimeNotificationKeysRef.current.has(key)) {
      return false
    }

    realtimeNotificationKeysRef.current.add(key)
    return true
  }, [])

  const hasVisibleNotification = useCallback((item: NotificationItem) => {
    return notificationsRef.current.some((n) => {
      if (n.violationType !== item.violationType || n.examId !== item.examId) {
        return false
      }

      if (item.studentId != null && n.studentId != null) {
        if (item.attemptNumber != null && n.attemptNumber == null) {
          return false
        }

        if (
          item.attemptNumber != null &&
          n.attemptNumber != null &&
          n.attemptNumber !== item.attemptNumber
        ) {
          return false
        }

        if (item.violationType === 'NỘP BÀI') {
          return (
            n.studentId === item.studentId &&
            n.attemptNumber === item.attemptNumber
          )
        }

        return (
          n.studentId === item.studentId &&
          n.violationCount === item.violationCount
        )
      }

      if (item.attemptNumber != null && n.attemptNumber == null) {
        return false
      }

      if (
        item.attemptNumber != null &&
        n.attemptNumber != null &&
        n.attemptNumber !== item.attemptNumber
      ) {
        return false
      }

      if (item.violationType === 'NỘP BÀI') {
        return (
          n.studentName === item.studentName &&
          n.attemptNumber === item.attemptNumber
        )
      }

      return (
        n.studentName === item.studentName &&
        n.violationCount === item.violationCount
      )
    })
  }, [])

  // ─── Fetch notifications page from API ────────────────────────────
  const fetchNotificationsPage = useCallback(
    async (page: number, replace = false) => {
      setLoading(true)
      try {
        const res = await getNotifications(page, PAGE_SIZE)
        const items = (res.data ?? []).map(mapDtoToItem)

        setNotifications((prev) => {
          if (replace) {
            // Giữ lại các thông báo realtime (WebSocket) chưa được lưu vào DB
            // để tránh bị xóa mất khi API trả về
            const realtimeItems = prev.filter((n) => !n.persisted)
            // Loại bỏ realtime items đã có trong API response (đã được persist)
            const apiStudentKeys = new Set(
              items.map(
                (n) =>
                  `${n.examId}-${n.studentName}-${n.violationType}-${n.attemptNumber ?? n.violationCount}`
              )
            )
            const uniqueRealtimeItems = realtimeItems.filter(
              (n) =>
                !apiStudentKeys.has(
                  `${n.examId}-${n.studentName}-${n.violationType}-${n.attemptNumber ?? n.violationCount}`
                )
            )
            return sortNotifications([...uniqueRealtimeItems, ...items])
          }
          // Merge: avoid duplicates by DB id
          const existingIds = new Set(
            prev.filter((n) => n.persisted).map((n) => n.id)
          )
          const newItems = items.filter((n) => !existingIds.has(n.id))
          return sortNotifications([...prev, ...newItems])
        })

        const pagination = res.meta?.pagination
        if (pagination) {
          const totalPages = Math.ceil(pagination.total / pagination.size)
          setHasMore(page < totalPages)
        } else {
          setHasMore(items.length >= PAGE_SIZE)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // ─── Initial load ──────────────────────────────────────────────────
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  // ─── Stable refs for WebSocket handlers (avoid re-creating subscriptions) ──
  const reconcileUnreadCountRef = useRef(reconcileUnreadCount)
  reconcileUnreadCountRef.current = reconcileUnreadCount

  const hasVisibleNotificationRef = useRef(hasVisibleNotification)
  hasVisibleNotificationRef.current = hasVisibleNotification

  const markRealtimeNotificationSeenRef = useRef(markRealtimeNotificationSeen)
  markRealtimeNotificationSeenRef.current = markRealtimeNotificationSeen

  useEffect(() => {
    getMe()
      .then((res) => {
        setCurrentTeacherId(res.data?.id ?? null)
      })
      .catch(() => {
        setCurrentTeacherId(null)
      })
  }, [])

  useEffect(() => {
    if (initialFetched.current) return
    initialFetched.current = true
    void fetchNotificationsPage(1, true)
    void refreshUnreadCount()
  }, [fetchNotificationsPage, refreshUnreadCount])

  useEffect(() => {
    if (!open) return

    pageRef.current = 1
    void fetchNotificationsPage(1, true)
    void refreshUnreadCount()
  }, [fetchNotificationsPage, open, refreshUnreadCount])

  // ─── Load more on scroll ──────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || loading || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight - scrollTop - clientHeight < 80) {
      pageRef.current += 1
      fetchNotificationsPage(pageRef.current)
    }
  }, [loading, hasMore, fetchNotificationsPage])

  // ─── WebSocket subscription ────────────────────────────────────────
  const setupTeacherSubscription = useCallback(
    (client: ReturnType<typeof getStompClient>) => {
      if (!client || currentTeacherId == null) return undefined

      const handleViolation = (message: { body: string }) => {
        try {
          const payload = JSON.parse(message.body) as ViolationNotification
          if (payload.teacherIds?.length) {
            if (!payload.teacherIds.includes(currentTeacherId)) return
          } else if (payload.teacherId !== currentTeacherId) {
            return
          }

          const realtimeKey = `violation-${payload.examId}-${payload.studentId}-${payload.attemptNumber ?? 'unknown'}-${payload.violationType}-${payload.violationCount}`
          if (!markRealtimeNotificationSeenRef.current(realtimeKey)) return

          const newItem = mapWsToItem(payload)
          if (hasVisibleNotificationRef.current(newItem)) return

          setUnreadCount((count) => count + 1)
          reconcileUnreadCountRef.current()

          setNotifications((prev) => {
            return sortNotifications([newItem, ...prev]).slice(0, 200)
          })

          // Tắt hoàn toàn pop-up theo yêu cầu, chỉ chừa lại chấm đỏ.
          // showViolationToast(newItem)
        } catch {
          // silent
        }
      }

      const handleGlobalGradingResult = (message: { body: string }) => {
        try {
          const payload = JSON.parse(message.body) as GradingNotificationDto
          if (
            payload.teacherIds?.length &&
            !payload.teacherIds.includes(currentTeacherId)
          ) {
            return
          }

          if (!['SUBMITTED', 'COMPLETED'].includes(payload.status)) return

          const realtimeKey = getGradingRealtimeKey(payload)
          if (!markRealtimeNotificationSeenRef.current(realtimeKey)) return

          const newItem: NotificationItem = {
            id: `grade-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            examId: payload.examId || 0,
            resultId: payload.resultId,
            studentId: payload.studentId,
            attemptNumber: payload.attemptNumber,
            studentName: payload.studentName || 'Học sinh',
            violationType:
              payload.status === 'COMPLETED' ? 'KẾT QUẢ CHẤM' : 'NỘP BÀI',
            description:
              payload.message ||
              (payload.status === 'COMPLETED'
                ? `Đã chấm xong: ${payload.totalScore ?? 0}/${payload.maxScore ?? 0} điểm.`
                : payload.attemptNumber
                  ? `Đã nộp bài lần ${payload.attemptNumber}. Đang chấm điểm.`
                  : 'Đã nộp bài. Đang chấm điểm.'),
            violationCount: 0,
            autoSubmitted: false,
            timestamp: payload.gradedAt || new Date().toISOString(),
            read: false,
            persisted: false
          }

          if (hasVisibleNotificationRef.current(newItem)) return

          setUnreadCount((count) => count + 1)
          reconcileUnreadCountRef.current()

          setNotifications((prev) => {
            return sortNotifications([newItem, ...prev]).slice(0, 200)
          })

          // Vẫn bật popup nhỏ nếu đang ở trang giám sát
          const isMonitorPage = window.location.pathname.endsWith('/monitor')
          if (isMonitorPage) {
            const isCompleted = payload.status === 'COMPLETED'
            toast.info(
              isCompleted
                ? `Đã chấm xong bài của ${newItem.studentName}`
                : `Học sinh ${newItem.studentName} vừa nộp bài`,
              {
                id: `toast-grade-${payload.examId}-${payload.studentId || payload.studentName}`,
                description: isCompleted
                  ? `${payload.totalScore ?? 0}/${payload.maxScore ?? 0} điểm.`
                  : 'Đang chấm điểm.',
                action: payload.examId
                  ? {
                      label: 'Xem',
                      onClick: () =>
                        (window.location.href = payload.resultId
                          ? PATH.TEACHER_EXAM_RESULT(
                              payload.examId,
                              payload.resultId
                            )
                          : PATH.TEACHER_EXAM_RESULTS(payload.examId))
                    }
                  : undefined
              }
            )
          }
        } catch {
          // silent
        }
      }

      const sub1 = client.subscribe('/user/queue/violations', handleViolation)
      const sub2 = client.subscribe(
        '/topic/teacher/violations',
        handleViolation
      )
      const sub3 = client.subscribe(
        '/user/queue/grading-results',
        handleGlobalGradingResult
      )
      const sub4 = client.subscribe(
        '/topic/teacher/grading-results',
        handleGlobalGradingResult
      )

      return () => {
        sub1.unsubscribe()
        sub2.unsubscribe()
        sub3.unsubscribe()
        sub4.unsubscribe()
      }
    },
    [currentTeacherId] // ← Chỉ 1 dependency stable — không còn re-create subscription
  )

  useEffect(() => {
    if (currentTeacherId == null) return

    connectStomp() // Ensure the background connection starts

    let unsubscribeSub: (() => void) | undefined

    const unSubConnect = subscribeToConnect(() => {
      // Nếu socket bị rớt và connect lại, hàm này sẽ tự động được chạy lại
      if (unsubscribeSub) {
        unsubscribeSub()
      }
      // Truyền client trực tiếp — tại thời điểm này client chắc chắn đã connected
      const client = getStompClient()
      unsubscribeSub = setupTeacherSubscription(client)
    })

    return () => {
      unSubConnect()
      unsubscribeSub?.()
    }
  }, [currentTeacherId, setupTeacherSubscription])

  // ─── Mark all read when popover CLOSES after being open ─────────────
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
    } else if (wasOpenRef.current) {
      // Popover just closed → mark all as read
      wasOpenRef.current = false
      if (unreadCount > 0) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
        markAllNotificationsRead().catch(() => {})
      }
    }
  }, [open, unreadCount])

  // ─── Delete Handlers ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)

    const item = notifications.find((n) => n.id === id)
    if (!item) return

    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (!item.read) {
      setUnreadCount((count) => Math.max(0, count - 1))
    }

    if (item.persisted && typeof id === 'number') {
      try {
        await deleteNotification(id)
        toast.success('Đã xóa thông báo')
      } catch {
        toast.error('Xóa thất bại')
      }
    }
  }

  const handleDeleteAll = async () => {
    setShowDeleteAll(false)
    setNotifications([])
    setUnreadCount(0)
    try {
      await deleteAllNotifications()
      toast.success('Đã xóa tất cả thông báo')
    } catch {
      toast.error('Xóa thất bại')
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────
  const getViolationLabel = (type: string) =>
    VIOLATION_LABELS[type as ViolationType] || type

  const getSeverityColor = (type: string) => {
    if (type === 'NỘP BÀI' || type === 'KẾT QUẢ CHẤM') {
      return 'text-green-600 dark:text-green-400'
    }
    switch (type) {
      case ViolationType.DEVTOOLS_OPEN:
      case ViolationType.PASTE:
        return 'text-red-500'
      case ViolationType.TAB_SWITCH:
      case ViolationType.FULLSCREEN_EXIT:
        return 'text-yellow-500'
      default:
        return 'text-orange-400'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      const diffHour = Math.floor(diffMs / 3600000)

      if (diffMin < 1) return 'Vừa xong'
      if (diffMin < 60) return `${diffMin} phút trước`
      if (diffHour < 24) return `${diffHour} giờ trước`

      return formatDateTime(date)
    } catch {
      return ''
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            title="Thông báo vi phạm"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-in zoom-in duration-200">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[400px] p-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">Thông báo từ hệ thống</h4>
              {notifications.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {notifications.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, read: true }))
                    )
                    setUnreadCount(0)
                    markAllNotificationsRead()
                  }}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Đã đọc
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteAll(true)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Xóa
                </Button>
              )}
            </div>
          </div>

          {/* Notification List — single scroll container (no double-nesting) */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[420px] overflow-y-auto bg-white dark:bg-zinc-900"
          >
            {notifications.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">Chưa có thông báo</p>
                <p className="mt-1 text-xs opacity-60">
                  Thông báo vi phạm sẽ hiển thị ở đây
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`cursor-pointer px-4 py-3 transition-all duration-200 ${
                      !notification.read
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                    onClick={() => {
                      // 1. Mark as read
                      if (!notification.read) {
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        )
                        setUnreadCount((count) => Math.max(0, count - 1))
                        if (
                          notification.persisted &&
                          typeof notification.id === 'number'
                        ) {
                          markNotificationRead(notification.id)
                        }
                      }

                      // 2. Navigate to the relevant page
                      const href =
                        notification.violationType === 'NỘP BÀI' ||
                        notification.violationType === 'KẾT QUẢ CHẤM'
                          ? notification.resultId
                            ? PATH.TEACHER_EXAM_RESULT(
                                notification.examId,
                                notification.resultId
                              )
                            : PATH.TEACHER_EXAM_RESULTS(notification.examId)
                          : PATH.TEACHER_EXAM_MONITOR(notification.examId)

                      setOpen(false)
                      if (pathname !== href) {
                        router.push(href)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {notification.studentName}
                          </span>
                          {notification.autoSubmitted && (
                            <Badge
                              variant="destructive"
                              className="px-1.5 py-0 text-[10px]"
                            >
                              Tự động nộp
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`mt-0.5 text-xs font-medium ${getSeverityColor(
                            notification.violationType
                          )}`}
                        >
                          {getViolationLabel(notification.violationType)}
                        </p>
                        {notification.description && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {notification.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          {notification.violationType === 'NỘP BÀI' ||
                          notification.violationType === 'KẾT QUẢ CHẤM' ? (
                            notification.attemptNumber != null && (
                              <>
                                <span className="text-[10px] text-muted-foreground">
                                  Lần thi #{notification.attemptNumber}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  •
                                </span>
                              </>
                            )
                          ) : (
                            <>
                              <span className="text-[10px] text-muted-foreground">
                                Vi phạm #{notification.violationCount}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                •
                              </span>
                            </>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col flex-shrink-0 items-center justify-start gap-2 h-full py-1">
                        {!notification.read && (
                          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(notification.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}

                {/* End of list */}
                {!hasMore && notifications.length > 0 && !loading && (
                  <div className="py-3 text-center text-xs text-muted-foreground/60">
                    Đã hiển thị tất cả thông báo
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete Single Dialog */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa thông báo?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thông báo vi phạm này không? Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Dialog */}
      <AlertDialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tất cả thông báo?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tất cả thông báo vi phạm? Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAll}
            >
              Xóa tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
