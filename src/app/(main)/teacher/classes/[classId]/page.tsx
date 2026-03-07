import { redirect } from 'next/navigation'
import {
  getClassDetail,
  getStudentsInClass,
  getClassExams
} from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { ClassDetailView } from '@/app/(main)/teacher/classes/[classId]/components/class-detail-view'

interface ClassDetailPageProps {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ studentPage?: string }>
}

export default async function ClassDetailPage({
  params,
  searchParams
}: ClassDetailPageProps) {
  const { classId } = await params
  const { studentPage } = await searchParams
  const classIdNum = Number(classId)

  if (isNaN(classIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const [classRes, studentsRes, examsRes] = await Promise.all([
    getClassDetail(classIdNum),
    getStudentsInClass(classIdNum, Number(studentPage) || 1, 10),
    getClassExams(classIdNum)
  ])

  if (!classRes.data) {
    redirect(PATH.TEACHER_CLASSES)
  }

  return (
    <ClassDetailView
      classDetail={classRes.data}
      students={studentsRes.data || []}
      studentPagination={studentsRes.meta?.pagination}
      exams={examsRes.data || []}
      currentStudentPage={Number(studentPage) || 1}
    />
  )
}
