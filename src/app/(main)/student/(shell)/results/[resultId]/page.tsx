import { getMyResultDetail } from '@/lib/actions/student-exam.action'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Award } from 'lucide-react'
import Link from 'next/link'
import { PATH } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import { ResultQuestionList } from './components/result-question-list'

export default async function StudentResultDetailPage({
  params
}: {
  params: Promise<{ resultId: string }>
}) {
  const { resultId } = await params
  const response = await getMyResultDetail(parseInt(resultId))

  if (response.code !== 'OK' || !response.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold text-red-600">Lỗi</h1>
        <p className="text-muted-foreground">
          {response.message || 'Không thể tải chi tiết kết quả.'}
        </p>
        <Link href={PATH.STUDENT_EXAMS} className="mt-4">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Link>
      </div>
    )
  }

  const result = response.data

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Link href={PATH.STUDENT_EXAM_RESULTS}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
        <Badge
          variant={result.status === 'COMPLETED' ? 'default' : 'secondary'}
          className="px-3 py-1"
        >
          {result.status === 'COMPLETED' ? 'Đã chấm điểm' : 'Đang xử lý'}
        </Badge>
      </div>

      <div className="bg-card border rounded-2xl p-8 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Kết quả chi tiết
              </p>
              <h1 className="text-3xl font-bold mt-1">
                Lần thi thứ {result.attemptNumber}
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Nộp lúc: {formatDateTime(result.submittedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4" />
                <span>
                  Số câu đúng: {result.correctCount} / {result.totalQuestions}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end justify-center px-8 border-l border-border/50">
            <div className="text-5xl font-black text-primary">
              {result.totalScore}
            </div>
            <div className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-tighter">
              Trên {result.maxScore} điểm
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Chi tiết từng câu hỏi
        </h2>

        <ResultQuestionList questionResults={result.questionResults} />
      </div>
    </div>
  )
}
