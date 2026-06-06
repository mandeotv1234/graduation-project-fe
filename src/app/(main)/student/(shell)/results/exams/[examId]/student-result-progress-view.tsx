'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { StudentExamResultResponse } from '@/lib/types'
import { cn, formatDateTime } from '@/lib/utils'

type ProgressSummary = {
  examTitle: string
  attempts: StudentExamResultResponse[]
  first: StudentExamResultResponse
  latest: StudentExamResultResponse
  best: StudentExamResultResponse
  averageScore: number
  improvementFromFirst: number
  latestDelta: number | null
}

export function StudentResultProgressView({
  attempts
}: {
  attempts: StudentExamResultResponse[]
}) {
  const router = useRouter()
  const [showDeniedDialog, setShowDeniedDialog] = useState(false)

  const summary = useMemo<ProgressSummary>(() => {
    const sortedAttempts = [...attempts].sort(
      (a, b) => a.attemptNumber - b.attemptNumber
    )
    const first = sortedAttempts[0]
    const latest = sortedAttempts.reduce((current, item) =>
      new Date(item.submittedAt).getTime() >
      new Date(current.submittedAt).getTime()
        ? item
        : current
    )
    const best = sortedAttempts.reduce((current, item) =>
      scorePercent(item) > scorePercent(current) ? item : current
    )
    const averageScore =
      sortedAttempts.reduce((sum, item) => sum + item.totalScore, 0) /
      sortedAttempts.length
    const latestIndex = sortedAttempts.findIndex(
      (item) => item.id === latest.id
    )
    const previous = latestIndex > 0 ? sortedAttempts[latestIndex - 1] : null

    return {
      examTitle: first.examTitle,
      attempts: sortedAttempts,
      first,
      latest,
      best,
      averageScore,
      improvementFromFirst: scorePercent(latest) - scorePercent(first),
      latestDelta: previous
        ? scorePercent(latest) - scorePercent(previous)
        : null
    }
  }, [attempts])

  const reversedAttempts = [...summary.attempts].reverse()

  const handleOpenAttempt = (attempt: StudentExamResultResponse) => {
    if (!attempt.allowReview) {
      setShowDeniedDialog(true)
      return
    }
    router.push(PATH.STUDENT_EXAM_RESULT(attempt.id))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      <div className="space-y-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-fit pl-0! hover:bg-transparent"
        >
          <Link href={PATH.STUDENT_EXAM_RESULTS}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
        </Button>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Tổng quan qua các lần thi
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {summary.examTitle}
          </h1>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
        <div className="flex flex-col gap-2 border-b border-outline-variant/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-on-surface">
            Theo dõi điểm số qua từng lần thi.
          </h2>
          <ProgressTone improvement={summary.improvementFromFirst} />
        </div>

        <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-b border-outline-variant/25 p-5 lg:border-b-0 lg:border-r">
            <div className="mb-5">
              <p className="text-sm font-semibold text-on-surface">
                Tổng quan kết quả
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Tính theo các lần thi đã hoàn thành.
              </p>
            </div>
            <div className="divide-y divide-outline-variant/20">
              <SummaryMetric
                label="Điểm cao nhất"
                value={formatScore(summary.best.totalScore)}
                suffix="điểm"
                sub={`Lần ${summary.best.attemptNumber}`}
              />
              <SummaryMetric
                label="Điểm trung bình"
                value={formatScore(summary.averageScore)}
                suffix="điểm"
                sub={`${summary.attempts.length} lần thi`}
              />
              <SummaryMetric
                label="Số lần thi"
                value={`${summary.attempts.length}`}
                suffix="lần"
                sub={getAttemptLimitText(summary.attempts.length)}
              />
              <SummaryMetric
                label="Mức độ cải thiện"
                value={formatImprovement(summary.improvementFromFirst)}
                suffix="%"
                sub="So với lần đầu"
                tone={
                  summary.improvementFromFirst > 0
                    ? 'positive'
                    : summary.improvementFromFirst < 0
                      ? 'negative'
                      : 'neutral'
                }
              />
            </div>
          </aside>

          <div className="min-w-0 overflow-x-auto px-5 py-5">
            <ScoreTrendChart attempts={summary.attempts} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-foreground">
            Điểm số các lần thi
            <span className="ml-2 text-xs font-medium float-right text-muted-foreground">
              Thang điểm {formatScore(summary.best.maxScore)}
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Lần thi</th>
                <th className="px-5 py-3 text-left font-semibold">Ngày thi</th>
                <th className="px-5 py-3 text-left font-semibold">Điểm số</th>
                <th className="px-5 py-3 text-left font-semibold">Thay đổi</th>
                <th className="px-5 py-3 text-left font-semibold">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reversedAttempts.map((attempt) => {
                const index = summary.attempts.findIndex(
                  (item) => item.id === attempt.id
                )
                const previous = index > 0 ? summary.attempts[index - 1] : null
                const delta = previous
                  ? scorePercent(attempt) - scorePercent(previous)
                  : null

                return (
                  <tr
                    key={attempt.id}
                    className="cursor-pointer transition-colors hover:bg-muted/45"
                    onClick={() => handleOpenAttempt(attempt)}
                  >
                    <td className="px-5 py-3 font-medium">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>Lần {attempt.attemptNumber}</span>
                        {attempt.id === summary.best.id && (
                          <Badge className="bg-emerald-600 text-[10px]">
                            Tốt nhất
                          </Badge>
                        )}
                        {attempt.id === summary.latest.id && (
                          <Badge variant="secondary" className="text-[10px]">
                            Mới nhất
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDateTime(attempt.submittedAt)}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {formatScore(attempt.totalScore)} điểm
                    </td>
                    <td className="px-5 py-3">
                      <AttemptDelta delta={delta} />
                    </td>
                    <td className="px-5 py-3">
                      <AttemptStatus attempt={attempt} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AlertDialog open={showDeniedDialog} onOpenChange={setShowDeniedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Không thể xem lại bài làm
            </AlertDialogTitle>
            <AlertDialogDescription>
              Giáo viên đã tắt quyền xem chi tiết kết quả cho bài thi này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDeniedDialog(false)}>
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ScoreTrendChart({
  attempts
}: {
  attempts: StudentExamResultResponse[]
}) {
  const chart = buildChart(attempts)

  return (
    <div className="min-w-[560px]">
      <svg
        viewBox="0 0 720 260"
        role="img"
        aria-label="Biểu đồ xu hướng điểm"
        className="h-72 w-full"
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
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              className="fill-background stroke-primary"
              strokeWidth="3"
            />
            {point.showLabel && (
              <text
                x={point.x}
                y={chart.bottom + 28}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                Lần {point.attemptNumber}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

function buildChart(attempts: StudentExamResultResponse[]) {
  const left = 52
  const right = 690
  const top = 22
  const bottom = 206
  const plotHeight = bottom - top
  const maxScore = Math.max(...attempts.map((attempt) => attempt.maxScore), 1)
  const xStep = attempts.length > 1 ? (right - left) / (attempts.length - 1) : 0

  // Show at most ~12 x-axis labels so they never overlap. Always keep the
  // first and last attempt labelled.
  const maxLabels = 12
  const lastIndex = attempts.length - 1
  const labelStep = Math.max(1, Math.ceil(attempts.length / maxLabels))

  return {
    left,
    right,
    top,
    bottom,
    plotHeight,
    maxScore,
    points: attempts.map((attempt, index) => ({
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      x: attempts.length > 1 ? left + index * xStep : (left + right) / 2,
      y: bottom - (attempt.totalScore / maxScore) * plotHeight,
      showLabel: index % labelStep === 0 || index === lastIndex
    }))
  }
}

function SummaryMetric({
  label,
  value,
  suffix,
  sub,
  tone = 'neutral'
}: {
  label: string
  value: string
  suffix: string
  sub: string
  tone?: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_2.25rem] items-center gap-2 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-on-surface-variant">
          {label}
        </p>
        <p className="mt-1 truncate text-xs text-on-surface-variant">{sub}</p>
      </div>
      <span
        className={cn(
          'text-right text-xl font-bold tabular-nums text-on-surface',
          tone === 'positive' && 'text-primary',
          tone === 'negative' && 'text-error'
        )}
      >
        {value}
      </span>
      <span className="text-left text-xs font-medium text-on-surface-variant">
        {suffix}
      </span>
    </div>
  )
}

function AttemptStatus({ attempt }: { attempt: StudentExamResultResponse }) {
  if (!attempt.allowReview) {
    return <Badge variant="outline">Không xem chi tiết</Badge>
  }

  if (attempt.status === 'COMPLETED') {
    return <Badge className="bg-emerald-600">Đã chấm</Badge>
  }

  return <Badge variant="secondary">Đang xử lý</Badge>
}

function ProgressTone({ improvement }: { improvement: number }) {
  if (improvement > 0) {
    return (
      <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
        Đang tiến bộ
      </span>
    )
  }

  if (improvement < 0) {
    return (
      <span className="w-fit rounded-full bg-error-container/15 px-2.5 py-1 text-xs font-semibold text-error">
        Cần xem lại
      </span>
    )
  }

  return (
    <span className="w-fit rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
      Chưa thay đổi
    </span>
  )
}

function AttemptDelta({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-muted-foreground">Mốc ban đầu</span>
  }

  const rounded = Math.round(delta)
  if (rounded > 0) {
    return (
      <span className="font-medium text-emerald-600 dark:text-emerald-400">
        +{rounded}%
      </span>
    )
  }

  if (rounded < 0) {
    return (
      <span className="font-medium text-red-600 dark:text-red-400">
        {rounded}%
      </span>
    )
  }

  return <span className="text-muted-foreground">0%</span>
}

function scorePercent(result: StudentExamResultResponse) {
  if (!result.maxScore) return 0
  return (result.totalScore / result.maxScore) * 100
}

function formatScore(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}

function formatImprovement(value: number) {
  if (Math.abs(value) < 0.01) return '0'
  return `${value > 0 ? '+' : ''}${Math.round(value)}`
}

function getAttemptLimitText(attemptCount: number) {
  return attemptCount > 1 ? 'Đã có dữ liệu so sánh' : 'Chưa đủ dữ liệu so sánh'
}
