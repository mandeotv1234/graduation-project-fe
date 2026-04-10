import type { SpecificationDataset } from '@/lib/types'

export type GeneratedInsertDataQuestion = {
  content: string
  correctQuery: string
}

type TableDataEntry = {
  tableName: string
  script?: string
  columns?: string[]
  rows?: unknown[][]
}

const normalizeScript = (script: string) => script.trim()

/** Matches full dataset script from generateDatasetScript (sql-generator) */
const scriptHasFkConstraintToggles = (script: string) =>
  /NOCHECK\s+CONSTRAINT\s+ALL/i.test(script)

/**
 * Same envelope as generateDatasetScript: disable FK checks for inserts, re-enable after.
 * Per-table JSON in tableData only has IDENTITY_INSERT + INSERT, not these ALTERs.
 */
const wrapInsertScriptWithFkConstraintToggles = (
  body: string,
  tableNames: string[]
): string => {
  const trimmed = body.trim()
  if (!trimmed || tableNames.length === 0) return body

  const uniqueOrdered: string[] = []
  const seen = new Set<string>()
  for (const name of tableNames) {
    if (!name || seen.has(name)) continue
    seen.add(name)
    uniqueOrdered.push(name)
  }
  if (uniqueOrdered.length === 0) return body

  const nocheck = uniqueOrdered
    .map((t) => `ALTER TABLE [${t}] NOCHECK CONSTRAINT ALL;`)
    .join('\n')
  const recheck = uniqueOrdered
    .map((t) => `ALTER TABLE [${t}] WITH CHECK CHECK CONSTRAINT ALL;`)
    .join('\n')

  return `${nocheck}\n\n${trimmed}\n\n${recheck}\n`
}

const parseTableData = (tableData?: string): TableDataEntry[] => {
  if (!tableData) return []
  try {
    const parsed = JSON.parse(tableData)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is TableDataEntry =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as TableDataEntry).tableName === 'string'
    )
  } catch {
    return []
  }
}

const buildFallbackTableScript = (entry: TableDataEntry): string => {
  const tableName = entry.tableName
  const columns = Array.isArray(entry.columns) ? entry.columns : []
  const rows = Array.isArray(entry.rows) ? entry.rows : []
  if (!tableName || columns.length === 0 || rows.length === 0) return ''

  return rows
    .map((row) => {
      const rowArray = Array.isArray(row) ? row : []
      const values = rowArray
        .map((cell) => {
          if (cell === null || cell === undefined || cell === '') return 'NULL'
          const value = String(cell)
          if (/^-?\d+(\.\d+)?$/.test(value)) return value
          return `N'${value.replace(/'/g, "''")}'`
        })
        .join(', ')
      const colNames = columns.map((column) => `[${column}]`).join(', ')
      return `INSERT INTO [${tableName}] (${colNames}) VALUES (${values});`
    })
    .join('\n')
}

export const generateInsertDataQuestionFromDataset = (
  dataset: SpecificationDataset,
  tableNames?: string[]
): GeneratedInsertDataQuestion => {
  const tableDataEntries = parseTableData(dataset.tableData)
  const selectedTableNames = (
    Array.isArray(tableNames)
      ? tableNames
      : typeof tableNames === 'string'
        ? [tableNames]
        : []
  ).filter(Boolean)
  const selectedEntries =
    selectedTableNames.length > 0
      ? tableDataEntries.filter((entry) =>
          selectedTableNames.includes(entry.tableName)
        )
      : []

  const selectedTableScript = selectedEntries
    .map((entry) =>
      normalizeScript(entry.script || buildFallbackTableScript(entry))
    )
    .filter(Boolean)
    .join('\n\n')

  const correctQueryRaw =
    selectedTableScript || normalizeScript(dataset.dataScript || '')
  if (!correctQueryRaw) {
    return { content: '', correctQuery: '' }
  }

  const needsConstraintWrap = !scriptHasFkConstraintToggles(correctQueryRaw)
  let wrapTableNames: string[] = []
  if (needsConstraintWrap) {
    if (selectedTableScript && selectedEntries.length > 0) {
      wrapTableNames = selectedEntries.map((e) => e.tableName)
    } else if (tableDataEntries.length > 0) {
      wrapTableNames = tableDataEntries.map((e) => e.tableName)
    }
  }

  const correctQuery =
    needsConstraintWrap && wrapTableNames.length > 0
      ? wrapInsertScriptWithFkConstraintToggles(correctQueryRaw, wrapTableNames)
      : correctQueryRaw

  const tablesPhrase =
    selectedTableNames.length > 0
      ? ` cho bảng ${selectedTableNames.join(', ')}`
      : tableDataEntries.length > 0
        ? ` cho các bảng ${tableDataEntries.map((entry) => entry.tableName).join(', ')}`
        : ''

  return {
    content: `Chèn dữ liệu theo dataset "${dataset.name}"${tablesPhrase}.`,
    correctQuery
  }
}

export const getDatasetTableNames = (dataset: SpecificationDataset): string[] =>
  parseTableData(dataset.tableData).map((entry) => entry.tableName)
