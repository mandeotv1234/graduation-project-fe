'use client'

import { Badge } from '@/components/ui/badge'
import { WhiteboxRule } from '@/lib/types'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { ReactNode } from 'react'

export interface TestGradeDetail {
  type: string
  message: string
  points: number
}

export interface TestGradeResult {
  totalPoints: number
  earnedPoints: number
  allPassed: boolean
  totalDeductions?: number | null
  blackboxScore?: number | null
  whiteboxDeduction?: number | null
  finalScore?: number | null
  details: TestGradeDetail[]
}

interface TestGradeResultViewProps {
  result: TestGradeResult
  title?: string
  detailTitle?: string
  blackboxTitle?: string
  whiteboxTitle?: string
  whiteboxRules?: WhiteboxRule[]
  splitWhitebox?: boolean
  renderDetailPoints?: (detail: TestGradeDetail) => ReactNode
}

function DetailIcon({ type }: { type: string }) {
  if (type === 'success') {
    return (
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
    )
  }
  if (type === 'error') {
    return <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
  }
  if (type === 'info') {
    return (
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
    )
  }
  return (
    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
  )
}

function DetailPoints({ detail }: { detail: TestGradeDetail }) {
  return (
    <span
      className={`shrink-0 font-mono font-bold ${
        detail.points > 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : detail.points < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-muted-foreground'
      }`}
    >
      {detail.points > 0 ? '+' : ''}
      {Number(detail.points).toFixed(2)}
    </span>
  )
}

function cleanPanelTitle(title: string): string {
  return title
    .replace(/^Black-box:\s*/i, '')
    .replace(/^White-box:\s*/i, '')
    .replace(/^Black-box$/i, 'Chi tiết chấm thử')
    .replace(/^White-box$/i, 'Quy tắc cách viết')
}

function isWhiteboxSummary(detail: TestGradeDetail): boolean {
  const message = detail.message.replace(/^\[Whitebox\]\s*/, '').trim()
  return (
    /^Tổng trừ\s+/i.test(message) ||
    /^Total\s+whitebox\s+deduction/i.test(message)
  )
}

function DetailPanel({
  title,
  details,
  renderDetailPoints,
  normalizeMessage,
  headerMeta
}: {
  title: string
  details: TestGradeDetail[]
  renderDetailPoints?: (detail: TestGradeDetail) => ReactNode
  normalizeMessage?: (message: string) => string
  headerMeta?: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          {cleanPanelTitle(title)}
        </span>
        <Badge
          variant="secondary"
          className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
        >
          {details.length}
        </Badge>
        {headerMeta && <div className="ml-auto">{headerMeta}</div>}
      </div>
      <div className="max-h-[300px] divide-y divide-border overflow-y-auto">
        {details.map((detail, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-muted/20"
          >
            <DetailIcon type={detail.type} />
            <span className="flex-1 wrap-break-word text-foreground">
              {normalizeMessage
                ? normalizeMessage(detail.message)
                : detail.message}
            </span>
            {renderDetailPoints ? (
              renderDetailPoints(detail)
            ) : (
              <DetailPoints detail={detail} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TestGradeResultView({
  result,
  title = 'Điểm cuối dự kiến',
  detailTitle = 'Chi tiết chấm thử',
  blackboxTitle = 'Chi tiết chấm thử',
  whiteboxTitle = 'Quy tắc cách viết',
  splitWhitebox = true,
  renderDetailPoints
}: TestGradeResultViewProps) {
  const scorePercent =
    result.totalPoints > 0
      ? (result.earnedPoints / result.totalPoints) * 100
      : 0
  const allWhiteboxDetails = result.details.filter((detail) =>
    detail.message.startsWith('[Whitebox]')
  )
  const whiteboxDetails = allWhiteboxDetails.filter(
    (detail) => !isWhiteboxSummary(detail)
  )
  const blackboxDetails = result.details.filter(
    (detail) => !detail.message.startsWith('[Whitebox]')
  )
  const whiteboxDeduction =
    result.whiteboxDeduction ??
    allWhiteboxDetails.reduce(
      (total, detail) => total + Math.abs(Math.min(0, detail.points)),
      0
    )
  const blackboxScore =
    result.blackboxScore ??
    Math.min(result.totalPoints, result.earnedPoints + whiteboxDeduction)
  const shouldSplitWhitebox = splitWhitebox && whiteboxDetails.length > 0
  const primaryDetails = shouldSplitWhitebox ? blackboxDetails : result.details

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      <div
        className={`rounded-lg border p-4 ${
          scorePercent >= 90
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : scorePercent >= 50
              ? 'border-amber-500/20 bg-amber-500/5'
              : 'border-red-500/20 bg-red-500/5'
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-foreground">{title}</span>
          <span
            className={`text-2xl font-extrabold ${
              scorePercent >= 90
                ? 'text-emerald-600 dark:text-emerald-400'
                : scorePercent >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            }`}
          >
            {Number(result.earnedPoints).toFixed(2)} /{' '}
            {Number(result.totalPoints).toFixed(2)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              scorePercent >= 90
                ? 'bg-emerald-500'
                : scorePercent >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, scorePercent))}%` }}
          />
        </div>
        {(typeof result.blackboxScore === 'number' ||
          allWhiteboxDetails.length > 0 ||
          typeof result.whiteboxDeduction === 'number') && (
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <div className="rounded-md border border-border bg-background px-3 py-2">
              <div className="font-semibold text-foreground">
                {Number(blackboxScore).toFixed(2)}
              </div>
              <div>Kết quả</div>
            </div>
            <div className="rounded-md border border-border bg-background px-3 py-2">
              <div className="font-semibold text-red-600 dark:text-red-400">
                -{Number(whiteboxDeduction).toFixed(2)}
              </div>
              <div>Trừ quy tắc</div>
            </div>
            <div className="rounded-md border border-border bg-background px-3 py-2">
              <div className="font-semibold text-foreground">
                {Number(result.earnedPoints).toFixed(2)}
              </div>
              <div>Điểm cuối</div>
            </div>
          </div>
        )}
      </div>

      <DetailPanel
        title={shouldSplitWhitebox ? blackboxTitle : detailTitle}
        details={primaryDetails}
        renderDetailPoints={renderDetailPoints}
      />

      {shouldSplitWhitebox && (
        <DetailPanel
          title={whiteboxTitle}
          details={whiteboxDetails}
          normalizeMessage={(message) =>
            message.replace(/^\[Whitebox\]\s*/, '')
          }
          headerMeta={
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              -{Number(whiteboxDeduction).toFixed(2)}đ
            </span>
          }
        />
      )}
    </div>
  )
}
