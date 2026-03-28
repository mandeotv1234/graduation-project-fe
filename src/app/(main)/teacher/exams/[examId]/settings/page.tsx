import { redirect } from 'next/navigation'

import {
  getExamSpecification,
  getTeacherExamSettings,
  getTeacherExamTemplateVersions
} from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { ExamSettingsView } from '@/app/(main)/teacher/exams/[examId]/settings/components/exam-settings-view'

interface ExamSettingsPageProps {
  params: Promise<{ examId: string }>
}

export default async function ExamSettingsPage({
  params
}: ExamSettingsPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (Number.isNaN(examIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const [examResponse, specificationResponse, versionsResponse] =
    await Promise.all([
      getTeacherExamSettings(examIdNum),
      getExamSpecification(examIdNum),
      getTeacherExamTemplateVersions(examIdNum)
    ])

  if (!examResponse.data) {
    redirect(PATH.TEACHER_CLASSES)
  }

  return (
    <ExamSettingsView
      exam={examResponse.data}
      specification={specificationResponse.data ?? null}
      templateManagement={versionsResponse.data ?? null}
    />
  )
}
