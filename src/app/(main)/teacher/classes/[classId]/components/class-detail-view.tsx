'use client'

import {
  Calendar,
  Clock,
  Database,
  FileText,
  Plus,
  Settings,
  User,
  Users
} from 'lucide-react'
import Link from 'next/link'

import { ClassTeachersSection } from '@/app/(main)/teacher/classes/[classId]/components/class-teachers-section'
import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import {
  ClassDetail,
  ClassExamItem,
  ClassTeacher,
  PaginationMeta,
  StudentInClass
} from '@/lib/types'
import { formatDate, formatDateTime, getExamStatus } from '@/lib/utils'

interface ClassDetailViewProps {
  classDetail: ClassDetail
  teachers: ClassTeacher[]
  currentTeacherId: number | null
  students: StudentInClass[]
  studentPagination?: PaginationMeta
  exams: ClassExamItem[]
  currentStudentPage: number
}

const EXAM_STATUS_CONFIG = {
  upcoming: {
    label: 'Sắp diễn ra',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  },
  in_progress: {
    label: 'Đang diễn ra',
    className:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  ended: {
    label: 'Đã kết thúc',
    className:
      'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20'
  },
  draft: {
    label: 'Nháp',
    className:
      'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20'
  }
}

function ExamStatusBadge({ exam }: { exam: ClassExamItem }) {
  const statusKey = !exam.isPublished
    ? 'draft'
    : getExamStatus(exam.startTime, exam.endTime)
  const { label, className } = EXAM_STATUS_CONFIG[statusKey]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

export function ClassDetailView({
  classDetail,
  teachers,
  currentTeacherId,
  students,
  studentPagination,
  exams,
  currentStudentPage
}: ClassDetailViewProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {classDetail.classCode}
            </h1>
            <p className="text-muted-foreground">
              Học kỳ {classDetail.semester} · Tạo ngày{' '}
              {formatDate(classDetail.createdAt)}
            </p>
          </div>
        </div>
        <Link href={PATH.TEACHER_CREATE_EXAM(classDetail.id)}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo bài thi
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xs bg-surface-container-low p-6 border-b-2 border-primary/10 bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {studentPagination?.total || students.length}
              </p>
              <p className="text-sm text-muted-foreground">Sinh viên</p>
            </div>
          </div>
        </div>
        <div className="rounded-xs bg-surface-container-low p-6 border-b-2 border-primary/10 bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <User className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {teachers.length}
              </p>
              <p className="text-sm text-muted-foreground">Giáo viên</p>
            </div>
          </div>
        </div>
        <div className="rounded-xs bg-surface-container-low p-6 border-b-2 border-primary/10 bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {exams.length}
              </p>
              <p className="text-sm text-muted-foreground">Bài thi</p>
            </div>
          </div>
        </div>
      </div>

      <ClassTeachersSection
        classId={classDetail.id}
        creatorId={classDetail.creatorId}
        currentTeacherId={currentTeacherId}
        teachers={teachers}
      />

      {/* Exams section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            Danh sách bài thi
          </h2>
        </div>

        {exams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Chưa có bài thi nào
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="group flex items-center gap-2 relative overflow-hidden rounded-xs border  bg-card p-6 bg-surface-container-low border-b-2 border-primary/10 transition-all duration-300 hover:border-primary/30 hover:shadow-md"
              >
                <Link
                  href={PATH.TEACHER_EXAM_DETAIL(exam.id)}
                  className="flex-1 min-w-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {exam.title}
                      </h3>
                      <ExamStatusBadge exam={exam} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(exam.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {exam.durationMinutes} phút
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={PATH.TEACHER_EXAM_SPECIFICATION_PREVIEW(exam.id)}
                    title="Đặc tả CSDL"
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-lg border-border hover:border-primary/30 hover:bg-accent"
                    >
                      <Database className="h-4 w-4" />
                    </Button>
                  </Link>

                  <Link
                    href={PATH.TEACHER_EDIT_EXAM(exam.id)}
                    title="Cài đặt bài thi"
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-lg hover:border-primary/30 hover:bg-blue-50"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Students section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          Danh sách sinh viên
        </h2>

        {students.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Chưa có sinh viên nào
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xs bg-card border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Họ tên
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr
                    key={student.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {(currentStudentPage - 1) * 10 + index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {student.fullName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {student.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {studentPagination &&
          studentPagination.total > studentPagination.size && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <p className="text-xs text-muted-foreground mr-4">
                Trang {currentStudentPage}/
                {Math.ceil(studentPagination.total / studentPagination.size)} ·
                Tổng: {studentPagination.total} sinh viên
              </p>
              <Link
                href={`?studentPage=${currentStudentPage - 1}`}
                className={
                  currentStudentPage <= 1
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentStudentPage <= 1}
                >
                  Trước
                </Button>
              </Link>
              <Link
                href={`?studentPage=${currentStudentPage + 1}`}
                className={
                  currentStudentPage >=
                  Math.ceil(studentPagination.total / studentPagination.size)
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    currentStudentPage >=
                    Math.ceil(studentPagination.total / studentPagination.size)
                  }
                >
                  Tiếp
                </Button>
              </Link>
            </div>
          )}
      </section>
    </div>
  )
}
