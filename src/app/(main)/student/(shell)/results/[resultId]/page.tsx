import Link from 'next/link'
import { ArrowLeft, BarChart3, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getExamDetail,
  getMyResultDetail,
  getMyResults
} from '@/lib/actions/student-exam.action'
import { PATH } from '@/lib/constants'
import { cn, formatDateTime } from '@/lib/utils'
import { ResultQuestionList } from './components/result-question-list'
import { ResultSpecification } from './components/result-specification'

export default async function StudentResultDetailPage({
  params
}: {
  params: Promise<{ resultId: string }>
}) {
  const { resultId } = await params
  const parsedResultId = Number(resultId)

  if (!Number.isFinite(parsedResultId)) {
    return <ResultError message="Mã kết quả không hợp lệ." />
  }

  const response = await getMyResultDetail(parsedResultId)

  if (response.code !== 'OK' || !response.data) {
    return (
      <ResultError
        message={response.message || 'Không thể tải chi tiết kết quả.'}
      />
    )
  }

  const result = response.data
  const progressExamId = await resolveProgressExamId(
    parsedResultId,
    result.examId
  )
  const scorePercent = result.maxScore
    ? (result.totalScore / result.maxScore) * 100
    : 0

  const examDetail =
    progressExamId !== null
      ? ((await getExamDetail(progressExamId)).data ?? null)
      : null

  return (
    <div className="mx-auto max-w-7xl space-y-3 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={PATH.STUDENT_EXAM_RESULTS}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
        </Button>
        {progressExamId !== null && (
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-none"
            >
              <Link href={PATH.STUDENT_EXAM_RESULT_FEEDBACK(parsedResultId)}>
                <Sparkles className="h-4 w-4" />
                Xem feedback AI
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-none"
            >
              <Link
                href={PATH.STUDENT_EXAM_RESULT_PROGRESS(progressExamId)}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Xem tổng quan bài thi
              </Link>
            </Button>
          </div>
        )}
      </div>

      {progressExamId !== null && (
        <ResultSpecification
          examId={progressExamId}
          pdfFilePath={examDetail?.pdfFilePath}
          originalPdfFileName={examDetail?.originalPdfFileName}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-3 lg:sticky lg:top-1 lg:self-start">
          <section className="shrink-0 rounded-lg border bg-card px-4 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tổng điểm
            </p>
            <div
              className={cn(
                'mt-1 text-4xl font-black',
                scorePercent >= 70
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : scorePercent >= 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatScore(result.totalScore)}
            </div>
            <div className="mt-2 border-t pt-2 text-xs font-medium uppercase text-muted-foreground">
              Trên {formatScore(result.maxScore)} điểm
            </div>
          </section>

          <section className="shrink-0 space-y-2.5 rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>Lần thi: {result.attemptNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>Nộp lúc: {formatDateTime(result.submittedAt)}</span>
            </div>
            <Badge
              variant={result.status === 'COMPLETED' ? 'default' : 'secondary'}
              className="mt-1"
            >
              {result.status === 'COMPLETED' ? 'Đã chấm điểm' : 'Đang xử lý'}
            </Badge>
          </section>

          <section className="overflow-hidden rounded-lg border bg-card">
            <div className="border-b px-4 py-3 text-sm font-semibold">
              Danh sách câu hỏi
            </div>
            <div className="divide-y">
              {result.questionResults.map((question, index) => (
                <a
                  key={question.questionId}
                  href={`#question-${question.questionId}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/70"
                >
                  <span>Câu {index + 1}</span>
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-semibold',
                      question.isCorrect && !question.errorMessage
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'
                    )}
                  >
                    {formatScore(question.scoreEarned)} /{' '}
                    {formatScore(question.maxPoints)}
                  </span>
                </a>
              ))}
            </div>
          </section>
        </aside>

        <ResultQuestionList questionResults={result.questionResults} />
      </div>
    </div>
  )
}

async function resolveProgressExamId(resultId: number, examId?: number) {
  if (Number.isFinite(examId)) return Number(examId)

  const response = await getMyResults({
    page: 0,
    size: 1000,
    sortBy: 'SUBMITTED_AT',
    sortOrder: 'DESC'
  })

  if (response.code !== 'OK' || !response.data) return null

  const result = response.data.data.find((item) => item.id === resultId)
  return result?.examId ?? null
}

function ResultError({ message }: { message: string }) {
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

function formatScore(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}
