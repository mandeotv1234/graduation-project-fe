import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ExamMonitorPanel } from '@/app/(main)/teacher/exams/[examId]/monitor/components/exam-monitor-panel'
import { getTeacherExamMonitor } from '@/lib/actions'
import { PATH } from '@/lib/constants'

type TeacherExamMonitorPageProps = {
  params: Promise<{ examId: string }>
}

export async function generateMetadata({
  params
}: TeacherExamMonitorPageProps): Promise<Metadata> {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (Number.isNaN(examIdNum)) {
    return { title: 'Giam sat thi' }
  }

  try {
    const response = await getTeacherExamMonitor(examIdNum)
    const examTitle = response.data?.examTitle

    return {
      title: examTitle
        ? `${examTitle} - Giam sat thi`
        : `Giam sat thi #${examId}`
    }
  } catch {
    return { title: `Giam sat thi #${examId}` }
  }
}

export default async function TeacherExamMonitorPage({
  params
}: TeacherExamMonitorPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (Number.isNaN(examIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const monitorRes = await getTeacherExamMonitor(examIdNum)
  const monitor = monitorRes.data

  if (!monitor) {
    redirect(PATH.TEACHER_CLASSES)
  }

  return <ExamMonitorPanel monitor={monitor} />
}
