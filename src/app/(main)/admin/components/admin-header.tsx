'use client'

import Link from 'next/link'
import { LogOut, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { PATH } from '@/lib/constants'
import { logout, getMe } from '@/lib/actions'
import type { User } from '@/lib/types'

export function AdminHeader() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

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
    <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-border/60">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4">
        <Link
          href={PATH.ADMIN_FEEDBACKS}
          className="flex lg:hidden items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-colors"
        >
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span>DATN Portal</span>
        </Link>

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
