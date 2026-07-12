'use client'

import {
  Ban,
  BookOpenCheck,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Mail,
  PencilLine,
  Plus,
  Settings,
  ShieldCheck,
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

const BAN_REASON_MAX_LENGTH = 200

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
  const totalStudents = studentPagination?.total ?? students.length
  const creatorName = teachers.find((teacher) => teacher.isCreator)?.fullName
  const publishedExamCount = exams.filter((exam) => exam.isPublished).length
  const draftExamCount = exams.length - publishedExamCount
  const activeExamCount = exams.filter(
    (exam) =>
      exam.isPublished &&
      getExamStatus(exam.startTime, exam.endTime) === 'in_progress'
  ).length
  const studentStartIndex = (currentStudentPage - 1) * 10

  const handleBanStudent = () => {
    if (!studentToBan) return
    setIsBanning(true)
    startTransition(async () => {
      try {
        const res = await banStudent(classDetail.id, {
          studentId: studentToBan.id,
          reason: banReason.trim().slice(0, BAN_REASON_MAX_LENGTH)
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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                Học kỳ {classDetail.semester}
              </Badge>
              {activeExamCount > 0 ? (
                <Badge className="rounded-full bg-emerald-500 text-white hover:bg-emerald-500">
                  {activeExamCount} bài đang diễn ra
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full">
                  {publishedExamCount} bài đã công bố
                </Badge>
              )}
            </div>
            <h1 className="truncate text-3xl font-bold tracking-tight text-foreground">
              {classDetail.classCode}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Tạo ngày {formatDate(classDetail.createdAt)}
              </span>
              {creatorName && (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Người tạo: {creatorName}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

        <div className="grid border-t border-border bg-muted/20 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 border-border p-4 sm:border-r">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none text-foreground">
                {totalStudents}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Sinh viên</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-border p-4 xl:border-r">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none text-foreground">
                {teachers.length}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Giáo viên</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-border p-4 sm:border-r">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none text-foreground">
                {exams.length}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bài thi · {draftExamCount} nháp
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none text-foreground">
                {bans.length}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Bị cấm thi</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.8fr)]">
        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <BookOpenCheck className="h-5 w-5 text-primary" />
                  Bài thi trong lớp
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Theo dõi đề thi, đặc tả CSDL và trạng thái công bố.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit rounded-full">
                {exams.length} bài thi
              </Badge>
            </div>

            {exams.length === 0 ? (
              <div className="m-4 rounded-lg border border-dashed border-border py-12 text-center">
                <FileText className="mx-auto h-9 w-9 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Chưa có bài thi nào
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tạo bài thi đầu tiên để sinh viên bắt đầu làm bài.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {exams.map((exam) => (
                  <article
                    key={exam.id}
                    className="group flex flex-col gap-4 p-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center"
                  >
                    <Link
                      href={PATH.TEACHER_EXAM_DETAIL(exam.id)}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                              {exam.title}
                            </h3>
                            <ExamStatusBadge exam={exam} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateTime(exam.startTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {exam.durationMinutes} phút
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Link
                        href={PATH.TEACHER_EXAM_DETAIL(exam.id)}
                        title="Cài đặt bài thi"
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-lg hover:border-primary/30 hover:bg-accent"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setExamToDelete(exam.id)}
                        title="Xóa bài thi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Users className="h-5 w-5 text-primary" />
                  Sinh viên
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quản lý trạng thái tham gia và xem tiến độ từng sinh viên.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="w-fit rounded-full">
                  {totalStudents} sinh viên
                </Badge>
                <Link href={PATH.TEACHER_EDIT_CLASS(classDetail.id)}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <PencilLine className="h-4 w-4" />
                    Thêm/sửa sinh viên
                  </Button>
                </Link>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="m-4 rounded-lg border border-dashed border-border py-12 text-center">
                <Users className="mx-auto h-9 w-9 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Chưa có sinh viên nào
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thêm danh sách sinh viên trong phần chỉnh sửa lớp.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Sinh viên
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Ngày tham gia
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Tiến bộ
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                            className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                          >
                            <td className="px-4 py-3 text-muted-foreground">
                              {studentStartIndex + index + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                                  {student.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-foreground">
                                      {student.fullName}
                                    </span>
                                    {isBanned && (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        Đã cấm
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Mail className="h-3.5 w-3.5" />
                                    {student.email}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDate(student.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={PATH.TEACHER_STUDENT_PROGRESS(
                                  classDetail.id,
                                  student.id
                                )}
                                className="font-medium text-primary hover:underline"
                              >
                                Xem tiến bộ
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-right">
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

                {studentPagination &&
                  studentPagination.total > studentPagination.size && (
                    <div className="border-t border-border p-3">
                      <Pagination
                        page={currentStudentPage}
                        totalPages={Math.ceil(
                          studentPagination.total / studentPagination.size
                        )}
                        totalItems={studentPagination.total}
                        pageSize={studentPagination.size}
                        onPageChange={goToStudentPage}
                      />
                    </div>
                  )}
              </>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <ClassTeachersSection
            classId={classDetail.id}
            creatorId={classDetail.creatorId}
            currentTeacherId={currentTeacherId}
            teachers={teachers}
          />

          <ClassBansSection classId={classDetail.id} bans={bans} />
        </aside>
      </div>

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
              onChange={(e) =>
                setBanReason(e.target.value.slice(0, BAN_REASON_MAX_LENGTH))
              }
              placeholder="Nhập lý do cấm thi..."
              rows={3}
              maxLength={BAN_REASON_MAX_LENGTH}
              disabled={isBanning}
            />
            <div className="text-right text-xs text-muted-foreground">
              {banReason.length}/{BAN_REASON_MAX_LENGTH}
            </div>
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
