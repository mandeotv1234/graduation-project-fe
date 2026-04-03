'use client'

import { Table, AlertCircle, Clock, Hash, CheckCircle2 } from 'lucide-react'
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

  if (columns.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Thành công
            </p>
            <pre className="whitespace-pre-wrap text-xs text-emerald-700/80 dark:text-emerald-400/80">
              {result.statusMessage ||
                'Câu lệnh thực thi thành công (không có dữ liệu trả về)'}
            </pre>
          </div>
        </div>
      </div>
    )
  }

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
      <div className="flex-1 overflow-auto bg-background/50">
        <div className="min-w-full inline-block align-middle">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-shadow">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border shadow-sm"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {result.resultSet.map((row, i) => (
                <tr
                  key={i}
                  className="group transition-colors hover:bg-muted/40"
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="whitespace-nowrap px-4 py-2.5 text-foreground font-mono text-[13px]"
                    >
                      {row[col] === null ? (
                        <span className="italic text-muted-foreground/50 text-xs">
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
      </div>
    </div>
  )
}
