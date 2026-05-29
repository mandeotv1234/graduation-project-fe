'use client'

import {
  Ban,
  Calendar,
  Clock,
  Database,
  FileText,
  Loader2,
  Plus,
  Settings,
  Trash2,
  User,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { ClassBansSection } from '@/app/(main)/teacher/classes/[classId]/components/class-bans-section'
import { ClassTeachersSection } from '@/app/(main)/teacher/classes/[classId]/components/class-teachers-section'
import { Pagination } from '@/components/shared/pagination'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { PATH } from '@/lib/constants'
import { banStudent, deleteExam } from '@/lib/actions'
import {
  BannedStudentInfo,
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
  bans: BannedStudentInfo[]
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
  currentStudentPage,
  bans
}: ClassDetailViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [examToDelete, setExamToDelete] = useState<number | null>(null)
  const [studentToBan, setStudentToBan] = useState<StudentInClass | null>(null)
  const [banReason, setBanReason] = useState('')
  const [isBanning, setIsBanning] = useState(false)

  const bannedIds = new Set(bans.map((b) => b.studentId))

  const handleBanStudent = () => {
    if (!studentToBan) return
    setIsBanning(true)
    startTransition(async () => {
      try {
        const res = await banStudent(classDetail.id, {
          studentId: studentToBan.id,
          reason: banReason.trim()
        })
        if (res.code === 'OK') {
          toast.success(`Đã cấm sinh viên ${studentToBan.fullName}`)
          setStudentToBan(null)
          setBanReason('')
          router.refresh()
        } else {
          toast.error(res.message || 'Không thể cấm sinh viên')
        }
      } catch {
        toast.error('Có lỗi xảy ra khi cấm sinh viên')
      } finally {
        setIsBanning(false)
      }
    })
  }

  const goToStudentPage = (page: number) => {
    router.push(`?studentPage=${page}`, { scroll: false })
  }

  const handleDeleteExam = async () => {
    if (!examToDelete) return

    startTransition(async () => {
      try {
        const res = await deleteExam(examToDelete)
        if (res.code === 'OK') {
          toast.success('Xóa bài thi thành công')
          router.refresh()
        } else {
          toast.error(res.message || 'Không thể xóa bài thi')
        }
      } catch {
        toast.error('Có lỗi xảy ra khi xóa bài thi')
      } finally {
        setExamToDelete(null)
      }
    })
  }

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
        <div className="flex items-center gap-3">
          <Link href={PATH.TEACHER_EDIT_CLASS(classDetail.id)}>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Sửa lớp
            </Button>
          </Link>
          <Link href={PATH.TEACHER_CREATE_EXAM(classDetail.id)}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo bài thi
            </Button>
          </Link>
        </div>
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

      <ClassBansSection classId={classDetail.id} bans={bans} />

      {/* Exams section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            Danh sách bài thi
          </h2>
        </div>

        {exams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-10 text-center">
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
                    href={PATH.TEACHER_EXAM_SPECIFICATION(exam.id)}
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
                    href={PATH.TEACHER_EXAM_DETAIL(exam.id)}
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

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg"
                    onClick={() => setExamToDelete(exam.id)}
                    title="Xóa bài thi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog
        open={examToDelete !== null}
        onOpenChange={(open) => !open && setExamToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài thi?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến bài
              thi này (bao gồm kết quả làm bài của sinh viên) sẽ bị xóa vĩnh
              viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteExam}
              disabled={isPending}
            >
              {isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tiến bộ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const isBanned = bannedIds.has(student.id)
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {(currentStudentPage - 1) * 10 + index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <span className="flex items-center gap-2">
                          {student.fullName}
                          {isBanned && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-1.5 py-0"
                            >
                              Đã cấm
                            </Badge>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {student.email}
                      </td>
                      <td className="px-4 py-3 text-left">
                        <Link
                          href={PATH.TEACHER_STUDENT_PROGRESS(
                            classDetail.id,
                            student.id
                          )}
                          className="text-primary hover:underline"
                        >
                          Xem tiến bộ
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {isBanned ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="gap-1.5 text-muted-foreground"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Đã cấm
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setStudentToBan(student)
                              setBanReason('')
                            }}
                            disabled={isPending}
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Cấm
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {studentPagination &&
          studentPagination.total > studentPagination.size && (
            <Pagination
              className="pt-2"
              page={currentStudentPage}
              totalPages={Math.ceil(
                studentPagination.total / studentPagination.size
              )}
              totalItems={studentPagination.total}
              pageSize={studentPagination.size}
              onPageChange={goToStudentPage}
            />
          )}
      </section>

      {/* Ban student dialog */}
      <Dialog
        open={Boolean(studentToBan)}
        onOpenChange={(open) => {
          if (!open && !isBanning) {
            setStudentToBan(null)
            setBanReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cấm sinh viên thi</DialogTitle>
            <DialogDescription>
              {studentToBan ? (
                <>
                  Sinh viên <strong>{studentToBan.fullName}</strong> sẽ không
                  thể bắt đầu phiên thi trong lớp này.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Lý do (tùy chọn)
            </label>
            <Textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do cấm thi..."
              rows={3}
              disabled={isBanning}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStudentToBan(null)
                setBanReason('')
              }}
              disabled={isBanning}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanStudent}
              disabled={isBanning}
            >
              {isBanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Xác nhận cấm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
