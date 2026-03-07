'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, GraduationCap, BookOpen, Database } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { PATH } from '@/lib/constants'
import { logout } from '@/lib/actions'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Lớp học', href: PATH.TEACHER_CLASSES, icon: BookOpen },
  {
    label: 'Schema Templates',
    href: PATH.TEACHER_SCHEMA_TEMPLATES,
    icon: Database
  }
]

export function TeacherHeader() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
    router.push(PATH.LOGIN)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
