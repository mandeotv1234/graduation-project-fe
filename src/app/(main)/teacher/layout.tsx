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
    <div className="min-h-screen bg-background">
      <TeacherHeader />
      <main className="mx-auto min-h-[calc(100vh-4rem)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-6rem)] items-stretch gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="h-full self-stretch border-r border-border pr-6">
            <TeacherSidebar />
          </div>
          <div className="min-w-0">
            {breadcrumb}
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
