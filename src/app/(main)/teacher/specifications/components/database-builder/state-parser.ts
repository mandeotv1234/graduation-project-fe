import {
  SpecificationDetailResponse,
  type SpecificationSchemaJsonTable
} from '@/lib/types'
import { AppState, TableDef, ColumnDef, DatasetDef, RowDef } from './types'

type TableDataEntry = {
  tableName: string
  script?: string
  columns: string[]
  rows: unknown[][]
}

function parseSchemaJson(
  raw: string | SpecificationSchemaJsonTable[] | null | undefined
): SpecificationSchemaJsonTable[] | undefined {
  if (raw == null) return undefined
  try {
    let parsed: unknown
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw)
    } else if (Array.isArray(raw)) {
      parsed = raw
    } else {
      return undefined
    }
    if (!Array.isArray(parsed)) return undefined
    return parsed as SpecificationSchemaJsonTable[]
  } catch {
    return undefined
  }
}

export function schemaJsonToAppState(
  schemaArray: SpecificationSchemaJsonTable[]
): AppState | undefined {
  if (!schemaArray?.length) return undefined

  const tables: TableDef[] = []
  const tableRefMap = new Map<string, string>()

  schemaArray.forEach((schemaTable, tIdx) => {
    const tableId = `tbl-${tIdx}-${Date.now()}`
    tableRefMap.set(schemaTable.tableName, tableId)

    const columns: ColumnDef[] = (schemaTable.columns || []).map(
      (col, cIdx) => ({
        id: `col-${tIdx}-${cIdx}-${Date.now()}`,
        name: col.columnName,
        type: col.dataType,
        isPrimaryKey: !!col.primaryKey,
        isNotNull: col.nullable === undefined ? true : !col.nullable,
        isUnique: !!col.unique || !!col.primaryKey,
        isAutoIncrement: !!col.autoIncrement
      })
    )

    tables.push({
      id: tableId,
      name: schemaTable.tableName,
      columns,
      foreignKeys: []
    })
  })

  schemaArray.forEach((schemaTable) => {
    const sourceTableId = tableRefMap.get(schemaTable.tableName)
    const sourceTable = tables.find((t) => t.id === sourceTableId)
    if (!sourceTable) return

    const fksByTarget = new Map<
      string,
      Array<{ sourceColumnId: string; targetColumnId: string }>
    >()

    const hasExplicitForeignKeys =
      Array.isArray(schemaTable.foreignKeys) &&
      schemaTable.foreignKeys.length > 0

    // Preferred format: explicit foreignKeys array (supports composite keys)
    ;(schemaTable.foreignKeys || []).forEach((fk) => {
      const targetTableId = tableRefMap.get(fk.targetTable)
      if (!targetTableId) return

      const targetTable = tables.find((t) => t.id === targetTableId)
      if (!targetTable) return

      const mappings: Array<{
        sourceColumnId: string
        targetColumnId: string
      }> = []
      fk.sourceColumns.forEach((sourceColName, idx) => {
        const targetColName = fk.targetColumns[idx]
        if (!targetColName) return

        const sourceCol = sourceTable.columns.find(
          (c) => c.name === sourceColName
        )
        const targetCol = targetTable.columns.find(
          (c) => c.name === targetColName
        )
        if (!sourceCol || !targetCol) return
        mappings.push({
          sourceColumnId: sourceCol.id,
          targetColumnId: targetCol.id
        })
      })

      if (mappings.length > 0) {
        if (!fksByTarget.has(targetTableId)) {
          fksByTarget.set(targetTableId, [])
        }
        const existing = fksByTarget.get(targetTableId)!
        mappings.forEach((mapping) => {
          const isDuplicated = existing.some(
            (item) =>
              item.sourceColumnId === mapping.sourceColumnId &&
              item.targetColumnId === mapping.targetColumnId
          )
          if (!isDuplicated) {
            existing.push(mapping)
          }
        })
      }
    })

    // Backward compatible format: FK info stored on each column
    // Only use when explicit foreignKeys array is absent.
    if (!hasExplicitForeignKeys) {
      ;(schemaTable.columns || []).forEach((col) => {
        if (col.foreignKey && col.referencesTable && col.referencesColumn) {
          const targetTableId = tableRefMap.get(col.referencesTable)
          if (!targetTableId) return
          const targetTable = tables.find((t) => t.id === targetTableId)
          const sourceCol = sourceTable.columns.find(
            (c) => c.name === col.columnName
          )
          const targetCol = targetTable?.columns.find(
            (c) => c.name === col.referencesColumn
          )
          if (!sourceCol || !targetCol) return

          if (!fksByTarget.has(targetTableId)) {
            fksByTarget.set(targetTableId, [])
          }
          const existing = fksByTarget.get(targetTableId)!
          const isDuplicated = existing.some(
            (item) =>
              item.sourceColumnId === sourceCol.id &&
              item.targetColumnId === targetCol.id
          )
          if (!isDuplicated) {
            existing.push({
              sourceColumnId: sourceCol.id,
              targetColumnId: targetCol.id
            })
          }
        }
      })
    }

    Array.from(fksByTarget.entries()).forEach(
      ([targetTableId, mappings], fkIdx) => {
        sourceTable.foreignKeys.push({
          id: `fk-${sourceTableId}-${fkIdx}-${Date.now()}`,
          targetTableId,
          columnMapping: mappings
        })
      }
    )
  })

  return { tables, datasets: [] }
}

export function applyIdentityColumnsFromDdl(
  tables: TableDef[],
  ddlScript: string | undefined
) {
  if (!ddlScript) return

  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  tables.forEach((table) => {
    const tableBlockRegex = new RegExp(
      `CREATE\\s+TABLE\\s+\\[${escapeRegExp(table.name)}\\]\\s*\\(([\\s\\S]*?)\\);`,
      'i'
    )
    const tableMatch = ddlScript.match(tableBlockRegex)
    const tableBlock = tableMatch?.[1] ?? ''

    table.columns.forEach((col) => {
      if (col.isAutoIncrement) return

      const colRegex = new RegExp(
        `\\[${escapeRegExp(col.name)}\\][^\\n\\r,]*IDENTITY`,
        'i'
      )
      if (colRegex.test(tableBlock)) {
        col.isAutoIncrement = true
      }
    })
  })
}

function parseTableData(raw: string | undefined): TableDataEntry[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as TableDataEntry[]
  } catch {
    return []
  }
}

function hasTableDataRows(tableData: TableDataEntry[]): boolean {
  return tableData.some(
    (entry) => Array.isArray(entry.rows) && entry.rows.length > 0
  )
}

function splitSqlStatements(script: string): string[] {
  const statements: string[] = []
  let current = ''
  let inString = false

  for (let index = 0; index < script.length; index += 1) {
    const char = script[index]
    const next = script[index + 1]

    current += char

    if (char === "'") {
      if (inString && next === "'") {
        current += next
        index += 1
      } else {
        inString = !inString
      }
      continue
    }

    if (char === ';' && !inString) {
      const statement = current.trim()
      if (statement) statements.push(statement)
      current = ''
    }
  }

  const remaining = current.trim()
  if (remaining) statements.push(remaining)

  return statements
}

function splitSqlList(raw: string): string[] {
  const items: string[] = []
  let current = ''
  let inString = false
  let depth = 0

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index]
    const next = raw[index + 1]

    if (char === "'") {
      current += char
      if (inString && next === "'") {
        current += next
        index += 1
      } else {
        inString = !inString
      }
      continue
    }

    if (!inString) {
      if (char === '(') depth += 1
      if (char === ')') depth -= 1
      if (char === ',' && depth === 0) {
        items.push(current.trim())
        current = ''
        continue
      }
    }

    current += char
  }

  if (current.trim()) items.push(current.trim())
  return items
}

function normalizeSqlIdentifier(identifier: string): string {
  const cleaned = identifier
    .trim()
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .replace(/"/g, '')

  const parts = cleaned
    .split(/\s*\.\s*/)
    .map((part) => part.replace(/^\[/, '').replace(/\]$/, '').trim())
    .filter(Boolean)

  return parts[parts.length - 1] || cleaned
}

function parseSqlValue(raw: string): unknown {
  const value = raw.trim()
  if (/^NULL$/i.test(value)) return null

  const stringMatch = value.match(/^N?'([\s\S]*)'$/i)
  if (stringMatch) {
    return stringMatch[1].replace(/''/g, "'")
  }

  return value
}

function parseValuesGroups(raw: string): unknown[][] {
  const rows: unknown[][] = []
  let inString = false
  let depth = 0
  let current = ''

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index]
    const next = raw[index + 1]

    if (char === "'") {
      if (depth > 0) current += char
      if (inString && next === "'") {
        if (depth > 0) current += next
        index += 1
      } else {
        inString = !inString
      }
      continue
    }

    if (!inString && char === '(') {
      if (depth === 0) {
        current = ''
      } else {
        current += char
      }
      depth += 1
      continue
    }

    if (!inString && char === ')') {
      depth -= 1
      if (depth === 0) {
        rows.push(splitSqlList(current).map(parseSqlValue))
        current = ''
      } else if (depth > 0) {
        current += char
      }
      continue
    }

    if (depth > 0) current += char
  }

  return rows
}

function parseDataScript(script: string | undefined): TableDataEntry[] {
  if (!script?.trim()) return []

  const entriesByTable = new Map<string, TableDataEntry>()
  const statements = splitSqlStatements(script)

  statements.forEach((statement) => {
    const insertMatch = statement.match(
      /INSERT\s+INTO\s+((?:\[[^\]]+\]|"[^"]+"|\w+)(?:\s*\.\s*(?:\[[^\]]+\]|"[^"]+"|\w+))?)\s*\(([\s\S]*?)\)\s*VALUES\s*([\s\S]*)$/i
    )
    if (!insertMatch) return

    const tableName = normalizeSqlIdentifier(insertMatch[1])
    const columns = splitSqlList(insertMatch[2]).map(normalizeSqlIdentifier)
    const rows = parseValuesGroups(insertMatch[3])
    if (!tableName || columns.length === 0 || rows.length === 0) return

    const existing = entriesByTable.get(tableName)
    if (existing) {
      existing.rows.push(...rows)
      existing.script = [existing.script, statement].filter(Boolean).join('\n')
      return
    }

    entriesByTable.set(tableName, {
      tableName,
      script: statement,
      columns,
      rows
    })
  })

  return Array.from(entriesByTable.values())
}

export function parseDataScriptToRowsByTable(
  script: string,
  tables: TableDef[]
): Record<string, RowDef[]> | undefined {
  const tableDataArray = parseDataScript(script)
  if (!tableDataArray.length) return undefined

  const rowsByTable: Record<string, RowDef[]> = {}
  const findTable = (tableName: string) =>
    tables.find((table) => table.name.toLowerCase() === tableName.toLowerCase())

  tableDataArray.forEach((td) => {
    const table = findTable(td.tableName)
    if (!table) return

    rowsByTable[table.id] = (td.rows || []).map((rowVals, rowIndex) => {
      const values: Record<string, string> = {}
      const rowArray = Array.isArray(rowVals) ? rowVals : []

      ;(td.columns || []).forEach((colName, colIndex) => {
        const matchedColId = table.columns.find(
          (col) => col.name.toLowerCase() === colName.toLowerCase()
        )?.id
        if (!matchedColId) return

        const cell = rowArray[colIndex]
        values[matchedColId] = cell == null ? '' : String(cell)
      })

      table.columns.forEach((col) => {
        if (!col.isAutoIncrement || values[col.id]) return
        values[col.id] = String(rowIndex + 1)
      })

      return {
        id: `row-script-${table.id}-${rowIndex}-${Date.now()}`,
        values
      }
    })
  })

  if (Object.keys(rowsByTable).length === 0) return undefined
  return rowsByTable
}

export function parseSpecificationToAppState(
  spec: SpecificationDetailResponse
): AppState | undefined {
  const schemaRaw = spec.schemaJson
  const hasSchema =
    schemaRaw != null &&
    !(typeof schemaRaw === 'string' && schemaRaw.trim() === '') &&
    !(Array.isArray(schemaRaw) && schemaRaw.length === 0)
  if (!hasSchema || !spec.datasets?.length) return undefined

  const schemaArray = parseSchemaJson(schemaRaw)
  if (!schemaArray?.length) return undefined

  const parsedState = schemaJsonToAppState(schemaArray)
  if (!parsedState) return undefined
  const { tables } = parsedState
  const tableRefMap = new Map<string, string>()
  tables.forEach((t) => tableRefMap.set(t.name, t.id))
  const findTableId = (tableName: string) =>
    tableRefMap.get(tableName) ||
    tables.find((table) => table.name.toLowerCase() === tableName.toLowerCase())
      ?.id

  // Best-effort fallback extraction of isAutoIncrement from DDL script.
  applyIdentityColumnsFromDdl(tables, spec.ddlScript)

  schemaArray.forEach((schemaTable) => {
    const sourceTableId = findTableId(schemaTable.tableName)
    const sourceTable = tables.find((t) => t.id === sourceTableId)
    if (!sourceTable)
      return // Never allow foreign-key columns to be auto increment in UI state.
    ;(schemaTable.columns || []).forEach((col) => {
      if (!col.foreignKey) return
      const sourceCol = sourceTable.columns.find(
        (c) => c.name === col.columnName
      )
      if (sourceCol) {
        sourceCol.isAutoIncrement = false
      }
    })
  })

  // Datasets
  const datasets: DatasetDef[] = []
  ;(spec.datasets || []).forEach((ds, dIdx) => {
    const parsedTableData = parseTableData(ds.tableData)
    const parsedDataScript = parseDataScript(ds.dataScript)
    const tableDataArray = hasTableDataRows(parsedDataScript)
      ? parsedDataScript
      : parsedTableData

    const rowsByTable: Record<string, RowDef[]> = {}

    tableDataArray.forEach((td) => {
      const tableId = findTableId(td.tableName)
      if (!tableId) return
      const table = tables.find((t) => t.id === tableId)
      if (!table) return

      const tableRows: RowDef[] = []
      ;(td.rows || []).forEach((rowVals, rIdx) => {
        const values: Record<string, string> = {}
        const rowArray = Array.isArray(rowVals) ? rowVals : []
        ;(td.columns || []).forEach((colName, cIdx) => {
          const matchedColId = table.columns.find(
            (c) => c.name.toLowerCase() === colName.toLowerCase()
          )?.id
          if (matchedColId) {
            const cell = rowArray[cIdx]
            values[matchedColId] = cell == null ? '' : String(cell)
          }
        })
        table.columns.forEach((col) => {
          if (!col.isAutoIncrement || values[col.id]) return
          values[col.id] = String(rIdx + 1)
        })
        tableRows.push({
          id: `row-${dIdx}-${tableId}-${rIdx}-${Date.now()}`,
          values
        })
      })
      rowsByTable[tableId] = tableRows
    })

    datasets.push({
      id: `ds-${dIdx}-${Date.now()}`,
      name: ds.name,
      rowsByTable,
      originalId: ds.id
    })
  })

  return { tables, datasets }
}
