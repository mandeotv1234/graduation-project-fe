'use client'

import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Play,
  XCircle
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { testGradeSelectData, validateWhitebox } from '@/lib/actions'
import {
  GradingRubric,
  SelectQueryGradingPayload,
  WhiteboxValidationResult
} from '@/lib/types'
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
}

interface SelectQueryTestGraderProps {
  rubric: GradingRubric | null
  correctQuery?: string
  examId: number
  totalPoints?: number
}

const WB_STYLE: Record<string, { icon: typeof CheckCircle2; cls: string }> = {
  FAIL: { icon: XCircle, cls: 'text-rose-600 dark:text-rose-400' },
  WARN: { icon: AlertTriangle, cls: 'text-amber-600 dark:text-amber-400' },
  UNVERIFIED: { icon: HelpCircle, cls: 'text-slate-500 dark:text-slate-400' }
}

export function SelectQueryTestGrader({
  rubric,
  correctQuery,
  examId,
  totalPoints
}: SelectQueryTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [blackbox, setBlackbox] = useState<GradeResult | null>(null)
  const [whitebox, setWhitebox] = useState<WhiteboxValidationResult | null>(
    null
  )
  const [isGrading, setIsGrading] = useState(false)

  const payload = rubric?.grading_payload as
    | SelectQueryGradingPayload
    | undefined
  const whiteboxRules = Array.isArray(payload?.whitebox_rules)
    ? payload!.whitebox_rules!
    : []
  const whiteboxSettings = payload?.whitebox_settings ?? {}
  const hasBlackbox =
    Array.isArray(payload?.test_cases) && payload!.test_cases.length > 0
  const hasWhitebox = whiteboxRules.length > 0
  const hasRubric =
    rubric?.question_category === 'SELECT_QUERY' && (hasBlackbox || hasWhitebox)

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
    setBlackbox(null)
    setWhitebox(null)

    await Promise.all([
      hasBlackbox
        ? testGradeSelectData(examId, {
            studentQuery: studentSql.trim(),
            correctQuery: correctQuery?.trim() || '',
            gradingRubric: JSON.stringify(rubric),
            totalPoints: effectiveTotalPoints
          })
            .then((res) =>
              res.data
                ? setBlackbox(res.data as GradeResult)
                : toast.error(res.message || 'Lỗi chấm black-box')
            )
            .catch(() => toast.error('Lỗi kết nối khi chấm black-box.'))
        : Promise.resolve(),
      hasWhitebox
        ? validateWhitebox({
            questionType: 'SELECT_QUERY',
            sql: studentSql.trim(),
            whiteboxRules,
            whiteboxSettings,
            questionPoints: effectiveTotalPoints
          })
            .then((res) => res.data && setWhitebox(res.data))
            .catch(() => toast.error('Lỗi kết nối khi chấm white-box.'))
        : Promise.resolve()
    ])

    setIsGrading(false)
  }

  if (!hasRubric) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-500" />
        Cần tạo test case (black-box) hoặc thêm quy tắc white-box trước khi chấm
        thử.
      </div>
    )
  }

  const bbPercent = blackbox
    ? (blackbox.earnedPoints / blackbox.totalPoints) * 100
    : 0
  // Final score preview = black-box earned minus capped white-box deduction (clamped at 0).
  const finalScore =
    blackbox && whitebox
      ? Math.max(0, blackbox.earnedPoints - whitebox.cappedDeduction)
      : null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          SQL CỦA SINH VIÊN (LỆNH SELECT QUERY)
        </label>
        <div className="h-40 overflow-hidden rounded-md border border-border bg-sub-background">
          <TeacherSqlEditor
            value={studentSql}
            onChange={(value) => {
              setStudentSql(value || '')
              setBlackbox(null)
              setWhitebox(null)
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
              Chấm Giả Lập
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {hasBlackbox && hasWhitebox
            ? 'Chấm cả Black-box và White-box (hiển thị riêng).'
            : hasBlackbox
              ? 'Chỉ chấm Black-box (chưa có quy tắc white-box).'
              : 'Chỉ chấm White-box (chưa có test case).'}
        </span>
      </div>

      {finalScore != null && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/40 px-4 py-2 text-sm dark:border-violet-900/40 dark:bg-violet-950/10">
          Điểm cuối dự kiến:{' '}
          <span className="font-bold">{finalScore.toFixed(2)}</span> /{' '}
          {blackbox!.totalPoints.toFixed(2)}
          <span className="text-muted-foreground">
            {' '}
            (black-box {blackbox!.earnedPoints.toFixed(2)} − white-box{' '}
            {whitebox!.cappedDeduction.toFixed(2)})
          </span>
        </div>
      )}

      {/* Black-box result */}
      {blackbox && (
        <div className="space-y-3 duration-300 animate-in fade-in-0 slide-in-from-top-2">
          <div
            className={cn(
              'rounded-lg border p-4',
              bbPercent >= 90
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : bbPercent >= 50
                  ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-red-500/20 bg-red-500/5'
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                📊 Black-box (kết quả truy vấn)
              </span>
              <span
                className={cn(
                  'text-2xl font-extrabold',
                  bbPercent >= 90
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : bbPercent >= 50
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                )}
              >
                {Number(blackbox.earnedPoints).toFixed(2)} /{' '}
                {blackbox.totalPoints.toFixed(2)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  bbPercent >= 90
                    ? 'bg-emerald-500'
                    : bbPercent >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                )}
                style={{ width: `${Math.min(100, bbPercent)}%` }}
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
                {blackbox.details.length}
              </Badge>
            </div>
            <div className="max-h-[300px] divide-y divide-border overflow-y-auto">
              {blackbox.details.map((detail, idx) => (
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
        </div>
      )}

      {/* White-box result */}
      {whitebox && (
        <div className="overflow-hidden rounded-lg border border-violet-200 bg-card duration-300 animate-in fade-in-0 slide-in-from-top-2 dark:border-violet-900/40">
          <div className="flex items-center justify-between border-b border-border bg-violet-50/60 px-4 py-2.5 dark:bg-violet-950/20">
            <span className="text-sm font-bold text-foreground">
              🔬 White-box (cách viết câu lệnh)
            </span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              −{whitebox.cappedDeduction.toFixed(2)}đ
            </span>
          </div>
          {!whitebox.sqlParseOk && (
            <p className="px-4 pt-2 text-xs text-amber-600 dark:text-amber-400">
              SQL không phân tích được cú pháp — rule phụ thuộc parser trả
              UNVERIFIED (không trừ điểm).
            </p>
          )}
          <div className="divide-y divide-border">
            {whitebox.violations.filter((v) => v.status !== 'PASS').length ===
            0 ? (
              <p className="px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400">
                ✓ Không vi phạm quy tắc white-box nào.
              </p>
            ) : (
              whitebox.violations
                .filter((v) => v.status !== 'PASS')
                .map((v, idx) => {
                  const style = WB_STYLE[v.status] ?? WB_STYLE.UNVERIFIED
                  const Icon = style.icon
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2 px-4 py-2.5 text-xs"
                    >
                      <Icon
                        className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', style.cls)}
                      />
                      <span className="flex-1 text-foreground">
                        <span className="font-medium">{v.label}</span>
                        {v.reason ? ` — ${v.reason}` : ''}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 font-mono font-bold',
                          v.deductedPoints > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        {v.deductedPoints > 0
                          ? `−${v.deductedPoints.toFixed(2)}`
                          : '0'}
                      </span>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
