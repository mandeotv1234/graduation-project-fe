'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Users,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderOpen
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { ClassListItem, PaginationMeta } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface ClassesListProps {
  classes: ClassListItem[]
  pagination?: PaginationMeta
  currentPage: number
}

function ClassCard({ item }: { item: ClassListItem }) {
  return (
    <Link href={PATH.TEACHER_CLASS_DETAIL(item.id)}>
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
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
          </div>

          <div className="flex gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
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
  currentPage
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href={PATH.TEACHER_CREATE_CLASS}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo lớp mới
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((item) => (
          <ClassCard key={item.id} item={item} />
        ))}
      </div>

      {pagination && (
        <Pagination pagination={pagination} currentPage={currentPage} />
      )}
    </div>
  )
}
