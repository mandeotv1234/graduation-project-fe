'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { PATH } from '@/lib/constants'
import type {
  TeacherStudentProgressExam,
  TeacherStudentProgressResponse,
  TeacherStudentProgressStatus
} from '@/lib/types'
import { cn, formatDateTime, parseBackendDate } from '@/lib/utils'

interface TeacherStudentProgressViewProps {
  progress: TeacherStudentProgressResponse
}

interface ProgressSummary {
  scoredExams: TeacherStudentProgressExam[]
  averageScore: number | null
  bestExam: TeacherStudentProgressExam | null
  improvement: number | null
  statusCounts: {
    scored: number
    processing: number
    notSubmitted: number
    issue: number
  }
  tableRows: TeacherStudentProgressExam[]
}

export function TeacherStudentProgressView({
  progress
}: TeacherStudentProgressViewProps) {
  const router = useRouter()
  const summary = useMemo(() => buildSummary(progress.exams), [progress.exams])

  const handleOpenResult = (item: TeacherStudentProgressExam) => {
    if (!item.selectedSubmissionId) return
    router.push(
      PATH.TEACHER_EXAM_RESULT(item.examId, item.selectedSubmissionId)
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-16">
      <section className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
        <div className="grid divide-y divide-outline-variant/25 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <StudentInfoItem
            label="Họ tên"
            value={progress.student.fullName}
            emphasis
          />
          <StudentInfoItem label="Email" value={progress.student.email} />
          <StudentInfoItem label="Lớp" value={progress.classCode} compact />
          <StudentInfoItem label="Học kỳ" value={progress.semester} compact />
        </div>
      </section>

      <section className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-5">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="font-semibold text-on-surface">
                Biểu đồ xu hướng điểm
              </h2>
              <p className="text-sm text-on-surface-variant">
                Mỗi điểm là một bài kiểm tra trong lớp.
              </p>
            </div>
            <ScoreTrendChart exams={summary.scoredExams} />
          </div>

          <div className="min-w-0">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="font-semibold text-on-surface">
                Tổng quan trạng thái
              </h2>
              <p className="text-sm text-on-surface-variant">
                Gồm điểm tổng quan và tỷ lệ trạng thái bài kiểm tra.
              </p>
            </div>
            <div className="mb-5 space-y-3 rounded-md bg-surface-container/45 px-4 py-3 text-sm">
              <SummaryRow
                label="Điểm trung bình"
                value={
                  summary.averageScore === null
                    ? '-'
                    : `${formatScore(summary.averageScore)} điểm`
                }
              />
              <SummaryRow
                label="Điểm cao nhất"
                value={
                  summary.bestExam
                    ? `${formatScore(summary.bestExam.finalScore)} điểm`
                    : '-'
                }
                detail={summary.bestExam?.title ?? 'Chưa có điểm'}
              />
              <SummaryRow
                label="Bài đã có điểm"
                value={`${summary.scoredExams.length}/${progress.exams.length}`}
              />
              <SummaryRow
                label="Mức cải thiện"
                value={
                  summary.improvement === null
                    ? '-'
                    : formatSignedScore(summary.improvement)
                }
                tone={getImprovementTone(summary.improvement)}
              />
            </div>
            <StatusDistribution
              total={progress.exams.length}
              counts={summary.statusCounts}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
        <div className="border-b border-outline-variant/30 px-5 py-4">
          <h2 className="font-semibold text-foreground">
            Lịch sử bài kiểm tra
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface-container-sub-low text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Tên bài kiểm tra</th>
                <th className="px-5 py-3 text-left">Ngày hoàn thành</th>
                <th className="px-5 py-3 text-left">Điểm</th>
                <th className="px-5 py-3 text-left">Cách tính</th>
                <th className="px-5 py-3 text-left">Số lần nộp</th>
                <th className="px-5 py-3 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/25">
              {summary.tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    Lớp chưa có bài kiểm tra nào.
                  </td>
                </tr>
              ) : (
                summary.tableRows.map((item) => (
                  <tr
                    key={item.examId}
                    className={cn(
                      'transition-colors',
                      item.selectedSubmissionId &&
                        'cursor-pointer hover:bg-surface-container-sub-low'
                    )}
                    onClick={() => handleOpenResult(item)}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.durationMinutes
                          ? `${item.durationMinutes} phút`
                          : 'Chưa có thời lượng'}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDateTime(item.latestSubmittedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-foreground">
                        {item.finalScore === null
                          ? '-'
                          : `${formatScore(item.finalScore)} điểm`}
                      </div>
                      {item.maxScore !== null && (
                        <div className="text-xs text-muted-foreground">
                          Thang {formatScore(item.maxScore)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {getGradingMethodLabel(item.gradingMethod)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {item.attemptCount}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StudentInfoItem({
  label,
  value,
  compact = false,
  emphasis = false
}: {
  label: string
  value: string
  compact?: boolean
  emphasis?: boolean
}) {
  return (
    <div className="min-w-0 px-5 py-4">
      <div className="text-xs font-semibold text-on-surface-variant">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 truncate font-semibold text-on-surface',
          emphasis
            ? 'text-2xl font-bold tracking-tight'
            : compact
              ? 'text-sm md:text-[15px]'
              : 'break-words text-sm md:text-[15px]'
        )}
      >
        {value}
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  detail,
  tone = 'neutral'
}: {
  label: string
  value: string
  detail?: string
  tone?: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <span className="min-w-0">
        <span className="block text-on-surface-variant">{label}</span>
        {detail ? (
          <span className="mt-0.5 block truncate text-xs text-on-surface-variant/75">
            {detail}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'shrink-0 text-right font-semibold text-on-surface',
          tone === 'positive' && 'text-primary',
          tone === 'negative' && 'text-error'
        )}
        title={detail}
      >
        {value}
      </span>
    </div>
  )
}

function ScoreTrendChart({ exams }: { exams: TeacherStudentProgressExam[] }) {
  if (exams.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md bg-surface-container text-sm text-on-surface-variant">
        Chưa có điểm để vẽ biểu đồ.
      </div>
    )
  }

  const chart = buildChart(exams)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 760 282"
          role="img"
          aria-label="Biểu đồ xu hướng điểm số qua các bài kiểm tra"
          className="h-72 min-w-[620px] w-full"
        >
          {chart.axisValues.map((value) => {
            const y = chart.bottom - (value / chart.maxScore) * chart.plotHeight
            return (
              <g key={value}>
                <line
                  x1={chart.left}
                  x2={chart.right}
                  y1={y}
                  y2={y}
                  className="stroke-outline-variant/35"
                  strokeWidth="1"
                />
                <text
                  x={chart.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-on-surface-variant text-[11px]"
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
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />

          {chart.points.map((point) => (
            <g key={point.examId}>
              <title>
                {point.title}: {formatScore(point.score)}
                {point.maxScore !== null
                  ? ` / ${formatScore(point.maxScore)}`
                  : ''}{' '}
                điểm
              </title>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                className="fill-primary-container stroke-primary"
                strokeWidth="3"
              />
              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                className="fill-on-surface text-[11px] font-semibold"
              >
                {formatScore(point.score)}
              </text>
              <text
                x={point.x}
                y={chart.bottom + 28}
                textAnchor="middle"
                className="fill-on-surface-variant text-[11px]"
              >
                Bài {point.index + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

function StatusDistribution({
  total,
  counts
}: {
  total: number
  counts: ProgressSummary['statusCounts']
}) {
  const segments = [
    {
      label: 'Đã có điểm',
      count: counts.scored,
      className: 'bg-primary'
    },
    {
      label: 'Đang chấm',
      count: counts.processing,
      className: 'bg-tertiary'
    },
    {
      label: 'Cần xem',
      count: counts.issue,
      className: 'bg-error-container'
    },
    {
      label: 'Chưa nộp',
      count: counts.notSubmitted,
      className: 'bg-surface-container-high'
    }
  ].filter((item) => item.count > 0)

  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-md bg-surface-container text-sm text-on-surface-variant">
        Chưa có bài kiểm tra.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-container">
        {segments.map((item) => (
          <div
            key={item.label}
            className={item.className}
            style={{ width: `${(item.count / total) * 100}%` }}
          />
        ))}
      </div>

      <div className="space-y-2">
        {segments.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn('h-2.5 w-2.5 rounded-full', item.className)}
              />
              <span className="text-on-surface-variant">{item.label}</span>
            </div>
            <span className="font-semibold text-on-surface">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: TeacherStudentProgressStatus }) {
  const config = getStatusConfig(status)

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}

function buildSummary(exams: TeacherStudentProgressExam[]): ProgressSummary {
  const scoredExams = exams.filter(isScoredExam)
  const tableRows = [...exams].sort(compareHistoryRows)
  const processingCount = exams.filter((item) =>
    isProcessingStatus(item.status)
  ).length
  const notSubmittedCount = exams.filter(
    (item) => item.status === 'NOT_SUBMITTED'
  ).length
  const issueCount = exams.filter((item) => isIssueStatus(item.status)).length
  const averageScore =
    scoredExams.length === 0
      ? null
      : scoredExams.reduce((sum, item) => sum + Number(item.finalScore), 0) /
        scoredExams.length
  const bestExam =
    scoredExams.length === 0
      ? null
      : scoredExams.reduce((best, item) =>
          Number(item.finalScore) > Number(best.finalScore) ? item : best
        )
  const firstScored = scoredExams[0]
  const latestScored = scoredExams[scoredExams.length - 1]
  const improvement =
    firstScored && latestScored
      ? Number(latestScored.finalScore) - Number(firstScored.finalScore)
      : null

  return {
    scoredExams,
    averageScore,
    bestExam,
    improvement,
    statusCounts: {
      scored: Math.max(
        0,
        exams.length - processingCount - notSubmittedCount - issueCount
      ),
      processing: processingCount,
      notSubmitted: notSubmittedCount,
      issue: issueCount
    },
    tableRows
  }
}

function buildChart(exams: TeacherStudentProgressExam[]) {
  const left = 52
  const right = 730
  const top = 24
  const bottom = 214
  const plotHeight = bottom - top
  const step = exams.length > 1 ? (right - left) / (exams.length - 1) : 0
  const maxScore = Math.max(
    ...exams.map((item) =>
      Math.max(Number(item.maxScore ?? 0), Number(item.finalScore ?? 0))
    ),
    1
  )

  return {
    left,
    right,
    top,
    bottom,
    plotHeight,
    maxScore,
    axisValues: [0, 1, 2, 3, 4].map((line) => maxScore - (maxScore / 4) * line),
    points: exams.map((item, index) => {
      const score = Number(item.finalScore ?? 0)
      return {
        examId: item.examId,
        index,
        title: item.title,
        score,
        maxScore: item.maxScore,
        x: exams.length > 1 ? left + step * index : (left + right) / 2,
        y: bottom - (score / maxScore) * plotHeight
      }
    })
  }
}

function compareHistoryRows(
  left: TeacherStudentProgressExam,
  right: TeacherStudentProgressExam
) {
  const leftTime = toTime(left.latestSubmittedAt)
  const rightTime = toTime(right.latestSubmittedAt)

  if (leftTime === null && rightTime === null) return 0
  if (leftTime === null) return 1
  if (rightTime === null) return -1
  return rightTime - leftTime
}

function toTime(value: string | null) {
  if (!value) return null
  const date = parseBackendDate(value)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function isScoredExam(item: TeacherStudentProgressExam) {
  return item.finalScore !== null && Number.isFinite(Number(item.finalScore))
}

function isProcessingStatus(status: TeacherStudentProgressStatus) {
  return status === 'PENDING' || status === 'GRADING'
}

function isIssueStatus(status: TeacherStudentProgressStatus) {
  return status === 'FAILED' || status === 'SYSTEM_ERROR'
}

function getStatusConfig(status: TeacherStudentProgressStatus) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Đã chấm',
        className: 'bg-primary/10 text-primary'
      }
    case 'PENDING':
    case 'GRADING':
      return {
        label: 'Đang chấm',
        className: 'bg-tertiary/15 text-tertiary'
      }
    case 'FAILED':
      return {
        label: 'Chấm lỗi',
        className: 'bg-error-container/15 text-error'
      }
    case 'SYSTEM_ERROR':
      return {
        label: 'Lỗi hệ thống',
        className: 'bg-error-container/15 text-error'
      }
    default:
      return {
        label: 'Chưa nộp',
        className: 'bg-secondary-container/15 text-on-surface-variant'
      }
  }
}

function getGradingMethodLabel(method: string) {
  switch (method) {
    case 'latest_score':
      return 'Lần nộp cuối'
    case 'average_score':
      return 'Trung bình'
    default:
      return 'Điểm cao nhất'
  }
}

function formatScore(value: number | null) {
  if (value === null || !Number.isFinite(Number(value))) return '-'
  const numericValue = Number(value)
  return Number.isInteger(numericValue)
    ? numericValue.toString()
    : numericValue.toFixed(1)
}

function formatSignedScore(value: number) {
  const formatted = formatScore(Math.abs(value))
  if (value > 0) return `+${formatted} điểm`
  if (value < 0) return `-${formatted} điểm`
  return '0 điểm'
}

function getImprovementTone(
  value: number | null
): 'positive' | 'negative' | 'neutral' {
  if (value === null || value === 0) return 'neutral'
  return value > 0 ? 'positive' : 'negative'
}
