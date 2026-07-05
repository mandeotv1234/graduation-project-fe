'use client'

import Link from 'next/link'
import { LogOut, GraduationCap, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-border/60">
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
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm lớp học, chức năng..."
              className="w-full h-9 pl-9 bg-surface-container/50 focus-visible:ring-1 focus-visible:border-border focus-visible:bg-surface-container-lowest rounded-full transition-all shadow-none border-none"
            />
          </div>
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
