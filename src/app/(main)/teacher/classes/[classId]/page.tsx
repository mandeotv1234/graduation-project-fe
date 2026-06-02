import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  getClassDetail,
  getStudentsInClass,
  getClassExams,
  getClassTeachers,
  getClassBans
} from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { ClassDetailView } from '@/app/(main)/teacher/classes/[classId]/components/class-detail-view'
import { getCookie, decodeJwtPayload } from '@/lib/utils'

interface ClassDetailPageProps {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ studentPage?: string }>
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ classId: string }>
}): Promise<Metadata> {
  const { classId } = await params
  const classIdNum = Number(classId)

  if (isNaN(classIdNum)) {
    return { title: 'Lớp học' }
  }

  try {
    const classRes = await getClassDetail(classIdNum)
    const classCode = classRes.data?.classCode

    return {
      title: classCode ? `Lớp ${classCode}` : `Lớp ${classId}`
    }
  } catch {
    return { title: `Lớp ${classId}` }
  }
}

export default async function ClassDetailPage({
  params,
  searchParams
}: ClassDetailPageProps) {
  const { classId } = await params
  const { studentPage } = await searchParams
  const classIdNum = Number(classId)
  const accessToken = await getCookie('accessToken')
  const decodedToken = accessToken ? decodeJwtPayload(accessToken) : null
  const currentTeacherId = decodedToken?.uid ?? null

  if (isNaN(classIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const [classRes, studentsRes, examsRes, teachersRes, bansRes] =
    await Promise.all([
      getClassDetail(classIdNum),
      getStudentsInClass(classIdNum, Number(studentPage) || 1, 10),
      getClassExams(classIdNum),
      getClassTeachers(classIdNum),
      getClassBans(classIdNum)
    ])

  if (!classRes.data) {
    redirect(PATH.TEACHER_CLASSES)
  }

  return (
    <ClassDetailView
      classDetail={classRes.data}
      teachers={teachersRes.data || []}
      currentTeacherId={currentTeacherId}
      students={studentsRes.data || []}
      studentPagination={studentsRes.meta?.pagination}
      exams={examsRes.data || []}
      currentStudentPage={Number(studentPage) || 1}
      bans={bansRes.data || []}
    />
  )
}
