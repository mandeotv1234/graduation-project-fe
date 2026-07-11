import { CheckCircle2, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getStudentDashboard } from '@/lib/actions/teacher.action'

interface PageProps {
  params: Promise<{
    studentId: string
  }>
}

export default async function StudentDashboardPage({ params }: PageProps) {
  const resolvedParams = await params
  const studentId = parseInt(resolvedParams.studentId, 10)
  if (isNaN(studentId)) {
    notFound()
  }

  const response = await getStudentDashboard(studentId)
  if (!response.data) {
    notFound()
  }

  const { student, classes } = response.data

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-[90rem] mx-auto w-full">
      {/* Left Pane: Student Profile Sidebar */}
      <div className="w-full lg:w-[300px] shrink-0">
        <div className="sticky top-6 space-y-4">
          <div className="rounded-2xl border border-border/50 bg-surface p-6 shadow-sm flex flex-col items-center text-center">
            <div className="flex h-24 w-24 mb-4 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-3xl font-bold tracking-tight">
                {student.fullName.charAt(0).toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-2">
              {student.fullName}
            </h1>

            <div className="flex flex-col items-center gap-1 text-on-surface-variant text-sm w-full">
              <span className="font-medium bg-surface-container-high px-3 py-1 rounded-md">
                {student.studentCode}
              </span>
              {student.email !== student.studentCode && (
                <span className="truncate w-full mt-1" title={student.email}>
                  {student.email}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-low border border-border/50 text-center shadow-sm">
            <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">
              Điểm trung bình (GPA)
            </p>
            <div className="text-5xl font-bold text-primary">
              {student.overallGpa !== null
                ? student.overallGpa.toFixed(2)
                : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Classes Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            Tổng quan Lớp học
          </h2>
          <span className="text-sm font-medium text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
            {classes.length} Lớp
          </span>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-surface p-8 text-center shadow-sm">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-on-surface mb-1">
              Không có dữ liệu lớp học
            </h3>
            <p className="text-on-surface-variant">
              Sinh viên này chưa tham gia lớp học nào do bạn quản lý.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((cls) => {
              const progressPercentage =
                cls.totalExams > 0
                  ? Math.round((cls.submittedExams / cls.totalExams) * 100)
                  : 0

              return (
                <Link
                  key={cls.classId}
                  href={`/teacher/classes/${cls.classId}/students/${student.id}/progress`}
                  className="group relative flex flex-col rounded-2xl border border-border/50 bg-surface p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-1"
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                          {cls.classCode}
                        </h3>
                        <p className="text-sm text-on-surface-variant mt-1">
                          Học kỳ: {cls.term}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-bold text-on-surface">
                          {cls.averageScore !== null
                            ? cls.averageScore.toFixed(2)
                            : '--'}
                        </div>
                        <div className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                          ĐTB
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center text-on-surface-variant gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Tiến độ bài thi
                        </span>
                        <span className="font-medium text-on-surface">
                          {cls.submittedExams} / {cls.totalExams}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className={`h-full transition-all duration-500 ease-in-out ${progressPercentage === 100 ? 'bg-emerald-600' : 'bg-primary'}`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
