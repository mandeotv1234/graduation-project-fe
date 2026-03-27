'use client'

import React, { useState } from 'react'
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
}

export function SelectQueryTestGrader({
  examId,
  rubric,
  correctQuery
}: SelectQueryTestGraderProps) {
  const [studentSql, setStudentSql] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)

  const hasRubric =
    rubric &&
    rubric.question_category === 'SELECT_QUERY' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Array.isArray((rubric.grading_payload as any)?.test_cases) &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rubric.grading_payload as any).test_cases.length > 0

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
        totalPoints: rubric.total_points
      })

      if (response.data) {
        setResult(response.data as GradeResult)
      } else {
        toast.error(response.message || 'Khong the cham thu cau SELECT')
      }
    } catch (error) {
      console.error('SELECT test grade failed:', error)
      toast.error('Loi ket noi khi cham thu cau SELECT')
    } finally {
      setIsGrading(false)
    }
  }

  if (!hasRubric) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
        Vui long tao rubric SELECT theo test case truoc khi cham thu.
      </div>
    )
  }

  const scorePercent = result
    ? (result.earnedPoints / result.totalPoints) * 100
    : 0

  return (
    <div className="space-y-3">
      <div className="h-[180px] overflow-hidden rounded border border-border bg-background">
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
            Dang cham...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Cham thu cau SELECT
          </>
        )}
      </Button>

      {result && (
        <div className="space-y-2">
          <div className="rounded border border-border px-3 py-2 text-sm">
            Ket qua: <strong>{result.earnedPoints.toFixed(2)}</strong> /{' '}
            {result.totalPoints.toFixed(2)} ({scorePercent.toFixed(1)}%)
          </div>

          <div className="rounded border border-border divide-y divide-border">
            {result.details.map((d, idx) => (
              <div
                key={idx}
                className="px-3 py-2 text-xs flex items-start gap-2"
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
                <span className="flex-1">{d.message}</span>
                <span className="font-mono">{d.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
