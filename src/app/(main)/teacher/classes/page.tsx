import type { Metadata } from 'next'

import { getClasses } from '@/lib/actions'
import { ClassesList } from '@/app/(main)/teacher/classes/components/classes-list'
import { decodeJwtPayload, getCookie } from '@/lib/utils'

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
  const accessToken = await getCookie('accessToken')
  const currentTeacherId = accessToken
    ? (decodeJwtPayload(accessToken)?.uid ?? null)
    : null

  return (
    <div className="space-y-8">
      <ClassesList
        classes={classes}
        pagination={pagination}
        currentPage={page}
        currentTeacherId={currentTeacherId}
      />
    </div>
  )
}
