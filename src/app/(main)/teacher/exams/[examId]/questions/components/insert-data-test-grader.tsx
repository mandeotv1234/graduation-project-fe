'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { testGradeInsertData } from '@/lib/actions'
import { GradingRubric } from '@/lib/types'
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  XCircle
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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

interface InsertDataTestGraderProps {
  rubric: GradingRubric | null
  correctQuery?: string
  examId: number
  totalPoints?: number
}

export function InsertDataTestGrader({
  rubric,
  correctQuery,
  examId,
  totalPoints
}: InsertDataTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [isGrading, setIsGrading] = useState(false)

  const rubricRoot = (rubric as unknown as Record<string, unknown>) || null
  const payload =
    rubricRoot?.grading_payload &&
    typeof rubricRoot.grading_payload === 'object' &&
    !Array.isArray(rubricRoot.grading_payload)
      ? (rubricRoot.grading_payload as Record<string, unknown>)
      : null

  const payloadTables = Array.isArray(payload?.tables)
    ? (payload.tables as unknown[])
    : null
  const payloadLegacyTables = Array.isArray(payload?.expected_datasets)
    ? (payload.expected_datasets as unknown[])
    : null
  const rootTables = Array.isArray(rubricRoot?.tables)
    ? (rubricRoot.tables as unknown[])
    : null
  const rootLegacyTables = Array.isArray(rubricRoot?.expected_datasets)
    ? (rubricRoot.expected_datasets as unknown[])
    : null

  const resolvedTables =
    payloadTables ?? payloadLegacyTables ?? rootTables ?? rootLegacyTables ?? []
  const hasRubric = resolvedTables.length > 0
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
    if (!rubric || !studentSql.trim() || !correctQuery?.trim()) return

    setIsGrading(true)
    setResult(null)

    try {
      const response = await testGradeInsertData(examId, {
        correctQuery: correctQuery.trim(),
        studentQuery: studentSql.trim(),
        gradingRubric: JSON.stringify(rubric),
        totalPoints: effectiveTotalPoints
      })

      if (response.data) {
        setResult(response.data as GradeResult)
      } else {
        toast.error(response.message || 'Lỗi khi chấm thử')
      }
    } catch (err) {
      console.error('Test grade failed:', err)
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setIsGrading(false)
    }
  }

  if (!hasRubric) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
        Vui lòng tạo rubric dữ liệu (tables/expected_data) trước khi sử dụng
        chức năng chấm thử INSERT.
      </div>
    )
  }

  if (!correctQuery?.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
        Vui lòng nhập SQL đáp án chứa INSERT VALUES mẫu.
      </div>
    )
  }

  const scorePercent = result
    ? (result.earnedPoints / result.totalPoints) * 100
    : 0

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          SQL CỦA SINH VIÊN (LỆNH INSERT DỮ LIỆU)
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

      {/* Results */}
      {result && (
        <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          {/* Score bar */}
          <div
            className={`rounded-lg border p-4 ${
              scorePercent >= 90
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : scorePercent >= 50
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">
                Kết quả chấm điểm INSERT records
              </span>
              <span
                className={`text-2xl font-extrabold ${scorePercent >= 90 ? 'text-emerald-600 dark:text-emerald-400' : scorePercent >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {Number(result.earnedPoints).toFixed(2)} /{' '}
                {result.totalPoints.toFixed(2)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scorePercent >= 90 ? 'bg-emerald-500' : scorePercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, scorePercent)}%` }}
              />
            </div>
          </div>

          {/* Detail breakdown */}
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <div className="flex items-center gap-2 bg-muted/30 px-4 py-2.5 border-b border-border">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Chi tiết vết chấm từng dòng dữ liệu
              </span>
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs text-muted-foreground bg-muted font-semibold"
              >
                {result.details.length}
              </Badge>
            </div>
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
              {result.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 px-4 py-2.5 text-xs hover:bg-muted/20 transition-colors"
                >
                  {detail.type === 'success' && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  {detail.type === 'warning' && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  {detail.type === 'error' && (
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span className="flex-1 text-foreground wrap-break-word">
                    {detail.message}
                  </span>
                  <span
                    className={`font-mono font-bold shrink-0 ${detail.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : detail.points < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}
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
    </div>
  )
}
