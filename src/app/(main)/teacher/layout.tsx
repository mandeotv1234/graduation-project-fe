import { TeacherHeader } from '@/app/(main)/teacher/components/teacher-header'

export default function TeacherLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <TeacherHeader />
      <main className="mx-auto px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
