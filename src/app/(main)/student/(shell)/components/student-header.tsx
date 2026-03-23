'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, GraduationCap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { PATH } from '@/lib/constants'
import { logout, getMe } from '@/lib/actions'
import { useEffect, useState } from 'react'
import { User as UserType } from '@/lib/types'

export function StudentHeader() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)

  useEffect(() => {
    getMe().then((res) => {
      if (res.data) setUser(res.data)
    })
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push(PATH.LOGIN)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={PATH.STUDENT_EXAMS}
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>DATN Portal</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href={PATH.STUDENT_EXAMS}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Bài thi
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden border-r border-border pr-4 text-right md:block">
              <p className="text-sm font-semibold text-foreground leading-none">
                {user.fullName}
              </p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {user.studentId ? `MSSV: ${user.studentId}` : user.email}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
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
