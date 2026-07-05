'use client'

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  XCircle
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { testGradeSelectData } from '@/lib/actions'
import { GradingRubric, SelectQueryGradingPayload } from '@/lib/types'
import { cn } from '@/lib/utils'

import { TeacherSqlEditor } from './teacher-sql-editor'

interface GradeDetail {
  type: string
  message: string
  points: number
}

interface GradeResult {
  totalPoints: number
  earnedPoints: number
  allPassed: boolean
  details: GradeDetail[]
  blackboxScore?: number | null
  whiteboxDeduction?: number | null
  finalScore?: number | null
}

interface SelectQueryTestGraderProps {
  rubric: GradingRubric | null
  correctQuery?: string
  examId: number
  totalPoints?: number
}

function isWhiteboxDetail(detail: GradeDetail): boolean {
  return detail.message.startsWith('[Whitebox]')
}

function stripWhiteboxPrefix(message: string): string {
  return message.replace(/^\[Whitebox\]\s*/, '')
}

function isWhiteboxSummaryDetail(detail: GradeDetail): boolean {
  const message = stripWhiteboxPrefix(detail.message).trim()
  return (
    /^Tổng trừ\s+/i.test(message) ||
    /^Total\s+whitebox\s+deduction/i.test(message)
  )
}

export function SelectQueryTestGrader({
  rubric,
  correctQuery,
  examId,
  totalPoints
}: SelectQueryTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [isGrading, setIsGrading] = useState(false)

  const payload = rubric?.grading_payload as
    | SelectQueryGradingPayload
    | undefined
  const whiteboxRules = Array.isArray(payload?.whitebox_rules)
    ? payload.whitebox_rules
    : []
  const hasBlackbox =
    Array.isArray(payload?.test_cases) && payload.test_cases.length > 0
  const hasCorrectQuery = Boolean(correctQuery?.trim())
  const canBlackbox = hasBlackbox || hasCorrectQuery
  const hasWhitebox = whiteboxRules.length > 0
  const hasRubric =
    rubric?.question_category === 'SELECT_QUERY' && (canBlackbox || hasWhitebox)

  const rubricTotalPoints =
    typeof rubric?.total_points === 'number' &&
    Number.isFinite(rubric.total_points)
      ? rubric.total_points
      : 1
  const effectiveTotalPoints =
    typeof totalPoints === 'number' && Number.isFinite(totalPoints)
      ? totalPoints
      : rubricTotalPoints

  const handleTest = async () => {
    if (!rubric || !studentSql.trim()) return
    setIsGrading(true)
    setResult(null)

    try {
      const res = await testGradeSelectData(examId, {
        studentQuery: studentSql.trim(),
        correctQuery: correctQuery?.trim() || '',
        gradingRubric: JSON.stringify(rubric),
        totalPoints: effectiveTotalPoints
      })

      if (res.data) {
        setResult(res.data as GradeResult)
      } else {
        toast.error(res.message || 'Lỗi chấm kết quả')
      }
    } catch {
      toast.error('Lỗi kết nối khi chấm kết quả.')
    } finally {
      setIsGrading(false)
    }
  }

  if (!hasRubric) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-500" />
        Cần tạo test case hoặc thêm quy tắc cách viết trước khi chấm thử.
      </div>
    )
  }

  const allWhiteboxDetails = result?.details.filter(isWhiteboxDetail) ?? []
  const whiteboxDetails = allWhiteboxDetails.filter(
    (detail) => !isWhiteboxSummaryDetail(detail)
  )
  const blackboxDetails =
    result?.details.filter((d) => !isWhiteboxDetail(d)) ?? []
  const whiteboxDeduction =
    result?.whiteboxDeduction ??
    allWhiteboxDetails.reduce(
      (total, detail) => total + Math.abs(Math.min(0, detail.points)),
      0
    )
  const blackboxScore = result
    ? (result.blackboxScore ??
      Math.min(result.totalPoints, result.earnedPoints + whiteboxDeduction))
    : 0
  const finalScore = result?.finalScore ?? result?.earnedPoints ?? null
  const scorePercent = result
    ? (result.earnedPoints / result.totalPoints) * 100
    : 0

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          SQL của sinh viên (lệnh SELECT QUERY)
        </label>
        <div className="h-40 overflow-hidden rounded-md border border-border bg-sub-background">
          <TeacherSqlEditor
            value={studentSql}
            onChange={(value) => {
              setStudentSql(value || '')
              setResult(null)
            }}
            height="100%"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleTest}
          disabled={!studentSql.trim() || isGrading}
          className="gap-2"
        >
          {isGrading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang chấm...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Chấm giả lập
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {canBlackbox && hasWhitebox
            ? 'Chấm đầy đủ: kết quả + quy tắc cách viết.'
            : canBlackbox
              ? 'Chỉ chấm kết quả (chưa có quy tắc cách viết).'
              : 'Chỉ có quy tắc cách viết; cần đáp án mẫu hoặc test case để chấm thử chung.'}
        </span>
      </div>

      {result && finalScore != null && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/40 px-4 py-2 text-sm dark:border-violet-900/40 dark:bg-violet-950/10">
          Điểm cuối dự kiến:{' '}
          <span className="font-bold">{finalScore.toFixed(2)}</span> /{' '}
          {result.totalPoints.toFixed(2)}
          {whiteboxDeduction > 0 && (
            <span className="text-muted-foreground">
              {' '}
              (kết quả {blackboxScore.toFixed(2)} - trừ quy tắc{' '}
              {whiteboxDeduction.toFixed(2)})
            </span>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-3 duration-300 animate-in fade-in-0 slide-in-from-top-2">
          <div
            className={cn(
              'rounded-lg border p-4',
              scorePercent >= 90
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : scorePercent >= 50
                  ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-red-500/20 bg-red-500/5'
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                Kết quả truy vấn
              </span>
              <span
                className={cn(
                  'text-2xl font-extrabold',
                  scorePercent >= 90
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : scorePercent >= 50
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                )}
              >
                {Number(result.earnedPoints).toFixed(2)} /{' '}
                {result.totalPoints.toFixed(2)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  scorePercent >= 90
                    ? 'bg-emerald-500'
                    : scorePercent >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                )}
                style={{ width: `${Math.min(100, scorePercent)}%` }}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Chi tiết vết chấm từng test case
              </span>
              <Badge
                variant="secondary"
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
              >
                {blackboxDetails.length}
              </Badge>
            </div>
            <div className="max-h-[300px] divide-y divide-border overflow-y-auto">
              {blackboxDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-muted/20"
                >
                  {detail.type === 'success' && (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  )}
                  {detail.type === 'warning' && (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  )}
                  {detail.type === 'error' && (
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  )}
                  {detail.type === 'info' && (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  )}
                  <span className="wrap-break-word flex-1 text-foreground">
                    {detail.message}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-mono font-bold',
                      detail.points > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : detail.points < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                    )}
                  >
                    {detail.points > 0 ? '+' : ''}
                    {detail.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {whiteboxDetails.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-violet-200 bg-card duration-300 animate-in fade-in-0 slide-in-from-top-2 dark:border-violet-900/40">
              <div className="flex items-center justify-between border-b border-border bg-violet-50/60 px-4 py-2.5 dark:bg-violet-950/20">
                <span className="text-sm font-bold text-foreground">
                  Quy tắc cách viết câu lệnh
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  -{whiteboxDeduction.toFixed(2)}đ
                </span>
              </div>
              <div className="divide-y divide-border">
                {whiteboxDetails.map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 px-4 py-2.5 text-xs"
                  >
                    {detail.type === 'error' ? (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <span className="flex-1 text-foreground">
                      {stripWhiteboxPrefix(detail.message)}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 font-mono font-bold',
                        detail.points < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                      )}
                    >
                      {detail.points < 0 ? detail.points.toFixed(2) : '0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
