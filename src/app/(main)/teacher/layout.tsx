import { TeacherHeader } from '@/app/(main)/teacher/components/teacher-header'
import { TeacherSidebar } from '@/app/(main)/teacher/components/teacher-sidebar'

export default function TeacherLayout({
  children,
  breadcrumb
}: {
  children: React.ReactNode
  breadcrumb: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-0 flex flex-col overflow-hidden bg-background">
      <TeacherHeader />
      {/* Shell full viewport; chỉ cột <main> cuộn — sidebar không theo document scroll */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden min-h-0 w-[240px] shrink-0 overflow-hidden border-r border-border py-4 pl-6 pr-6 lg:block">
          <TeacherSidebar />
        </div>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px]">
            {breadcrumb}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
