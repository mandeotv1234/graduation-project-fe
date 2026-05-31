import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMyResults } from '@/lib/actions/student-exam.action'
import { PATH } from '@/lib/constants'
import { StudentResultProgressView } from './student-result-progress-view'

export default async function StudentResultProgressPage({
  params
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const parsedExamId = Number(examId)

  if (!Number.isFinite(parsedExamId)) {
    return <ResultProgressError message="Mã bài thi không hợp lệ." />
  }

  const response = await getMyResults({
    page: 0,
    size: 100,
    sortBy: 'SUBMITTED_AT',
    sortOrder: 'DESC'
  })

  if (response.code !== 'OK' || !response.data) {
    return (
      <ResultProgressError
        message={response.message || 'Không thể tải dữ liệu tiến bộ.'}
      />
    )
  }

  const attempts = response.data.data
    .filter((result) => result.examId === parsedExamId)
    .sort((a, b) => a.attemptNumber - b.attemptNumber)

  if (attempts.length === 0) {
    return (
      <ResultProgressError message="Không tìm thấy kết quả cho bài thi này." />
    )
  }

  return <StudentResultProgressView attempts={attempts} />
}

function ResultProgressError({ message }: { message: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 py-20 text-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Không thể mở phân tích kết quả
        </h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
      </div>
      <Button asChild variant="outline">
        <Link href={PATH.STUDENT_EXAM_RESULTS}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </Button>
    </div>
  )
}
