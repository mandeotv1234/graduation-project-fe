import { SubmissionDetailView } from '../components/submission-detail-view'
import { getTeacherSubmissionDetail } from '@/lib/actions'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    examId: string
    submissionId: string
  }>
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { examId: examIdStr, submissionId: submissionIdStr } = await params
  const examId = parseInt(examIdStr)
  const submissionId = parseInt(submissionIdStr)

  if (isNaN(examId) || isNaN(submissionId)) {
    notFound()
  }

  try {
    const response = await getTeacherSubmissionDetail(examId, submissionId)
    const detail = response.data

    if (!detail) {
      notFound()
    }

    return (
      <SubmissionDetailView
        examId={examId}
        submissionId={submissionId}
        detail={detail}
      />
    )
  } catch (error) {
    console.error('[PAGE] Failed to load submission details:', error)
    notFound()
  }
}
