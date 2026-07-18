'use client'

import { GraduationCap, Loader2, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { TeacherNotificationBell } from '@/app/(main)/teacher/components/teacher-notification-bell'
import { GlobalSearch } from '@/components/shared/global-search'
import { LogoutOverlay } from '@/components/shared/logout-overlay'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { Button } from '@/components/ui/button'
import { getMe, logout } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { connectStomp } from '@/lib/socket'
import { User as UserType } from '@/lib/types'
import { useEffect, useState } from 'react'

export function TeacherHeader() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    // 1. Fetch current user info
    getMe().then((res) => {
      if (res.data) setUser(res.data)
    })

    // 2. Ensure WebSocket connection is active for notifications
    // Passing no options to connectStomp is fine, it just ensures activation.
    connectStomp()
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await logout()
      router.push(PATH.LOGIN)
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-border/60">
      <LogoutOverlay open={isLoggingOut} />
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4">
        <Link
          href={PATH.TEACHER_CLASSES}
          className="flex lg:hidden items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-colors"
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>DATN Portal</span>
        </Link>

        {/* Thanh tìm kiếm hiển thị trên Desktop */}
        <div className="hidden lg:flex flex-1 items-center max-w-md ml-48 mr-4">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {user && (
            <div className="hidden border-r border-border pr-4 text-right md:block">
              <p className="text-sm font-semibold text-foreground leading-none">
                {user.fullName}
              </p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {user.email}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <TeacherNotificationBell />
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              title={isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              aria-label={isLoggingOut ? 'Đang đăng xuất' : 'Đăng xuất'}
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
