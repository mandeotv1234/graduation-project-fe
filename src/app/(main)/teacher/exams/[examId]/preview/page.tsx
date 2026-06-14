import { redirect } from 'next/navigation'
import {
  getExamPreview,
  getPreviewExamQuestions
} from '@/lib/actions/preview.action'
import { PATH } from '@/lib/constants'
import { TeacherPreviewInterface } from './components/teacher-preview-interface/teacher-preview-interface'

type PreviewPageProps = {
  params: Promise<{ examId: string }>
}

export default async function TeacherExamPreviewPage({
  params
}: PreviewPageProps) {
  const { examId } = await params
  const examIdNum = Number(examId)

  if (isNaN(examIdNum)) {
    redirect(PATH.TEACHER_CLASSES)
  }

  const [examRes, questionsRes] = await Promise.all([
    getExamPreview(examIdNum).catch(() => ({ data: null })),
    getPreviewExamQuestions(examIdNum).catch(() => ({ data: [] }))
  ])

  const exam = examRes.data
  if (!exam) {
    redirect(PATH.TEACHER_EXAM_DETAIL(examIdNum))
  }

  const questions = questionsRes.data ?? []

  return <TeacherPreviewInterface exam={exam} questions={questions} />
}
