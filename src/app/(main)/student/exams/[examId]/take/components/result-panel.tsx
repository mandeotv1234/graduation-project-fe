'use client'

import { Table, AlertCircle, Clock, Hash } from 'lucide-react'
import { ExecuteSqlResponse } from '@/lib/types'

interface ResultPanelProps {
  result: ExecuteSqlResponse | null
}

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <div className="text-center">
          <Table className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p>Chạy SQL để xem kết quả</p>
        </div>
      </div>
    )
  }

  if (result.errorMessage) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Lỗi thực thi</p>
            <pre className="whitespace-pre-wrap text-xs text-destructive/80">
              {result.errorMessage}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  const columns =
    result.resultSet.length > 0 ? Object.keys(result.resultSet[0]) : []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 sm:px-5 py-2 sm:py-3">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Kết quả chạy
        </span>
        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-medium text-muted-foreground bg-background px-2.5 sm:px-3 py-1.5 rounded-md border border-border shadow-sm w-fit">
          <span className="flex items-center gap-1 sm:gap-1.5 shrink-0 text-emerald-600 dark:text-emerald-400">
            <Hash className="h-3.5 w-3.5" />
            {result.rowCount} dòng
          </span>
          <div className="w-px h-3 bg-border" />
          <span className="flex items-center gap-1 sm:gap-1.5 shrink-0 text-blue-600 dark:text-blue-400">
            <Clock className="h-3.5 w-3.5" />
            {result.executionTimeMs}ms
          </span>
        </div>
      </div>

      {/* Table */}
      {columns.length > 0 ? (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.resultSet.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="whitespace-nowrap px-4 py-2 text-foreground"
                    >
                      {row[col] === null ? (
                        <span className="italic text-muted-foreground">
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
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Câu lệnh thực thi thành công (không có kết quả trả về)
        </div>
      )}
    </div>
  )
}
