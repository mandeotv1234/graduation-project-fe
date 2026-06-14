import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMyResultFeedback } from '@/lib/actions/student-exam.action'
import { PATH } from '@/lib/constants'
import { StudentFeedbackView } from './components/student-feedback-view'

export default async function StudentFeedbackPage({
  params
}: {
  params: Promise<{ resultId: string }>
}) {
  const { resultId } = await params
  const parsedResultId = Number(resultId)

  if (!Number.isFinite(parsedResultId)) {
    return <FeedbackError message="Mã kết quả không hợp lệ." />
  }

  const response = await getMyResultFeedback(parsedResultId)

  if (response.code !== 'OK' || !response.data) {
    return (
      <FeedbackError
        message={response.message || 'Không thể tải feedback bài làm.'}
      />
    )
  }

  return <StudentFeedbackView feedback={response.data} />
}

function FeedbackError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div>
        <h1 className="text-2xl font-bold text-red-600">Lỗi</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
      </div>
      <Button asChild variant="outline">
        <Link href={PATH.STUDENT_EXAM_RESULTS}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
      </Button>
    </div>
  )
}
