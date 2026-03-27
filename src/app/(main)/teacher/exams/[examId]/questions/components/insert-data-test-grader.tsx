'use client'

import React, { useState } from 'react'
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { GradingRubric } from '@/lib/types'
import { testGradeInsertData } from '@/lib/actions'
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
}

export function InsertDataTestGrader({
  rubric,
  correctQuery,
  examId
}: InsertDataTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [isGrading, setIsGrading] = useState(false)

  const payload = (rubric?.grading_payload ?? null) as {
    tables?: unknown[]
  } | null
  const hasRubric = Array.isArray(payload?.tables) && payload.tables.length > 0

  const handleTest = async () => {
    if (!rubric || !studentSql.trim() || !correctQuery?.trim()) return

    setIsGrading(true)
    setResult(null)

    try {
      const response = await testGradeInsertData(examId, {
        correctQuery: correctQuery.trim(),
        studentQuery: studentSql.trim(),
        gradingRubric: JSON.stringify(rubric),
        totalPoints: rubric.total_points
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
        Vui lòng tạo rubric dữ liệu trước khi sử dụng chức năng chấm thử INSERT.
      </div>
    )
  }

  if (!correctQuery?.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
        Vui lòng nhập SQL đáp án (Correct Query) chứa INSERT VALUES mẫu.
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
        <div className="h-40 overflow-hidden rounded-md border border-border bg-background">
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
        className="gap-2 bg-slate-800 hover:bg-slate-700 text-white"
      >
        {isGrading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đường Data đang chạy...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Giả Lập Chấm Thử Dữ Liệu
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
            <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Chi tiết vết chấm từng dòng dữ liệu ({result.details.length} báo
                cáo)
              </span>
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
