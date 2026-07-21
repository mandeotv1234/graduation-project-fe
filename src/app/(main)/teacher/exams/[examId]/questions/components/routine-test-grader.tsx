'use client'

import { Button } from '@/components/ui/button'
import { testGradeRoutineData } from '@/lib/actions'
import { GradingRubric, RoutineTestCase, WhiteboxRule } from '@/lib/types'
import { AlertTriangle, Loader2, Play } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { TeacherSqlEditor } from './teacher-sql-editor'
import {
  TestGradeDetail,
  TestGradeResult,
  TestGradeResultView
} from './test-grade-result-view'

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

function getRawTestCaseWeight(testCase: RoutineTestCase): number {
  if (
    typeof testCase.score_weight === 'number' &&
    Number.isFinite(testCase.score_weight)
  ) {
    return Math.abs(testCase.score_weight)
  }
  if (
    typeof testCase.penalty_value === 'number' &&
    Number.isFinite(testCase.penalty_value)
  ) {
    return Math.abs(testCase.penalty_value)
  }
  return 1
}

export function RoutineTestGrader({
  examId,
  rubric,
  correctQuery,
  totalPoints
}: RoutineTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<TestGradeResult | null>(null)

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

  const { testCases, metadataNonScoring, getTestCaseMaxPoints, whiteboxRules } =
    useMemo(() => {
      const payload =
        rubric?.grading_payload && typeof rubric.grading_payload === 'object'
          ? (rubric.grading_payload as Record<string, unknown>)
          : null

      const cases = Array.isArray(payload?.test_cases)
        ? (payload.test_cases as RoutineTestCase[])
        : []

      const routines = Array.isArray(payload?.routines) ? payload.routines : []
      const rules = Array.isArray(payload?.whitebox_rules)
        ? (payload.whitebox_rules as WhiteboxRule[])
        : []

      const metadataHasNoPoints = cases.length > 0 && routines.length > 0
      const testCasePointPool = effectiveTotalPoints

      const rawWeights = new Map(
        cases.map((testCase) => [testCase, getRawTestCaseWeight(testCase)])
      )
      const rawWeightTotal = Array.from(rawWeights.values()).reduce(
        (sum, weight) => sum + weight,
        0
      )
      const useEqualWeights = rawWeightTotal === 0
      const totalWeight = useEqualWeights ? cases.length : rawWeightTotal

      const maxPointsForCase = (tc: RoutineTestCase) => {
        if (totalWeight === 0) return 0
        const weight = useEqualWeights ? 1 : (rawWeights.get(tc) ?? 0)
        return testCasePointPool * (weight / totalWeight)
      }

      return {
        testCases: cases,
        metadataNonScoring: metadataHasNoPoints,
        getTestCaseMaxPoints: maxPointsForCase,
        whiteboxRules: rules
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
        setResult(response.data as TestGradeResult)
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

  const renderDetailPoints = (detail: TestGradeDetail) => {
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

    if (metadataNonScoring) {
      return (
        <span className="shrink-0 text-right text-muted-foreground">-</span>
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
        {detail.points.toFixed(2)}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          SQL của sinh viên
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

      {!hasRubric && (
        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Vui lòng tạo rubric ở Step 3 trước khi chấm thử.
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
            Chấm giả lập
          </>
        )}
      </Button>

      {result && (
        <TestGradeResultView
          result={result}
          detailTitle="Chi tiết chấm thử test case"
          blackboxTitle="Black-box: test case"
          whiteboxTitle="White-box: quy tắc cách viết"
          whiteboxRules={whiteboxRules}
          renderDetailPoints={renderDetailPoints}
        />
      )}
    </div>
  )
}
