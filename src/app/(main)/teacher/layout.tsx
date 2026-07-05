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
    <div className="fixed inset-0 z-0 flex overflow-hidden bg-surface-container-lowest/50">
      {/* Sidebar - Cột trái kéo dài toàn màn hình */}
      <div className="hidden w-[260px] shrink-0 lg:flex lg:flex-col bg-surface-container-sub-low/70">
        <TeacherSidebar />
      </div>

      {/* Content - Phần bên phải chứa Header và Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TeacherHeader />
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto w-full max-w-[1600px]">
            {breadcrumb}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
