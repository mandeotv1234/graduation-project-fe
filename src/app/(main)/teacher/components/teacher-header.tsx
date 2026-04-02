'use client'

import Link from 'next/link'
import { LogOut, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { TeacherNotificationBell } from '@/app/(main)/teacher/components/teacher-notification-bell'
import { PATH } from '@/lib/constants'
import { logout, getMe } from '@/lib/actions'
import { useEffect, useState } from 'react'
import { User as UserType } from '@/lib/types'
import { connectStomp } from '@/lib/socket'

export function TeacherHeader() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)

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
    await logout()
    router.push(PATH.LOGIN)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-header-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={PATH.TEACHER_CLASSES}
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>DATN Portal</span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Teacher
          </span>
        </Link>

        <div className="flex items-center gap-4">
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
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
