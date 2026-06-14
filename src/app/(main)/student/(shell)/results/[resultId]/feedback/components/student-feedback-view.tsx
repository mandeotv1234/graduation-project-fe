import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  ListChecks,
  Sparkles,
  Target,
  TriangleAlert
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import type {
  StudentFeedbackAttemptPoint,
  StudentFeedbackResponse,
  StudentQuestionFeedback
} from '@/lib/types'
import { cn, formatDateTime } from '@/lib/utils'

interface StudentFeedbackViewProps {
  feedback: StudentFeedbackResponse
}

export function StudentFeedbackView({ feedback }: StudentFeedbackViewProps) {
  const scorePercent = toPercent(feedback.totalScore, feedback.maxScore)
  const progress = feedback.progress

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={PATH.STUDENT_EXAM_RESULT(feedback.resultId)}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại kết quả
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={PATH.STUDENT_EXAM_RESULT_PROGRESS(feedback.examId)}>
              <BarChart3 className="h-4 w-4" />
              Tổng quan bài thi
            </Link>
          </Button>
          <Badge
            variant={feedback.generatedByAi ? 'default' : 'secondary'}
            className="h-8 gap-1.5 px-3"
          >
            {feedback.generatedByAi ? (
              <Sparkles className="h-3.5 w-3.5" />
            ) : (
              <ListChecks className="h-3.5 w-3.5" />
            )}
            {feedback.generatedByAi ? 'AI feedback' : 'Trace feedback'}
          </Badge>
        </div>
      </div>

      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Feedback sau khi chấm
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {feedback.examTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          Lần {feedback.attemptNumber} · Nộp lúc{' '}
          {formatDateTime(feedback.submittedAt)}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-2 lg:self-start">
          <section className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Điểm hiện tại
            </p>
            <div
              className={cn(
                'mt-2 text-4xl font-black',
                scoreTone(scorePercent)
              )}
            >
              {formatScore(feedback.totalScore)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              / {formatScore(feedback.maxScore)} điểm ·{' '}
              {Math.round(scorePercent)}%
            </p>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <Target className="h-4 w-4 text-primary" />
              Tiến độ
            </div>
            <div className="space-y-3">
              <MetricRow
                label="Số lần thi"
                value={`${progress.attemptCount}`}
                suffix="lần"
              />
              <MetricRow
                label="Điểm cao nhất"
                value={formatScore(progress.bestScore)}
                suffix="đ"
              />
              <MetricRow
                label="Điểm trung bình"
                value={formatScore(progress.averageScore)}
                suffix="đ"
              />
              <MetricRow
                label="So với lần đầu"
                value={formatDelta(progress.improvementFromFirstPercent)}
                tone={progress.improvementFromFirstPercent}
              />
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Nhận xét tổng quan
            </div>
            <p className="leading-relaxed text-foreground">
              {feedback.overallFeedback}
            </p>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <BarChart3 className="h-5 w-5 text-primary" />
                Sự tiến bộ
              </div>
              {progress.currentAttemptDeltaPercent !== null && (
                <Badge
                  variant="outline"
                  className={cn(
                    'w-fit',
                    progress.currentAttemptDeltaPercent > 0 &&
                      'border-emerald-300 text-emerald-700 dark:text-emerald-300',
                    progress.currentAttemptDeltaPercent < 0 &&
                      'border-red-300 text-red-700 dark:text-red-300'
                  )}
                >
                  {formatDelta(progress.currentAttemptDeltaPercent)} so với lần
                  trước
                </Badge>
              )}
            </div>
            <p className="mb-5 leading-relaxed text-foreground">
              {feedback.progressFeedback}
            </p>
            <AttemptTrend attempts={progress.attempts} />
          </section>

          <div className="grid gap-5 xl:grid-cols-3">
            <FeedbackList
              title="Điểm mạnh"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              items={feedback.strengths}
              tone="positive"
            />
            <FeedbackList
              title="Cần cải thiện"
              icon={<TriangleAlert className="h-5 w-5 text-amber-600" />}
              items={feedback.weaknesses}
              tone="warning"
            />
            <FeedbackList
              title="Hướng ôn tập"
              icon={<Lightbulb className="h-5 w-5 text-primary" />}
              items={feedback.studyAdvice}
              tone="neutral"
            />
          </div>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Feedback từng câu
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dựa trên điểm, lỗi thực thi và grading trace của lần thi này.
              </p>
            </div>

            {feedback.questionFeedbacks.map((question) => (
              <QuestionFeedbackCard
                key={question.questionId}
                question={question}
              />
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  suffix,
  tone = 0
}: {
  label: string
  value: string
  suffix?: string
  tone?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-right text-sm font-bold tabular-nums',
          tone > 0 && 'text-emerald-600 dark:text-emerald-400',
          tone < 0 && 'text-red-600 dark:text-red-400'
        )}
      >
        {value}
        {suffix ? (
          <span className="ml-1 text-xs font-medium">{suffix}</span>
        ) : null}
      </span>
    </div>
  )
}

function AttemptTrend({
  attempts
}: {
  attempts: StudentFeedbackAttemptPoint[]
}) {
  const chart = buildChart(attempts)

  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/20">
      <svg
        viewBox="0 0 720 230"
        role="img"
        aria-label="Xu hướng điểm qua các lần thi"
        className="h-64 min-w-[640px] w-full"
      >
        {[0, 1, 2, 3, 4].map((line) => {
          const y = chart.top + (chart.plotHeight / 4) * line
          const value = chart.maxScore - (chart.maxScore / 4) * line

          return (
            <g key={line}>
              <line
                x1={chart.left}
                x2={chart.right}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth="1"
              />
              <text
                x={chart.left - 12}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[11px]"
              >
                {formatScore(value)}
              </text>
            </g>
          )
        })}

        <polyline
          points={chart.points
            .map((point) => `${point.x},${point.y}`)
            .join(' ')}
          fill="none"
          className="stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chart.points.map((point) => (
          <g key={point.resultId}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              className="fill-background stroke-primary"
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={chart.bottom + 25}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              Lần {point.attemptNumber}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function FeedbackList({
  title,
  icon,
  items,
  tone
}: {
  title: string
  icon: ReactNode
  items: string[]
  tone: 'positive' | 'warning' | 'neutral'
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed">
            <span
              className={cn(
                'mt-2 h-1.5 w-1.5 shrink-0 rounded-full',
                tone === 'positive' && 'bg-emerald-500',
                tone === 'warning' && 'bg-amber-500',
                tone === 'neutral' && 'bg-primary'
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function QuestionFeedbackCard({
  question
}: {
  question: StudentQuestionFeedback
}) {
  const percent = toPercent(question.scoreEarned, question.maxPoints)

  return (
    <article className="rounded-lg border bg-card p-5">
      <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-foreground">
              Câu {question.orderIndex}
            </h3>
            <Badge variant="secondary" className="text-[10px] uppercase">
              {question.questionType}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {question.diagnosis}
          </p>
        </div>
        <div
          className={cn(
            'w-fit shrink-0 rounded-full border px-3 py-1 text-sm font-bold',
            scoreTone(percent),
            percent >= 70
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
              : percent >= 50
                ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
                : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
          )}
        >
          {formatScore(question.scoreEarned)} /{' '}
          {formatScore(question.maxPoints)}đ
        </div>
      </header>

      <div className="grid gap-4 pt-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
            Lỗi cần xem
          </p>
          <BulletList
            items={question.mistakes}
            emptyText="Không có lỗi cụ thể trong trace."
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
            Cách ôn
          </p>
          <BulletList
            items={question.advice}
            emptyText="Tiếp tục luyện thêm test case tương tự."
          />
        </div>
      </div>

      {question.evidence.length > 0 && (
        <div className="mt-4 rounded-lg border bg-muted/30 p-4">
          <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">
            Bằng chứng chấm điểm
          </p>
          <div className="space-y-3">
            {question.evidence.map((item, index) => (
              <div
                key={`${item.kind}-${item.status}-${index}`}
                className="text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={item.status === 'FAIL' ? 'destructive' : 'outline'}
                    className="text-[10px]"
                  >
                    {item.status}
                  </Badge>
                  <span className="font-semibold">
                    {item.label || item.kind}
                  </span>
                  {item.deductedPoints ? (
                    <span className="text-xs text-red-600 dark:text-red-400">
                      -{formatScore(item.deductedPoints)}đ
                    </span>
                  ) : null}
                </div>
                {item.message ? (
                  <p className="mt-1 break-words text-muted-foreground">
                    {item.message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function BulletList({
  items,
  emptyText
}: {
  items: string[]
  emptyText: string
}) {
  const values = items.length > 0 ? items : [emptyText]

  return (
    <ul className="space-y-2">
      {values.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function buildChart(attempts: StudentFeedbackAttemptPoint[]) {
  const left = 52
  const right = 688
  const top = 24
  const bottom = 178
  const plotHeight = bottom - top
  const maxScore = Math.max(...attempts.map((attempt) => attempt.maxScore), 1)
  const xStep = attempts.length > 1 ? (right - left) / (attempts.length - 1) : 0

  return {
    left,
    right,
    top,
    bottom,
    plotHeight,
    maxScore,
    points: attempts.map((attempt, index) => ({
      resultId: attempt.resultId,
      attemptNumber: attempt.attemptNumber,
      x: attempts.length > 1 ? left + index * xStep : (left + right) / 2,
      y: bottom - (attempt.totalScore / maxScore) * plotHeight
    }))
  }
}

function toPercent(score: number, maxScore: number) {
  if (!maxScore) return 0
  return (score / maxScore) * 100
}

function scoreTone(percent: number) {
  if (percent >= 70) return 'text-emerald-600 dark:text-emerald-400'
  if (percent >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function formatDelta(value: number) {
  const rounded = Math.round(value)
  if (rounded > 0) return `+${rounded}%`
  return `${rounded}%`
}

function formatScore(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}
