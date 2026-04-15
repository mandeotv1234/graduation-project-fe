'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, CheckCircle2, GraduationCap } from 'lucide-react'

import { PATH } from '@/lib/constants'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    label: 'Bài thi',
    description: 'Danh sách bài thi cần thực hiện',
    href: PATH.STUDENT_EXAMS,
    icon: FileText
  },
  {
    label: 'Kết quả',
    description: 'Xem lại lịch sử và điểm số',
    href: PATH.STUDENT_EXAM_RESULTS,
    icon: CheckCircle2
  }
]

export function StudentSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full flex flex-col h-full pl-6 pr-6 py-4">
      <div className="flex items-center shrink-0 mb-6 mt-1 px-1">
        <Link
          href={PATH.STUDENT_EXAMS}
          className="flex items-center gap-2.5 text-foreground transition-colors hover:text-primary"
        >
          <GraduationCap className="h-6 w-6 text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-medium leading-none tracking-tight whitespace-nowrap">
              DATN Portal
            </span>
            <span className="mt-1 w-fit rounded bg-primary/10 px-1 py-0.5 text-[9px] font-bold text-primary tracking-widest uppercase leading-none">
              Student
            </span>
          </div>
        </Link>
      </div>

      <nav className="space-y-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
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
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
