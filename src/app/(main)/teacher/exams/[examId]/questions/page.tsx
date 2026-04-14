import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  getExamQuestionsByExamId,
  getTeacherExamDetail,
  getExamSpecification,
  getTeacherExamTemplateVersions
} from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { ExamQuestionsView } from '@/app/(main)/teacher/exams/[examId]/questions/components/exam-questions-view'

interface ExamQuestionsPageProps {
  params: Promise<{ examId: string }>
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ examId: string }>
}): Promise<Metadata> {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    return { title: 'Câu hỏi bài thi' }
  }

  try {
    const examRes = await getTeacherExamDetail(examIdNum)
    const examTitle = examRes.data?.title

    return {
      title: examTitle
        ? `${examTitle} - Câu hỏi`
        : `Bài thi ${examId} - Câu hỏi`
    }
  } catch {
    return { title: `Bài thi ${examId} - Câu hỏi` }
  }
}

export default async function ExamQuestionsPage({
  params
}: ExamQuestionsPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const [questionsResponse, templateManagementResponse, specificationResponse] =
    await Promise.all([
      getExamQuestionsByExamId(examIdNum),
      getTeacherExamTemplateVersions(examIdNum),
      getExamSpecification(examIdNum)
    ])
  const questions = questionsResponse.data || []
  const hasValidSpecification = Boolean(specificationResponse.data)
  const shareDisabledReason = !hasValidSpecification
    ? 'Cần tạo đặc tả CSDL trước khi chia sẻ'
    : questions.length === 0
      ? 'Cần có ít nhất một câu hỏi trước khi chia sẻ'
      : undefined

  return (
    <ExamQuestionsView
      examId={examIdNum}
      initialQuestions={questions}
      specification={specificationResponse.data ?? null}
      templateManagement={templateManagementResponse.data ?? null}
      canShareTemplate={hasValidSpecification && questions.length > 0}
      shareDisabledReason={shareDisabledReason}
      specificationSchemaJson={specificationResponse.data?.schemaJson ?? null}
      specificationDatasets={specificationResponse.data?.datasets ?? []}
    />
  )
}
