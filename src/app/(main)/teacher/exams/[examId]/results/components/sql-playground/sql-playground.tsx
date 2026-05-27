'use client'

import { useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/shared/spinner'
import {
  teacherExecuteSqlOnResult,
  teacherResetResultSchema
} from '@/lib/actions'
import { cn } from '@/lib/utils'
import type { TeacherSqlExecutionResult } from '@/lib/types'
import styles from './sql-playground.module.scss'

interface SqlPlaygroundProps {
  examId: number
  resultId: number
  studentQuery: string
  correctQuery: string
}

type RunTarget = 'student' | 'correct'

export function SqlPlayground({
  examId,
  resultId,
  studentQuery,
  correctQuery
}: SqlPlaygroundProps) {
  const [loading, setLoading] = useState<RunTarget | null>(null)
  const [result, setResult] = useState<TeacherSqlExecutionResult | null>(null)
  const [lastTarget, setLastTarget] = useState<RunTarget | null>(null)
  const [resetting, setResetting] = useState(false)

  async function handleRun(target: RunTarget) {
    const sql = target === 'student' ? studentQuery : correctQuery
    if (!sql.trim()) {
      toast.warning('Không có câu SQL để chạy')
      return
    }
    setLoading(target)
    setLastTarget(target)
    try {
      const res = await teacherExecuteSqlOnResult(examId, resultId, sql)
      if (res.data) {
        setResult(res.data)
      } else {
        toast.error(res.message ?? 'Không thể thực thi SQL')
        setResult(null)
      }
    } catch {
      toast.error('Lỗi kết nối khi thực thi SQL')
      setResult(null)
    } finally {
      setLoading(null)
    }
  }

  async function handleReset() {
    setResetting(true)
    try {
      const res = await teacherResetResultSchema(examId, resultId)
      if (res.code === 'OK' || res.data === null) {
        toast.success('Đã reset schema về trạng thái ban đầu')
        setResult(null)
      } else {
        toast.error(res.message ?? 'Không thể reset schema')
      }
    } catch {
      toast.error('Lỗi kết nối khi reset schema')
    } finally {
      setResetting(false)
    }
  }

  const columns =
    result?.resultSet && result.resultSet.length > 0
      ? Object.keys(result.resultSet[0])
      : []

  return (
    <div
      className={cn(
        'space-y-4 rounded-lg border border-border bg-muted/30 p-4',
        styles.playground
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          SQL Playground
        </h4>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={resetting || loading !== null}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <RotateCcw
                className={cn('h-3.5 w-3.5', resetting && 'animate-spin')}
              />
              {resetting ? 'Đang reset...' : 'Reset DB'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận reset schema?</AlertDialogTitle>
              <AlertDialogDescription>
                Schema của sinh viên sẽ được reset về trạng thái ban đầu. Kết
                quả SQL Playground hiện tại sẽ bị xoá.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Xác nhận reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => handleRun('student')}
          className="w-full gap-1.5"
        >
          {loading === 'student' ? (
            <Spinner size="sm" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Chạy câu trả lời SV
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => handleRun('correct')}
          className="w-full gap-1.5"
        >
          {loading === 'correct' ? (
            <Spinner size="sm" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Chạy đáp án đúng
        </Button>
      </div>

      {/* Result panel */}
      {result !== null && (
        <div className="rounded-md border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {lastTarget === 'student'
                ? 'Kết quả — Câu trả lời SV'
                : 'Kết quả — Đáp án đúng'}
            </span>
            {result.executionTimeMs !== null && (
              <span className="text-xs text-muted-foreground">
                {result.executionTimeMs}ms
              </span>
            )}
          </div>

          <div className="p-3">
            {/* Error message */}
            {result.errorMessage && (
              <pre className="whitespace-pre-wrap rounded bg-destructive/10 p-2 text-xs text-destructive">
                {result.errorMessage}
              </pre>
            )}

            {/* Status message (no error) */}
            {!result.errorMessage && result.statusMessage && (
              <p className="text-xs text-muted-foreground">
                {result.statusMessage}
              </p>
            )}

            {/* Result table */}
            {columns.length > 0 &&
              result.resultSet &&
              result.resultSet.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={col}
                            className="border border-border bg-muted px-2 py-1 text-left font-semibold"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.resultSet.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={cn(
                            rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                          )}
                        >
                          {columns.map((col) => (
                            <td
                              key={col}
                              className="border border-border px-2 py-1"
                            >
                              {row[col] === null ? (
                                <span className="text-muted-foreground italic">
                                  NULL
                                </span>
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.rowCount !== null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.rowCount} hàng
                    </p>
                  )}
                </div>
              )}

            {/* Empty result set */}
            {!result.errorMessage &&
              result.resultSet !== null &&
              result.resultSet.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Truy vấn thành công — không có dữ liệu trả về.
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  )
}
