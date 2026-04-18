import { getClassDetail, getStudentsInClass } from '@/lib/actions'
import { EditClassPage } from './components/edit-class-page'

export default async function Page({
  params
}: {
  params: Promise<{ classId: string }>
}) {
  const { classId } = await params

  const [classRes, studentsRes] = await Promise.all([
    getClassDetail(Number(classId)),
    getStudentsInClass(Number(classId), 1, 1000)
  ])

  const initialStudents =
    studentsRes.data?.map((s) => ({
      studentId: s.email ? s.email.split('@')[0] : '',
      fullName: s.fullName
    })) || []

  return (
    <EditClassPage
      classId={Number(classId)}
      initialClassCode={classRes.data?.classCode || ''}
      initialSemester={classRes.data?.semester || ''}
      initialStudents={initialStudents}
    />
  )
}
