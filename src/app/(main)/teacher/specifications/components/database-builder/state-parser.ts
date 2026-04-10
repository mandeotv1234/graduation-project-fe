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

  // Best-effort fallback extraction of isAutoIncrement from DDL script.
  schemaArray.forEach((schemaTable) => {
    const sourceTableId = tableRefMap.get(schemaTable.tableName)
    const sourceTable = tables.find((t) => t.id === sourceTableId)
    if (!sourceTable) return

    // Best-effort fallback extraction of isAutoIncrement from DDL script.
    // Only parse inside current CREATE TABLE block to avoid cross-table false matches.
    if (spec.ddlScript) {
      const escapeRegExp = (value: string) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      const tableBlockRegex = new RegExp(
        `CREATE\\s+TABLE\\s+\\[${escapeRegExp(schemaTable.tableName)}\\]\\s*\\(([\\s\\S]*?)\\);`,
        'i'
      )
      const tableMatch = spec.ddlScript.match(tableBlockRegex)
      const tableBlock = tableMatch?.[1] ?? ''

      sourceTable.columns.forEach((col) => {
        if (col.isAutoIncrement) return

        const colRegex = new RegExp(
          `\\[${escapeRegExp(col.name)}\\][^\\n\\r,]*IDENTITY`,
          'i'
        )
        if (colRegex.test(tableBlock)) {
          col.isAutoIncrement = true
        }
      })
    }

    // Never allow foreign-key columns to be auto increment in UI state.
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
    const tableDataArray = parseTableData(ds.tableData)

    const rowsByTable: Record<string, RowDef[]> = {}

    tableDataArray.forEach((td) => {
      const tableId = tableRefMap.get(td.tableName)
      if (!tableId) return
      const table = tables.find((t) => t.id === tableId)
      if (!table) return

      const tableRows: RowDef[] = []
      ;(td.rows || []).forEach((rowVals, rIdx) => {
        const values: Record<string, string> = {}
        const rowArray = Array.isArray(rowVals) ? rowVals : []
        ;(td.columns || []).forEach((colName, cIdx) => {
          const matchedColId = table.columns.find((c) => c.name === colName)?.id
          if (matchedColId) {
            const cell = rowArray[cIdx]
            values[matchedColId] = cell == null ? '' : String(cell)
          }
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
