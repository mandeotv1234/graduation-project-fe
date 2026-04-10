'use client'

import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

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
      {parsedTables.map((parsedData) => (
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
          <ScrollArea className="w-full whitespace-nowrap rounded-b-lg">
            <div className="max-h-[360px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 border-b border-border bg-muted/80 backdrop-blur supports-backdrop-filter:bg-muted/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 border-r border-border text-center font-semibold text-foreground">
                      #
                    </TableHead>
                    {parsedData.columns.map((col, idx) => (
                      <TableHead
                        key={`${parsedData.tableName}-${col}-${idx}`}
                        className="min-w-[140px] max-w-[320px] truncate border-r border-border px-4 font-semibold text-foreground"
                      >
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={parsedData.columns.length + 1}
                        className="text-center text-muted-foreground text-xs py-4"
                      >
                        Bảng không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    parsedData.rows.map((row, rIdx) => (
                      <TableRow
                        key={`${parsedData.tableName}-row-${rIdx}`}
                        className="odd:bg-background even:bg-muted/20 hover:bg-blue-50/60 dark:hover:bg-blue-900/10"
                      >
                        <TableCell className="border-r border-border text-center text-muted-foreground">
                          {rIdx + 1}
                        </TableCell>
                        {parsedData.columns.map((_, cIdx) => (
                          <TableCell
                            key={`${parsedData.tableName}-${rIdx}-${cIdx}`}
                            className="max-w-[320px] truncate border-r border-border px-4 py-2 align-top"
                          >
                            {row[cIdx] === 'null' ? (
                              <span className="text-muted-foreground/60 italic">
                                null
                              </span>
                            ) : (
                              (row[cIdx] ?? '')
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
