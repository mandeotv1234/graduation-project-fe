'use client'

import { Button } from '@/components/ui/button'
import { testGradeCreateTable } from '@/lib/actions'
import { GradingRubric, WhiteboxRule } from '@/lib/types'
import { AlertTriangle, Loader2, Play } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { TestGradeResult, TestGradeResultView } from './test-grade-result-view'

interface RubricTestGraderProps {
  rubric: GradingRubric | null
  correctQuery?: string
  totalPoints?: number
}

export function RubricTestGrader({
  rubric,
  correctQuery,
  totalPoints
}: RubricTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [result, setResult] = useState<TestGradeResult | null>(null)
  const [isGrading, setIsGrading] = useState(false)

  const payload = (rubric?.grading_payload ?? null) as {
    tables?: unknown[]
    whitebox_rules?: WhiteboxRule[]
  } | null
  const hasRubric = Array.isArray(payload?.tables) && payload.tables.length > 0
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
      const response = await testGradeCreateTable({
        correctQuery: correctQuery.trim(),
        studentQuery: studentSql.trim(),
        gradingRubric: JSON.stringify(rubric),
        totalPoints: effectiveTotalPoints
      })

      if (response.data) {
        setResult(response.data as TestGradeResult)
      } else {
        toast.error(response.message || 'Lỗi khi chấm thử')
      }
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setIsGrading(false)
    }
  }

  if (!hasRubric) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-500" />
        Vui lòng tạo rubric trước khi sử dụng chức năng chấm thử.
      </div>
    )
  }

  if (!correctQuery?.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-500" />
        Vui lòng nhập SQL đáp án mẫu trước khi sử dụng chức năng chấm thử.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          SQL của sinh viên (lệnh CREATE TABLE)
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
            Chấm giả lập
          </>
        )}
      </Button>

      {result && (
        <TestGradeResultView
          result={result}
          blackboxTitle="Black-box: cấu trúc bảng"
          whiteboxTitle="White-box: phương pháp viết DDL"
          whiteboxRules={payload?.whitebox_rules}
        />
      )}
    </div>
  )
}
