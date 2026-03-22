import type { Metadata } from 'next'

import { getClasses } from '@/lib/actions'
import { ClassesList } from '@/app/(main)/teacher/classes/components/classes-list'

export const metadata: Metadata = {
  title: 'Lớp học'
}

interface ClassesPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function TeacherClassesPage({
  searchParams
}: ClassesPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1

  const response = await getClasses(page, 10)
  const classes = response.data || []
  const pagination = response.meta?.pagination

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
      </div>

      <ClassesList
        classes={classes}
        pagination={pagination}
        currentPage={page}
      />
    </div>
  )
}
