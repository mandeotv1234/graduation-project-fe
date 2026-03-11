'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bell,
  AlertTriangle,
  Trash2,
  CheckCheck,
  Loader2,
  X
} from 'lucide-react'
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
import { connectStomp, disconnectStomp, getStompClient } from '@/lib/socket'
import { VIOLATION_LABELS, ViolationType } from '@/lib/constants/violation'
import type { ViolationNotification, TeacherNotificationDto } from '@/lib/types'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications
} from '@/lib/actions'

// ─── Unified NotificationItem (supports both API & realtime) ─────────
interface NotificationItem {
  id: string | number
  examId: number
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

function mapDtoToItem(dto: TeacherNotificationDto): NotificationItem {
  return {
    id: dto.id,
    examId: dto.examId,
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

// ─── Toast-style popup (Facebook-like) ────────────────────────────────
function showViolationToast(item: NotificationItem) {
  const label =
    VIOLATION_LABELS[item.violationType as ViolationType] || item.violationType

  toast.custom(
    (id) => (
      <div className="flex w-[360px] items-start gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-xl animate-in slide-in-from-top-2 fade-in duration-300">
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15">
          <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
        </div>

        {/* Content */}
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

        {/* Close */}
        <button
          onClick={() => toast.dismiss(id)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-right'
    }
  )
}

// ─── Main Component ──────────────────────────────────────────────────
export function TeacherNotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | number | null>(null)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(1)
  const isConnected = useRef(false)
  const initialFetched = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const PAGE_SIZE = 15

  // ─── Fetch unread count from API ──────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount()
      if (res.data) {
        setUnreadCount(res.data.unreadCount)
      }
    } catch {
      // silent — will be refreshed on next interval
    }
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
            // On first page replace, also sync unread count from loaded items
            const unread = items.filter((n) => !n.read).length
            setUnreadCount((cur) => Math.max(cur, unread))
            return items
          }
          // Merge: avoid duplicates by DB id
          const existingIds = new Set(
            prev.filter((n) => n.persisted).map((n) => n.id)
          )
          const newItems = items.filter((n) => !existingIds.has(n.id))
          return [...prev, ...newItems]
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
    if (initialFetched.current) return
    initialFetched.current = true
    fetchUnreadCount()
    fetchNotificationsPage(1, true)
  }, [fetchUnreadCount, fetchNotificationsPage])

  // ─── Poll unread count every 30s ──────────────────────────────────
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

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
  const setupTeacherSubscription = useCallback(() => {
    const client = getStompClient()
    if (!client?.connected) return

    const handleViolation = (message: { body: string }) => {
      try {
        const payload = JSON.parse(message.body) as ViolationNotification
        const newItem = mapWsToItem(payload)
        setNotifications((prev) => [newItem, ...prev].slice(0, 200))
        setUnreadCount((c) => c + 1)

        // Show Facebook-style toast popup
        showViolationToast(newItem)
      } catch {
        console.error('[TeacherNotification] Failed to parse message')
      }
    }

    client.subscribe('/user/queue/violations', handleViolation)
    client.subscribe('/topic/teacher/violations', handleViolation)
  }, [])

  useEffect(() => {
    if (isConnected.current) return

    connectStomp({
      onConnect: () => {
        isConnected.current = true
        setupTeacherSubscription()
      },
      onDisconnect: () => {
        isConnected.current = false
      }
    })

    return () => {
      disconnectStomp()
      isConnected.current = false
    }
  }, [setupTeacherSubscription])

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
      setUnreadCount((c) => Math.max(0, c - 1))
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

      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
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
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <h4 className="text-sm font-semibold">Thông báo vi phạm</h4>
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
                      if (!notification.read) {
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        )
                        setUnreadCount((c) => Math.max(0, c - 1))
                        if (
                          notification.persisted &&
                          typeof notification.id === 'number'
                        ) {
                          markNotificationRead(notification.id)
                        }
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
                          <span className="text-[10px] text-muted-foreground">
                            Vi phạm #{notification.violationCount}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            •
                          </span>
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-xs">Đang tải...</span>
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
