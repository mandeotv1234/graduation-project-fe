'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'

interface DatasetTableViewProps {
  sql?: string
  tableData?: string
  variant?: 'default' | 'exam-spec'
}

type ParsedTableData = {
  tableName: string
  columns: string[]
  rows: string[][]
}

const parseJsonToTablesData = (
  jsonString?: string,
  fallbackSql?: string
): ParsedTableData[] => {
  if (!jsonString) {
    return []
  }

  try {
    const data = JSON.parse(jsonString)

    if (!Array.isArray(data) || data.length === 0) {
      return []
    }

    // Check if the payload is already an array of ParsedTableData (e.g manually created for seeded datasets)
    const isParsedTableDataArray = data.every(
      (item) =>
        item.tableName &&
        Array.isArray(item.columns) &&
        Array.isArray(item.rows)
    )

    if (isParsedTableDataArray) {
      return data as ParsedTableData[]
    }

    // Determine tableName from fallbackSql if possible (heuristic for display)
    let tableName = 'Dataset'
    if (fallbackSql) {
      const match = fallbackSql.match(/INSERT\s+INTO\s+([^\s(]+)/i)
      if (match && match[1]) {
        tableName = match[1].replace(/[[\]"]/g, '')
      }
    }

    // Extract columns from the first object
    const firstRow = data[0]
    if (typeof firstRow !== 'object' || firstRow === null) {
      return []
    }

    const columns = Object.keys(firstRow)
    const rows = data.map((item) =>
      columns.map((col) => {
        const val = item[col]
        if (val === null || val === undefined) return 'null'
        if (typeof val === 'object') return JSON.stringify(val)
        return String(val)
      })
    )

    return [
      {
        tableName,
        columns,
        rows
      }
    ]
  } catch {
    return []
  }
}

function formatCellValue(value: string | undefined) {
  if (!value) return ''

  const markdownLink = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
  if (markdownLink) {
    return markdownLink[1]
  }

  return value
}

function getCellTone(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'null') return 'null'
  if (/^-?\d+(\.\d+)?$/.test(normalized)) return 'number'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'email'
  return 'text'
}

export function DatasetTableView({
  sql,
  tableData,
  variant = 'default'
}: DatasetTableViewProps) {
  const parsedTables = useMemo(
    () => parseJsonToTablesData(tableData, sql),
    [tableData, sql]
  )
  const isExamSpec = variant === 'exam-spec'

  if (!tableData) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
        Lưới dữ liệu chỉ hiển thị đối với dữ liệu được xuất trực tiếp từ CSDL.
        <br />
        Vui lòng dùng công cụ <strong>Xuất bảng dữ liệu</strong> để xem dưới
        dạng lưới, hoặc chuyển qua tab <strong>Mã SQL</strong>.
      </div>
    )
  }

  if (parsedTables.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
        Bảng không có dữ liệu.
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', isExamSpec && 'space-y-3')}>
      {parsedTables.map((parsedData) => {
        const tableMinWidth = Math.max(
          isExamSpec ? 560 : 720,
          parsedData.columns.length * (isExamSpec ? 160 : 190) + 56
        )

        return (
          <div
            key={parsedData.tableName}
            className={cn(
              'overflow-hidden rounded-lg border bg-card',
              isExamSpec
                ? 'border-border shadow-none'
                : 'border-border/70 shadow-sm'
            )}
          >
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 border-b border-border',
                isExamSpec ? 'bg-muted/30 px-3 py-2' : 'bg-muted/40 px-4 py-2.5'
              )}
            >
              <div className="min-w-0">
                <div
                  className={cn(
                    'truncate font-semibold text-primary',
                    isExamSpec ? 'text-xs' : 'text-sm'
                  )}
                >
                  {parsedData.tableName}
                </div>
                {isExamSpec && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {parsedData.columns.length} cột dữ liệu
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {parsedData.rows.length} dòng
                </span>
                {isExamSpec && (
                  <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {parsedData.columns.length} cột
                  </span>
                )}
              </div>
            </div>
            <div
              className={cn(
                'min-w-0 overflow-auto rounded-b-lg',
                isExamSpec ? 'max-h-[300px]' : 'max-h-[360px]'
              )}
            >
              <table
                className={cn(
                  'w-max border-collapse',
                  isExamSpec ? 'text-[11px]' : 'text-xs'
                )}
                style={{ minWidth: tableMinWidth }}
              >
                <thead
                  className={cn(
                    'sticky top-0 z-10 border-b border-border text-foreground',
                    isExamSpec
                      ? 'bg-background'
                      : 'bg-muted/80 backdrop-blur supports-backdrop-filter:bg-muted/60'
                  )}
                >
                  <tr>
                    <th
                      className={cn(
                        'w-12 border-r border-border text-center font-semibold text-muted-foreground',
                        isExamSpec ? 'px-2 py-2' : 'px-3 py-2'
                      )}
                    >
                      #
                    </th>
                    {parsedData.columns.map((col, idx) => (
                      <th
                        key={`${parsedData.tableName}-${col}-${idx}`}
                        className={cn(
                          'border-r border-border text-left font-semibold',
                          isExamSpec
                            ? 'min-w-[150px] max-w-[360px] px-3 py-2'
                            : 'min-w-[180px] max-w-[420px] px-4 py-2'
                        )}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={parsedData.columns.length + 1}
                        className="px-4 py-6 text-center text-xs text-muted-foreground"
                      >
                        Bảng không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    parsedData.rows.map((row, rIdx) => (
                      <tr
                        key={`${parsedData.tableName}-row-${rIdx}`}
                        className={cn(
                          'odd:bg-background even:bg-muted/20',
                          isExamSpec
                            ? 'border-b border-border/50 last:border-b-0 hover:bg-primary/5'
                            : 'hover:bg-blue-50/60 dark:hover:bg-blue-900/10'
                        )}
                      >
                        <td
                          className={cn(
                            'border-r border-border text-center text-muted-foreground',
                            isExamSpec ? 'px-2 py-2' : 'px-3 py-2'
                          )}
                        >
                          {rIdx + 1}
                        </td>
                        {parsedData.columns.map((_, cIdx) => {
                          const displayValue = formatCellValue(row[cIdx])
                          const tone = getCellTone(displayValue)

                          return (
                            <td
                              key={`${parsedData.tableName}-${rIdx}-${cIdx}`}
                              title={displayValue}
                              className={cn(
                                'truncate border-r border-border align-top whitespace-nowrap',
                                isExamSpec
                                  ? 'max-w-[360px] px-3 py-2'
                                  : 'max-w-[420px] px-4 py-2',
                                tone === 'number' &&
                                  'font-mono text-foreground',
                                tone === 'email' && 'text-primary',
                                tone === 'text' && 'text-foreground'
                              )}
                            >
                              {tone === 'null' ? (
                                <span className="italic text-muted-foreground/60">
                                  null
                                </span>
                              ) : (
                                displayValue
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
