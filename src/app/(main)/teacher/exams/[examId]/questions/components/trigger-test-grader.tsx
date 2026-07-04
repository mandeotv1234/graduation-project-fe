'use client'

import { Button } from '@/components/ui/button'
import { testGradeTriggerData } from '@/lib/actions'
import { GradingRubric, WhiteboxRule } from '@/lib/types'
import { AlertTriangle, Loader2, Play } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { TestGradeResult, TestGradeResultView } from './test-grade-result-view'

interface TriggerTestGraderProps {
  examId: number
  rubric: GradingRubric | null
  correctQuery?: string
  totalPoints?: number
}

export function TriggerTestGrader({
  examId,
  rubric,
  correctQuery,
  totalPoints
}: TriggerTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<TestGradeResult | null>(null)

  const hasRubric =
    rubric?.question_category === 'TRIGGER' &&
    rubric.grading_payload &&
    typeof rubric.grading_payload === 'object'
  const payload =
    rubric?.grading_payload && typeof rubric.grading_payload === 'object'
      ? (rubric.grading_payload as { whitebox_rules?: WhiteboxRule[] })
      : null
  const whiteboxRules = Array.isArray(payload?.whitebox_rules)
    ? payload.whitebox_rules
    : []

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
      const response = await testGradeTriggerData(examId, {
        studentQuery: studentSql.trim(),
        correctQuery: correctQuery?.trim() || '',
        gradingRubric: JSON.stringify(rubric),
        totalPoints: effectiveTotalPoints
      })

      if (response.data) {
        setResult(response.data as TestGradeResult)
      } else {
        toast.error(response.message || 'Không thể chấm thử câu Trigger')
      }
    } catch {
      toast.error('Lỗi kết nối khi chấm thử câu Trigger')
    } finally {
      setIsGrading(false)
    }
  }

  const canGrade = hasRubric && studentSql.trim().length > 0

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
          detailTitle="Chi tiết chấm thử trigger"
          blackboxTitle="Black-box: test case trigger"
          whiteboxTitle="White-box: quy tắc cách viết"
          whiteboxRules={whiteboxRules}
        />
      )}
    </div>
  )
}
