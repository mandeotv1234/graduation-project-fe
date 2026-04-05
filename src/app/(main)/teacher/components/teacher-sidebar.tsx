'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Database, Library } from 'lucide-react'

import { PATH } from '@/lib/constants'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    label: 'Lớp học',
    description: 'Quản lý lớp và danh sách sinh viên',
    href: PATH.TEACHER_CLASSES,
    icon: BookOpen
  },
  {
    label: 'Đặc tả CSDL',
    description: 'Kho đề và cấu trúc dữ liệu',
    href: PATH.TEACHER_SPECIFICATIONS,
    icon: Database
  },
  {
    label: 'Thư viện',
    description: 'Duyệt đề thi mẫu được chia sẻ',
    href: PATH.TEACHER_LIBRARY,
    icon: Library
  }
]

export function TeacherSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full">
      <nav className="space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname.startsWith(item.href) ||
            (item.label === 'Lớp học' && pathname.startsWith('/teacher/exams'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-start gap-3 rounded-xl border px-3 py-3 transition-all',
                isActive
                  ? 'border-primary/20 bg-primary/10 shadow-sm'
                  : 'border-transparent hover:border-border/70 hover:bg-accent/70'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 rounded-lg p-2 transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-sm font-semibold leading-none transition-colors',
                    isActive ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
