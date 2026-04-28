import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ExamMonitorPanel } from '@/app/(main)/teacher/exams/[examId]/monitor/components/exam-monitor-panel'
import {
  getTeacherExamDetail,
  getTeacherExamMonitor,
  getTeacherExamViolations
} from '@/lib/actions'
import { PATH } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type TeacherExamMonitorPageProps = {
  params: Promise<{ examId: string }>
}

export async function generateMetadata({
  params
}: TeacherExamMonitorPageProps): Promise<Metadata> {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (Number.isNaN(examIdNum)) {
    return { title: 'Giám sát thi' }
  }

  try {
    const response = await getTeacherExamMonitor(examIdNum)
    const examTitle = response.data?.examTitle

    return {
      title: examTitle
        ? `${examTitle} - Giám sát thi`
        : `Giám sát thi #${examId}`
    }
  } catch {
    return { title: `Giám sát thi #${examId}` }
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

  let maxViolations: number | undefined
  try {
    const detailRes = await getTeacherExamDetail(examIdNum)
    maxViolations = detailRes.data?.settings?.maxViolations
  } catch {
    // If fetching details fails, we just proceed without maxViolations setting
  }

  const violators = monitor.students.filter((s) => s.violationCount > 0)
  if (violators.length > 0) {
    const promises = violators.map((s) =>
      getTeacherExamViolations(examIdNum, s.studentId)
        .then((res) => ({
          studentId: s.studentId,
          violations: res.data ?? []
        }))
        .catch(() => null)
    )
    const results = await Promise.all(promises)
    results.forEach((res) => {
      if (!res) return
      const student = monitor.students.find(
        (s) => s.studentId === res.studentId
      )
      if (student) {
        if (res.violations.length === 0) {
          student.violationCount = 0
        } else {
          const maxAttempt = Math.max(
            ...res.violations.map((v) => v.attemptNumber ?? 1),
            1
          )
          const latestCount = res.violations.filter(
            (v) => (v.attemptNumber ?? 1) === maxAttempt
          ).length
          student.violationCount = latestCount
        }
      }
    })
  }

  return <ExamMonitorPanel monitor={monitor} maxViolations={maxViolations} />
}
