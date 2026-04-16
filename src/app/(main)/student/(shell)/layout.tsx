import { StudentHeader } from '@/app/(main)/student/(shell)/components/student-header/student-header'
import { StudentSidebar } from '@/app/(main)/student/(shell)/components/student-sidebar/student-sidebar'

export default function StudentShellLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-0 flex overflow-hidden bg-surface-container-lowest/50">
      {/* Sidebar - Cột trái kéo dài toàn màn hình */}
      <div className="hidden w-[260px] shrink-0 lg:flex lg:flex-col bg-surface-container-sub-low/70 border-r">
        <StudentSidebar />
      </div>

      {/* Content - Phần bên phải chứa Header và Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <StudentHeader />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
