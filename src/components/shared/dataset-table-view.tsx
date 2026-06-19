'use client'

import { useMemo } from 'react'

interface DatasetTableViewProps {
  sql?: string
  tableData?: string
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
  } catch (error) {
    console.error('Failed to parse tableData JSON', error)
    return []
  }
}

export function DatasetTableView({ sql, tableData }: DatasetTableViewProps) {
  const parsedTables = useMemo(
    () => parseJsonToTablesData(tableData, sql),
    [tableData, sql]
  )

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
    <div className="space-y-4">
      {parsedTables.map((parsedData) => {
        const tableMinWidth = Math.max(
          720,
          parsedData.columns.length * 190 + 56
        )

        return (
          <div
            key={parsedData.tableName}
            className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
              <div className="text-sm font-semibold text-primary">
                Bảng: {parsedData.tableName}
              </div>
              <div className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {parsedData.rows.length} dòng
              </div>
            </div>
            <div className="max-h-[360px] min-w-0 overflow-auto rounded-b-lg">
              <table
                className="w-max border-collapse text-xs"
                style={{ minWidth: tableMinWidth }}
              >
                <thead className="sticky top-0 z-10 border-b border-border bg-muted/80 text-foreground backdrop-blur supports-backdrop-filter:bg-muted/60">
                  <tr>
                    <th className="w-12 border-r border-border px-3 py-2 text-center font-semibold">
                      #
                    </th>
                    {parsedData.columns.map((col, idx) => (
                      <th
                        key={`${parsedData.tableName}-${col}-${idx}`}
                        className="min-w-[180px] max-w-[420px] border-r border-border px-4 py-2 text-left font-semibold"
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
                        className="odd:bg-background even:bg-muted/20 hover:bg-blue-50/60 dark:hover:bg-blue-900/10"
                      >
                        <td className="border-r border-border px-3 py-2 text-center text-muted-foreground">
                          {rIdx + 1}
                        </td>
                        {parsedData.columns.map((_, cIdx) => (
                          <td
                            key={`${parsedData.tableName}-${rIdx}-${cIdx}`}
                            title={row[cIdx] ?? ''}
                            className="max-w-[420px] truncate border-r border-border px-4 py-2 align-top whitespace-nowrap"
                          >
                            {row[cIdx] === 'null' ? (
                              <span className="text-muted-foreground/60 italic">
                                null
                              </span>
                            ) : (
                              (row[cIdx] ?? '')
                            )}
                          </td>
                        ))}
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
