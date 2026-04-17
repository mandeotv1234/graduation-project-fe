'use client'

import React, { useMemo, useState } from 'react'
import {
  Loader2,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { testGradeSelectData } from '@/lib/actions'
import { GradingRubric } from '@/lib/types'

interface GradeDetail {
  type: string
  message: string
  points: number
}

interface GradeResult {
  earnedPoints: number
  totalPoints: number
  allPassed: boolean
  details: GradeDetail[]
}

interface SelectQueryTestGraderProps {
  examId: number
  rubric: GradingRubric | null
  correctQuery?: string
  totalPoints?: number
}

export function SelectQueryTestGrader({
  examId,
  rubric,
  correctQuery,
  totalPoints
}: SelectQueryTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [showInfoDetails, setShowInfoDetails] = useState(false)

  const hasRubric =
    rubric &&
    rubric.question_category === 'SELECT_QUERY' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Array.isArray((rubric.grading_payload as any)?.test_cases) &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rubric.grading_payload as any).test_cases.length > 0
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
    if (!rubric || !studentSql.trim()) {
      return
    }

    setIsGrading(true)
    setResult(null)
    try {
      const response = await testGradeSelectData(examId, {
        studentQuery: studentSql.trim(),
        correctQuery: correctQuery?.trim() || '',
        gradingRubric: JSON.stringify(rubric),
        totalPoints: effectiveTotalPoints
      })

      if (response.data) {
        setResult(response.data as GradeResult)
      } else {
        toast.error(response.message || 'Không thể chấm thử câu SELECT')
      }
    } catch (error) {
      console.error('SELECT test grade failed:', error)
      toast.error('Lỗi kết nối khi chấm thử câu SELECT')
    } finally {
      setIsGrading(false)
    }
  }

  if (!hasRubric) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
        Vui lòng tạo rubric SELECT theo test case trước khi chấm thử.
      </div>
    )
  }

  const scorePercent = result
    ? (result.earnedPoints / result.totalPoints) * 100
    : 0

  // Split details into main (success/warning/error) and info
  const mainDetails = useMemo(
    () => result?.details.filter((d) => d.type !== 'info') ?? [],
    [result]
  )
  const infoDetails = useMemo(
    () => result?.details.filter((d) => d.type === 'info') ?? [],
    [result]
  )

  return (
    <div className="space-y-3">
      <div className="h-[180px] overflow-hidden rounded border border-border bg-sub-background">
        <TeacherSqlEditor
          value={studentSql}
          onChange={(value) => {
            setStudentSql(value || '')
            setResult(null)
          }}
          height="100%"
        />
      </div>

      <Button
        type="button"
        onClick={handleTest}
        disabled={isGrading || !studentSql.trim()}
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
            Chấm thử
          </>
        )}
      </Button>

      {result && (
        <div className="space-y-3">
          {/* Score summary */}
          <div
            className={`rounded-lg border px-4 py-3 flex items-center justify-between ${
              result.allPassed
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : scorePercent >= 50
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-red-500/30 bg-red-500/5'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {result.allPassed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>
                Điểm:{' '}
                <strong>
                  {result.earnedPoints.toFixed(2)} /{' '}
                  {result.totalPoints.toFixed(2)}
                </strong>
              </span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                result.allPassed
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : scorePercent >= 50
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    : 'bg-red-500/20 text-red-700 dark:text-red-400'
              }`}
            >
              {scorePercent.toFixed(0)}%
            </span>
          </div>

          {/* Main details (success/warning/error only) */}
          {mainDetails.length > 0 && (
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              {mainDetails.map((d, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2.5 text-xs flex items-start gap-2 ${
                    d.type === 'success'
                      ? 'bg-emerald-500/5'
                      : d.type === 'warning'
                        ? 'bg-amber-500/5'
                        : 'bg-red-500/5'
                  }`}
                >
                  {d.type === 'success' && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  {d.type === 'warning' && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  {d.type === 'error' && (
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span className="flex-1 leading-relaxed">{d.message}</span>
                  {d.points !== 0 && (
                    <span
                      className={`font-mono font-medium shrink-0 ${
                        d.points < 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {d.points > 0 ? '+' : ''}
                      {d.points}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info details toggle */}
          {infoDetails.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowInfoDetails((prev) => !prev)}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showInfoDetails ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <Info className="h-3 w-3" />
                Chi tiết kỹ thuật ({infoDetails.length})
              </button>
              {showInfoDetails && (
                <div className="mt-1.5 rounded border border-border/50 divide-y divide-border/50 overflow-hidden">
                  {infoDetails.map((d, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 text-[11px] text-muted-foreground flex items-start gap-2"
                    >
                      <Info className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />
                      <span className="flex-1">{d.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
