import { getMyResultDetail } from '@/lib/actions/student-exam.action'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Info,
  Clock,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { PATH } from '@/lib/constants'
import { cn, formatDateTime } from '@/lib/utils'

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

        <div className="space-y-4">
          {result.questionResults.map((q, index) => (
            <div
              key={q.questionId}
              className="bg-card border rounded-xl overflow-hidden"
            >
              <div className="p-5 border-b flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">
                    Câu {index + 1}
                  </span>
                  <p className="font-medium text-foreground">{q.content}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-bold',
                      q.isCorrect
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {q.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {q.scoreEarned} / {q.maxPoints} đ
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {q.questionType}
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-4 bg-muted/30">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    Câu truy vấn của bạn:
                  </label>
                  <pre className="p-4 rounded-lg bg-slate-950 text-slate-50 text-xs font-mono overflow-x-auto border border-white/10 shadow-inner">
                    {q.studentQuery || '-- Trống'}
                  </pre>
                </div>

                {q.correctQuery && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70 uppercase flex items-center gap-1.5">
                      Đáp án tham khảo:
                    </label>
                    <pre className="p-4 rounded-lg bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-mono overflow-x-auto border border-emerald-500/20">
                      {q.correctQuery}
                    </pre>
                  </div>
                )}

                {q.errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex gap-3">
                    <Info className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">
                        Lỗi thực thi:
                      </p>
                      <p className="text-xs text-red-600/80 font-mono break-all leading-relaxed">
                        {q.errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                {q.teacherComment && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1">
                      Nhận xét của giáo viên:
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300 italic">
                      "{q.teacherComment}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
