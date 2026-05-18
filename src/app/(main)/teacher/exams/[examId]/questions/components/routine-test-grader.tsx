'use client'

import React, { useMemo, useState } from 'react'
import {
  Loader2,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { testGradeRoutineData } from '@/lib/actions'
import { GradingRubric, RoutineTestCase } from '@/lib/types'

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

interface RoutineTestGraderProps {
  examId: number
  rubric: GradingRubric | null
  correctQuery?: string
  totalPoints?: number
}

function isTestCaseDetailMessage(message: string): boolean {
  return message.startsWith("Test case '")
}

function parseTestCaseLabel(message: string): string | null {
  const match = message.match(/^Test case '([^']+)':/)
  return match?.[1] ?? null
}

function findTestCaseByLabel(
  testCases: RoutineTestCase[],
  label: string
): RoutineTestCase | undefined {
  return testCases.find(
    (tc) =>
      tc.case_name === label || tc.case_id === label || tc.description === label
  )
}

export function RoutineTestGrader({
  examId,
  rubric,
  correctQuery,
  totalPoints
}: RoutineTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)

  const hasRubric =
    rubric &&
    (rubric.question_category === 'FUNCTION' ||
      rubric.question_category === 'STORED_PROCEDURE') &&
    rubric.grading_payload &&
    typeof rubric.grading_payload === 'object'

  const rubricTotalPoints =
    typeof rubric?.total_points === 'number' &&
    Number.isFinite(rubric.total_points)
      ? rubric.total_points
      : 1

  const effectiveTotalPoints =
    typeof totalPoints === 'number' && Number.isFinite(totalPoints)
      ? totalPoints
      : rubricTotalPoints

  const { testCases, metadataDiagnosticOnly, getTestCaseMaxPoints } =
    useMemo(() => {
      const payload =
        rubric?.grading_payload && typeof rubric.grading_payload === 'object'
          ? (rubric.grading_payload as Record<string, unknown>)
          : null

      const cases = Array.isArray(payload?.test_cases)
        ? (payload.test_cases as RoutineTestCase[])
        : []

      const routines = Array.isArray(payload?.routines) ? payload.routines : []

      const diagnosticOnly =
        rubric?.question_category === 'STORED_PROCEDURE' &&
        cases.length > 0 &&
        routines.length > 0

      const testCasePointPool = diagnosticOnly
        ? effectiveTotalPoints
        : cases.length > 0
          ? effectiveTotalPoints * 0.8
          : effectiveTotalPoints

      const totalWeight =
        cases.reduce((sum, tc) => {
          const weight = Math.abs(Number(tc.score_weight) || 0)
          return sum + (weight > 0 ? weight : 0)
        }, 0) || cases.length

      const maxPointsForCase = (tc: RoutineTestCase) => {
        const weight =
          Math.abs(Number(tc.score_weight) || 0) > 0
            ? Math.abs(Number(tc.score_weight) || 0)
            : 1
        return testCasePointPool * (weight / totalWeight)
      }

      return {
        testCases: cases,
        metadataDiagnosticOnly: diagnosticOnly,
        getTestCaseMaxPoints: maxPointsForCase
      }
    }, [rubric, effectiveTotalPoints])

  const handleTest = async () => {
    if (!rubric || !studentSql.trim()) {
      return
    }

    setIsGrading(true)
    setResult(null)
    try {
      const response = await testGradeRoutineData(examId, {
        studentQuery: studentSql.trim(),
        correctQuery: correctQuery?.trim() || '',
        gradingRubric: JSON.stringify(rubric),
        totalPoints: effectiveTotalPoints
      })

      if (response.data) {
        setResult(response.data as GradeResult)
      } else {
        toast.error(response.message || 'Không thể chấm thử câu Routine')
      }
    } catch {
      toast.error('Lỗi kết nối khi chấm thử câu Routine')
    } finally {
      setIsGrading(false)
    }
  }

  const canGrade = hasRubric && studentSql.trim().length > 0

  const scorePercent = result
    ? (result.earnedPoints / result.totalPoints) * 100
    : 0

  const renderDetailPoints = (detail: GradeDetail) => {
    if (isTestCaseDetailMessage(detail.message)) {
      const label = parseTestCaseLabel(detail.message)
      const matchedCase = label
        ? findTestCaseByLabel(testCases, label)
        : undefined
      const maxPts = matchedCase ? getTestCaseMaxPoints(matchedCase) : null

      if (maxPts != null) {
        return (
          <span className="shrink-0 text-right font-mono">
            {detail.points.toFixed(2)} / {maxPts.toFixed(2)}
          </span>
        )
      }

      return (
        <span className="shrink-0 text-right font-mono">
          {detail.points.toFixed(2)}
        </span>
      )
    }

    if (metadataDiagnosticOnly) {
      return (
        <span className="shrink-0 text-right text-muted-foreground">—</span>
      )
    }

    return (
      <span
        className={`shrink-0 text-right font-mono font-bold ${
          detail.points > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : detail.points < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-muted-foreground'
        }`}
      >
        {detail.points > 0 ? '+' : ''}
        {detail.points}
      </span>
    )
  }

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

      {!hasRubric && (
        <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Vui lòng tạo rubric ở Step 3 trước khi chấm thử
        </div>
      )}

      <Button
        type="button"
        onClick={handleTest}
        disabled={isGrading || !canGrade}
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
        <div className="space-y-2">
          <div className="rounded border border-border px-3 py-2 text-sm">
            Kết quả: <strong>{result.earnedPoints.toFixed(2)}</strong> /{' '}
            {result.totalPoints.toFixed(2)} ({scorePercent.toFixed(1)}%)
          </div>

          <div className="rounded border border-border divide-y divide-border">
            {result.details.map((detail, idx) => (
              <div
                key={idx}
                className="px-3 py-2 text-xs flex items-start gap-2"
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
                {detail.type === 'info' && (
                  <AlertTriangle className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                )}
                <span className="flex-1 wrap-break-word">{detail.message}</span>
                {renderDetailPoints(detail)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
