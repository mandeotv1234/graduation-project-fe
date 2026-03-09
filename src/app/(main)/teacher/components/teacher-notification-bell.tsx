'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, AlertTriangle, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { connectStomp, disconnectStomp, getStompClient } from '@/lib/socket'
import { VIOLATION_LABELS, ViolationType } from '@/lib/constants/violation'
import type { ViolationNotification } from '@/lib/types'

interface NotificationItem {
  id: string
  examId: number
  studentName: string
  violationType: string
  description: string
  violationCount: number
  autoSubmitted: boolean
  timestamp: string
  read: boolean
}

export function TeacherNotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const isConnected = useRef(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Kết nối WebSocket và subscribe violations cho teacher
  const setupTeacherSubscription = useCallback(() => {
    const client = getStompClient()
    if (!client?.connected) return

    // Subscribe to all relevant violation topics
    client.subscribe('/user/queue/violations', (message) => {
      try {
        const payload = JSON.parse(message.body) as ViolationNotification
        const newNotification: NotificationItem = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          examId: payload.examId,
          studentName: payload.studentName || `SV #${payload.studentId}`,
          violationType: payload.violationType,
          description: payload.description,
          violationCount: payload.violationCount,
          autoSubmitted: payload.autoSubmitted,
          timestamp: payload.timestamp || new Date().toISOString(),
          read: false
        }
        setNotifications((prev) => [newNotification, ...prev].slice(0, 100))
      } catch {
        console.error('[TeacherNotification] Failed to parse message')
      }
    })

    // Subscribe to exam-specific topics if needed in the future using active exams
    // For now, relying on global teacher topics below.

    // Also subscribe topic chung (fallback)
    client.subscribe('/topic/teacher/violations', (message) => {
      try {
        const payload = JSON.parse(message.body) as ViolationNotification
        const newNotification: NotificationItem = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          examId: payload.examId,
          studentName: payload.studentName || `SV #${payload.studentId}`,
          violationType: payload.violationType,
          description: payload.description,
          violationCount: payload.violationCount,
          autoSubmitted: payload.autoSubmitted,
          timestamp: payload.timestamp || new Date().toISOString(),
          read: false
        }
        setNotifications((prev) => [newNotification, ...prev].slice(0, 100))
      } catch {
        console.error('[TeacherNotification] Failed to parse message')
      }
    })
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

  // Đánh dấu tất cả đã đọc khi mở popover
  useEffect(() => {
    if (open && unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }, [open, unreadCount])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const getViolationLabel = (type: string) => {
    return VIOLATION_LABELS[type as ViolationType] || type
  }

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
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return ''
    }
  }

  return (
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
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <h4 className="text-sm font-semibold">Thông báo vi phạm</h4>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {notifications.length}
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Xóa tất cả
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">Chưa có thông báo</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 transition-colors ${
                    !notification.read ? 'bg-primary/5' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">
                          {notification.studentName}
                        </span>
                        {notification.autoSubmitted && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Tự động nộp
                          </Badge>
                        )}
                      </div>
                      <p
                        className={`text-xs font-medium mt-0.5 ${getSeverityColor(notification.violationType)}`}
                      >
                        {getViolationLabel(notification.violationType)}
                      </p>
                      {notification.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {notification.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
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
                    {!notification.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
