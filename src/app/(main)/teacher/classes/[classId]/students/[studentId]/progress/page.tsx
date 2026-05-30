import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getTeacherStudentProgress } from '@/lib/actions'
import { PATH } from '@/lib/constants'

import { TeacherStudentProgressView } from './student-progress-view'

interface TeacherStudentProgressPageProps {
  params: Promise<{
    classId: string
    studentId: string
  }>
}

export const metadata: Metadata = {
  title: 'Tiến bộ sinh viên'
}

export default async function TeacherStudentProgressPage({
  params
}: TeacherStudentProgressPageProps) {
  const { classId, studentId } = await params
  const classIdNum = Number(classId)
  const studentIdNum = Number(studentId)

  if (Number.isNaN(classIdNum) || Number.isNaN(studentIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const response = await getTeacherStudentProgress(classIdNum, studentIdNum)

  if (!response.data) {
    redirect(PATH.TEACHER_CLASS_DETAIL(classIdNum))
  }

  return <TeacherStudentProgressView progress={response.data} />
}
