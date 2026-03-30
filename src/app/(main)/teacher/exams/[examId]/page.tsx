import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  getClassDetail,
  getExamQuestionsByExamId,
  getExamSpecification,
  getTeacherExamDetail,
  getTeacherExamTemplateVersions
} from '@/lib/actions'
import { TeacherExamDetailContent } from '@/app/(main)/teacher/exams/[examId]/components/teacher-exam-detail-content'
import { PATH } from '@/lib/constants'

type TeacherExamDetailPageProps = {
  params: Promise<{ examId: string }>
}

export async function generateMetadata({
  params
}: TeacherExamDetailPageProps): Promise<Metadata> {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    return { title: 'Chi tiet bai thi' }
  }

  try {
    const response = await getTeacherExamDetail(examIdNum)
    const examTitle = response.data?.title

    return {
      title: examTitle ? `${examTitle} - Tong quan` : `Bai thi ${examId}`
    }
  } catch {
    return { title: `Bai thi ${examId}` }
  }
}

export default async function TeacherExamDetailPage({
  params
}: TeacherExamDetailPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const examRes = await getTeacherExamDetail(examIdNum)
  const exam = examRes.data

  if (!exam) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const [classRes, questionCountRes, specRes, templateManagementRes] =
    await Promise.all([
      getClassDetail(exam.classId).catch(() => ({ data: undefined })),
      getExamQuestionsByExamId(examIdNum).catch(() => ({ data: [] })),
      getExamSpecification(examIdNum).catch(() => ({ data: undefined })),
      getTeacherExamTemplateVersions(examIdNum).catch(() => ({ data: null }))
    ])

  const classLabel = classRes.data?.classCode
    ? `Lop ${classRes.data.classCode}`
    : `Lop ${exam.classId}`

  const questions = questionCountRes.data ?? []
  const questionCount = questions.length
  const hasSpecification = Boolean(specRes.data)
  const canShareTemplate = hasSpecification && questionCount > 0
  const shareDisabledReason = !hasSpecification
    ? 'Cần tạo đặc tả CSDL trước khi chia sẻ'
    : questionCount === 0
      ? 'Cần có ít nhất một câu hỏi trước khi chia sẻ'
      : undefined
  const specificationLabel = specRes.data?.name
    ? `${specRes.data.name} (#${specRes.data.id})`
    : `#${exam.specificationId}`

  return (
    <TeacherExamDetailContent
      exam={exam}
      classLabel={classLabel}
      questionCount={questionCount}
      hasSpecification={hasSpecification}
      specificationLabel={specificationLabel}
      questions={questions}
      specification={specRes.data}
      templateManagement={templateManagementRes.data ?? null}
      canShareTemplate={canShareTemplate}
      shareDisabledReason={shareDisabledReason}
    />
  )
}
