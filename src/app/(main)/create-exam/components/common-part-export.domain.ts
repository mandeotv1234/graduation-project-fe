import type { SaveExamSpecificationRequest } from '@/lib/types'

import type { SqlDmlBlock } from './common-part-blocks'

export type ScriptSourceMode = 'existing' | 'custom'

export type ExistingScriptOption = {
  id: string
  title: string
  sql: string
  kind: 'sql-ddl' | 'sql-dml'
}

export const MAX_EXPORT_ROWS_PER_TABLE = 200

const DML_TITLE_PREFIX = 'Mã SQL DML:'

const escapeMsIdentifier = (value: string) => value.replaceAll(']', ']]')

export const quoteMsIdentifier = (value: string) =>
  `[${escapeMsIdentifier(value)}]`

export const resolveScriptToRun = (
  mode: ScriptSourceMode,
  selectedScriptId: string,
  customScript: string,
  options: ExistingScriptOption[]
) => {
  if (mode === 'custom') {
    return customScript.trim()
  }

  return options.find((item) => item.id === selectedScriptId)?.sql.trim() ?? ''
}

const formatSqlValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL'
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }

  if (value instanceof Date) {
    return `N'${value.toISOString().replace(/'/g, "''")}'`
  }

  if (typeof value === 'object') {
    return `N'${JSON.stringify(value).replace(/'/g, "''")}'`
  }

  return `N'${String(value).replace(/'/g, "''")}'`
}

export const buildInsertScript = (
  tableName: string,
  rows: Record<string, unknown>[]
) => {
  if (rows.length === 0) {
    return `-- Bảng ${tableName} chưa có dữ liệu mẫu để xuất.`
  }

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((column) => set.add(column))
      return set
    }, new Set<string>())
  )

  if (columns.length === 0) {
    return `-- Bảng ${tableName} không có cột dữ liệu hợp lệ để xuất.`
  }

  const columnSql = columns.map(quoteMsIdentifier).join(', ')

  const valuesSql = rows
    .map((row) => {
      const rowValues = columns
        .map((column) => formatSqlValue(row[column]))
        .join(', ')
      return `  (${rowValues})`
    })
    .join(',\n')

  return `INSERT INTO ${quoteMsIdentifier(tableName)} (${columnSql})\nVALUES\n${valuesSql};`
}

export const getDatasetBlockTitle = (tableName: string) =>
  `${DML_TITLE_PREFIX} Dữ liệu bảng ${tableName}`

const toDatasetName = (title: string, fallbackIndex: number) => {
  const normalized = title.replace(/^Mã\s+SQL\s+DML\s*:/i, '').trim()
  if (normalized.length > 0) {
    return normalized
  }

  return `Dataset ${fallbackIndex + 1}`
}

export const mapDatasetBlocksToSavePayload = (
  datasetBlocks: SqlDmlBlock[]
): NonNullable<SaveExamSpecificationRequest['datasets']> =>
  datasetBlocks
    .map((block, index) => ({
      name: toDatasetName(block.title, index),
      dataScript: block.data.sql?.trim() ?? '',
      tableData: block.data.tableData?.trim() ?? '',
      orderIndex: index + 1,
      isActive: true,
      visibleToStudent: block.visibleToStudent
    }))
    .filter((dataset) => dataset.dataScript.length > 0)
