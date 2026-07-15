import { SubmissionDetailView } from '../components/submission-detail-view'
import { getTeacherSubmissionDetail } from '@/lib/actions'
import Link from 'next/link'
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
  const resultId = parseInt(submissionIdStr)

  if (isNaN(examId) || isNaN(resultId)) {
    notFound()
  }

  try {
    const response = await getTeacherSubmissionDetail(examId, resultId)
    const detail = response.data

    if (!detail) {
      return (
        <ResultDetailUnavailable examId={examId} message={response.message} />
      )
    }

    return (
      <SubmissionDetailView
        examId={examId}
        resultId={resultId}
        detail={detail}
      />
    )
  } catch (error) {
    console.error('[PAGE] Failed to load submission details:', error)
    return <ResultDetailUnavailable examId={examId} />
  }
}

function ResultDetailUnavailable({
  examId,
  message
}: {
  examId: number
  message?: string
}) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
        Chưa tải được chi tiết
      </div>
      <h1 className="text-2xl font-semibold">Bài làm đang được cập nhật</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        {message ||
          'Hệ thống có thể đang chấm lại bài hoặc đồng bộ kết quả. Quay về danh sách để theo dõi trạng thái mới nhất.'}
      </p>
      <Link
        href={`/teacher/exams/${examId}/results`}
        className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
      >
        Quay lại danh sách kết quả
      </Link>
    </div>
  )
}
