import type { SpecificationSchemaJsonTable } from '@/lib/types'
import { TableDef, DatasetDef } from './types'

const isNumericType = (dataType: string) => {
  const normalized = dataType.toUpperCase()
  return (
    normalized.includes('INT') ||
    normalized.includes('FLOAT') ||
    normalized.includes('DECIMAL') ||
    normalized.includes('NUMERIC') ||
    normalized === 'BIT'
  )
}

export const generateSchemaOnlySQL = (tables: TableDef[]) => {
  let sql = ''
  tables.forEach((table) => {
    sql += `CREATE TABLE [${table.name}] (\n`
    const colDefs = table.columns.map((col) => {
      let def = `  [${col.name}] ${col.type}`
      if (col.isAutoIncrement) def += ' IDENTITY(1,1)'
      if (col.isUnique && !col.isPrimaryKey) def += ' UNIQUE'
      if (col.isNotNull && !col.isPrimaryKey) def += ' NOT NULL'
      return def
    })

    const pkCols = table.columns
      .filter((c) => c.isPrimaryKey)
      .map((c) => `[${c.name}]`)
    if (pkCols.length > 0) {
      colDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`)
    }

    table.foreignKeys.forEach((fk) => {
      const targetTable = tables.find((t) => t.id === fk.targetTableId)
      if (targetTable) {
        const sourceCols = fk.columnMapping
          .map(
            (m) => table.columns.find((c) => c.id === m.sourceColumnId)?.name
          )
          .filter(Boolean)
          .map((n) => `[${n}]`)
        const targetCols = fk.columnMapping
          .map(
            (m) =>
              targetTable.columns.find((c) => c.id === m.targetColumnId)?.name
          )
          .filter(Boolean)
          .map((n) => `[${n}]`)
        if (sourceCols.length > 0 && sourceCols.length === targetCols.length) {
          colDefs.push(
            `  FOREIGN KEY (${sourceCols.join(', ')}) REFERENCES [${targetTable.name}](${targetCols.join(', ')})`
          )
        }
      }
    })

    sql += colDefs.join(',\n')
    sql += '\n);\n\n'
  })

  return sql
}

export const generateDatasetScript = (
  tables: TableDef[],
  dataset: DatasetDef | undefined
) => {
  if (!dataset) return ''

  let sql = ''
  tables.forEach((table) => {
    const rows = dataset.rowsByTable[table.id] || []
    if (rows.length === 0) return

    const hasIdentity = table.columns.some((c) => c.isAutoIncrement)
    if (hasIdentity) {
      sql += `SET IDENTITY_INSERT [${table.name}] ON;\n`
    }

    const colNames = table.columns.map((c) => `[${c.name}]`).join(', ')
    rows.forEach((row) => {
      const values = table.columns
        .map((c) => {
          const val = row.values[c.id]
          if (val === undefined || val === '') return 'NULL'
          if (isNumericType(c.type)) {
            return val
          }
          return `N'${val.replace(/'/g, "''")}'`
        })
        .join(', ')
      sql += `INSERT INTO [${table.name}] (${colNames}) VALUES (${values});\n`
    })

    if (hasIdentity) {
      sql += `SET IDENTITY_INSERT [${table.name}] OFF;\n`
    }
    sql += '\n'
  })

  return sql
}

export const buildSchemaJson = (
  tables: TableDef[]
): SpecificationSchemaJsonTable[] => {
  return tables.map((table) => {
    const fkBySourceColumn = new Map<
      string,
      { referencesTable: string; referencesColumn: string }
    >()

    table.foreignKeys.forEach((fk) => {
      const targetTable = tables.find((t) => t.id === fk.targetTableId)
      if (!targetTable) return

      fk.columnMapping.forEach((mapping) => {
        const sourceColumn = table.columns.find(
          (column) => column.id === mapping.sourceColumnId
        )
        const targetColumn = targetTable.columns.find(
          (column) => column.id === mapping.targetColumnId
        )
        if (!sourceColumn || !targetColumn) return
        fkBySourceColumn.set(sourceColumn.id, {
          referencesTable: targetTable.name,
          referencesColumn: targetColumn.name
        })
      })
    })

    return {
      tableName: table.name,
      columns: table.columns.map((column) => {
        const fkInfo = fkBySourceColumn.get(column.id)
        return {
          columnName: column.name,
          dataType: column.type,
          primaryKey: column.isPrimaryKey,
          foreignKey: Boolean(fkInfo),
          referencesTable: fkInfo?.referencesTable ?? null,
          referencesColumn: fkInfo?.referencesColumn ?? null,
          nullable: !column.isNotNull,
          unique: column.isUnique,
          autoIncrement: column.isAutoIncrement
        }
      })
    }
  })
}

export const buildTableData = (tables: TableDef[], dataset: DatasetDef) => {
  const tableData = tables.map((table) => {
    const columns = table.columns.map((column) => column.name)
    const rows = (dataset.rowsByTable[table.id] || []).map((row) =>
      table.columns.map((column) => row.values[column.id] ?? null)
    )

    return {
      tableName: table.name,
      columns,
      rows
    }
  })

  return JSON.stringify(tableData)
}

export const generateSQL = (
  tables: TableDef[],
  datasets: DatasetDef[],
  selectedDatasetId: string
) => {
  const ddlSql = generateSchemaOnlySQL(tables)
  const dataset = datasets.find((d) => d.id === selectedDatasetId)
  const dmlSql = generateDatasetScript(tables, dataset)
  return `${ddlSql}${dmlSql}`
}
