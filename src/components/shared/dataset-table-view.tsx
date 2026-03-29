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
          className="rounded-md border border-border"
        >
          <div className="bg-muted/50 px-4 py-2 font-medium text-sm border-b border-border text-primary">
            Bảng: {parsedData.tableName} ({parsedData.rows.length} dòng)
          </div>
          <ScrollArea className="w-full whitespace-nowrap rounded-b-md">
            <div className="max-h-60 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm border-b border-border hover:bg-muted">
                  <TableRow className="hover:bg-muted">
                    <TableHead className="w-12 text-center border-r border-border">
                      #
                    </TableHead>
                    {parsedData.columns.map((col, idx) => (
                      <TableHead
                        key={`${parsedData.tableName}-${col}-${idx}`}
                        className="font-semibold text-foreground px-4 truncate border-r border-border min-w-[120px] max-w-[300px]"
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
                        className="hover:bg-muted/30"
                      >
                        <TableCell className="text-center text-muted-foreground border-r border-border">
                          {rIdx + 1}
                        </TableCell>
                        {parsedData.columns.map((_, cIdx) => (
                          <TableCell
                            key={`${parsedData.tableName}-${rIdx}-${cIdx}`}
                            className="px-4 truncate max-w-[300px] border-r border-border py-1"
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
