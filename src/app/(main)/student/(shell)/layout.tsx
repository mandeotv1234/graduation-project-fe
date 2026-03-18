import { StudentHeader } from '@/app/(main)/student/(shell)/components/student-header'

export default function StudentShellLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
