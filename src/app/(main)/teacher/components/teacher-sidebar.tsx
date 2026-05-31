'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Database, Library, GraduationCap } from 'lucide-react'

import { SidebarNavLink } from '@/components/shared/sidebar-nav-link'
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
    <aside className="w-full flex flex-col h-full pl-6 pr-6 py-4">
      <div className="flex items-center shrink-0 mb-6 mt-1 px-1">
        <Link
          href={PATH.TEACHER_CLASSES}
          className="flex items-center gap-2.5 text-foreground transition-colors hover:text-primary"
        >
          <GraduationCap className="h-6 w-6 text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-medium leading-none tracking-tight whitespace-nowrap">
              DATN Portal
            </span>
            <span className="mt-1 w-fit rounded bg-primary/10 px-1 py-0.5 text-[9px] font-bold text-primary tracking-widest uppercase leading-none">
              Teacher
            </span>
          </div>
        </Link>
      </div>

      <nav className="space-y-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname.startsWith(item.href) ||
            (item.label === 'Lớp học' && pathname.startsWith('/teacher/exams'))
          return (
            <SidebarNavLink
              key={item.href}
              href={item.href}
              isActive={isActive}
              className={cn(
                'group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all outline-none',
                isActive
                  ? 'bg-primary-container text-on-primary-container shadow-md shadow-primary-container/20'
                  : 'text-on-surface hover:bg-surface-variant/50'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-300',
                  isActive
                    ? 'text-on-primary-container scale-110'
                    : 'text-outline group-hover:text-primary-fixed-dim group-hover:scale-110'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="min-w-0 flex flex-col">
                <span
                  className={cn(
                    'block text-sm font-medium tracking-tight',
                    isActive ? 'text-on-primary-container' : 'text-on-surface'
                  )}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span
                    className={cn(
                      'mt-0.5 block text-xs font-medium',
                      isActive
                        ? 'text-on-primary-container/80'
                        : 'text-outline-variant'
                    )}
                  >
                    {item.description}
                  </span>
                )}
              </span>
            </SidebarNavLink>
          )
        })}
      </nav>
    </aside>
  )
}
