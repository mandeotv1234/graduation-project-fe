'use client'

import { Button } from '@/components/ui/button'
import { testGradeInsertData } from '@/lib/actions'
import { GradingRubric } from '@/lib/types'
import { AlertTriangle, Loader2, Play } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { TestGradeResult, TestGradeResultView } from './test-grade-result-view'

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
  const [result, setResult] = useState<TestGradeResult | null>(null)
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
  const whiteboxRules = Array.isArray(payload?.whitebox_rules)
    ? payload.whitebox_rules
    : []
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
        Vui lòng tạo rubric dữ liệu (tables/expected_data) trước khi sử dụng
        chức năng chấm thử INSERT.
      </div>
    )
  }

  if (!correctQuery?.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-500" />
        Vui lòng nhập SQL đáp án chứa INSERT VALUES mẫu.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          SQL của sinh viên (lệnh INSERT dữ liệu)
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
          title="Kết quả chấm điểm INSERT records"
          detailTitle="Chi tiết vết chấm từng dòng dữ liệu"
          splitWhitebox={false}
          whiteboxRules={whiteboxRules}
        />
      )}
    </div>
  )
}
