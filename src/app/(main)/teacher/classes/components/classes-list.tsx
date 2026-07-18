'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  Plus,
  Users,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Trash2,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { ClassListItem, PaginationMeta } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { deleteClass, restoreClass } from '@/lib/actions'

interface ClassesListProps {
  classes: ClassListItem[]
  pagination?: PaginationMeta
  currentPage: number
  currentTeacherId: number | null
}

function ClassCard({
  item,
  currentTeacherId
}: {
  item: ClassListItem
  currentTeacherId: number | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isDeleted = item.deletedAt !== null
  const canManageClass = currentTeacherId === item.creatorId

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!canManageClass) return

    startTransition(async () => {
      try {
        await deleteClass(item.id)
        toast.success('Đã xoá lớp học')
        router.refresh()
      } catch {
        toast.error('Không thể xoá lớp học')
      }
    })
  }

  function handleRestore(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!canManageClass) return

    startTransition(async () => {
      try {
        await restoreClass(item.id)
        toast.success('Đã khôi phục lớp học')
        router.refresh()
      } catch {
        toast.error('Không thể khôi phục lớp học')
      }
    })
  }

  const cardContent = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card p-6 bg-surface-container-low border-b-2 transition-all duration-300',
        isDeleted
          ? 'opacity-60 border-destructive/20 cursor-default'
          : 'border-primary/10 hover:border-primary/30 hover:shadow-md cursor-pointer'
      )}
    >
      {!isDeleted && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      {isDeleted && (
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive/40" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                isDeleted
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  'truncate text-lg font-semibold transition-colors',
                  isDeleted
                    ? 'text-muted-foreground line-through'
                    : 'text-foreground group-hover:text-primary'
                )}
                title={item.classCode}
              >
                {item.classCode}
              </h3>
              <p className="text-sm text-muted-foreground">
                Học kỳ: {item.semester}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Tạo ngày: {formatDate(item.createdAt)}</span>
          </div>

          {isDeleted && (
            <p className="text-xs text-destructive font-medium">Đã xoá</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex gap-2">
            {!isDeleted && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            )}
            {!isDeleted && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <FileText className="h-4 w-4" />
              </div>
            )}
          </div>

          {isDeleted ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
              disabled={isPending || !canManageClass}
              onClick={handleRestore}
              title={
                canManageClass
                  ? 'Khôi phục lớp học'
                  : 'Chỉ người tạo lớp mới có thể khôi phục lớp'
              }
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Khôi phục
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 text-muted-foreground transition-opacity',
                canManageClass
                  ? 'opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100'
                  : 'cursor-not-allowed opacity-40'
              )}
              disabled={isPending || !canManageClass}
              onClick={handleDelete}
              title={
                canManageClass
                  ? 'Xóa lớp học'
                  : 'Chỉ người tạo lớp mới có thể xóa lớp'
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  if (isDeleted) {
    return <div>{cardContent}</div>
  }

  return <Link href={PATH.TEACHER_CLASS_DETAIL(item.id)}>{cardContent}</Link>
}

function Pagination({
  pagination,
  currentPage
}: {
  pagination: PaginationMeta
  currentPage: number
}) {
  const router = useRouter()
  const totalPages = Math.ceil(pagination.total / pagination.size)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Hiển thị trang {currentPage}/{totalPages} · Tổng: {pagination.total} lớp
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => router.push(`?page=${currentPage - 1}`)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => router.push(`?page=${currentPage + 1}`)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ClassesList({
  classes,
  pagination,
  currentPage,
  currentTeacherId
}: ClassesListProps) {
  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Chưa có lớp học nào
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tạo lớp học đầu tiên để bắt đầu quản lý.
        </p>
        <Link href={PATH.TEACHER_CREATE_CLASS}>
          <Button className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Tạo lớp mới
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Quản lý lớp học
          </h1>
          <p className="text-muted-foreground">
            Danh sách các lớp học bạn đang phụ trách
          </p>
        </div>
        <Link href={PATH.TEACHER_CREATE_CLASS}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo lớp mới
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((item) => (
          <ClassCard
            key={item.id}
            item={item}
            currentTeacherId={currentTeacherId}
          />
        ))}
      </div>

      {pagination && (
        <Pagination pagination={pagination} currentPage={currentPage} />
      )}
    </div>
  )
}
