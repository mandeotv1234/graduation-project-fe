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
  const fkStatements: string[] = []
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

    table.foreignKeys.forEach((fk, fkIndex) => {
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
          const constraintName = `FK_${table.name}_${targetTable.name}_${fkIndex + 1}`
          fkStatements.push(
            `ALTER TABLE [${table.name}] ADD CONSTRAINT [${constraintName}] FOREIGN KEY (${sourceCols.join(', ')}) REFERENCES [${targetTable.name}](${targetCols.join(', ')});`
          )
        }
      }
    })

    sql += colDefs.join(',\n')
    sql += '\n);\n\n'
  })

  if (fkStatements.length > 0) {
    sql +=
      '-- Foreign keys are added after all tables are created to avoid circular dependency issues\n'
    sql += `${fkStatements.join('\n')}\n\n`
  }

  return sql
}

export const generateDatasetScript = (
  tables: TableDef[],
  dataset: DatasetDef | undefined
) => {
  if (!dataset) return ''

  let sql = ''
  tables.forEach((table) => {
    sql += `ALTER TABLE [${table.name}] NOCHECK CONSTRAINT ALL;\n`
  })
  sql += '\n'

  tables.forEach((table) => {
    const rows = dataset.rowsByTable[table.id] || []
    if (rows.length === 0) return

    const insertColumns = table.columns.filter((c) => !c.isAutoIncrement)

    rows.forEach((row) => {
      if (insertColumns.length === 0) {
        sql += `INSERT INTO [${table.name}] DEFAULT VALUES;\n`
        return
      }

      const colNames = insertColumns.map((c) => `[${c.name}]`).join(', ')
      const values = insertColumns
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

    sql += '\n'
  })

  tables.forEach((table) => {
    sql += `ALTER TABLE [${table.name}] WITH CHECK CHECK CONSTRAINT ALL;\n`
  })
  sql += '\n'

  return sql
}

export const buildSchemaJson = (
  tables: TableDef[]
): SpecificationSchemaJsonTable[] => {
  return tables.map((table) => {
    const buildTableScript = () => {
      const colDefs = table.columns.map((column) => {
        let def = `  [${column.name}] ${column.type}`
        if (column.isAutoIncrement) def += ' IDENTITY(1,1)'
        if (column.isUnique && !column.isPrimaryKey) def += ' UNIQUE'
        if (column.isNotNull && !column.isPrimaryKey) def += ' NOT NULL'
        return def
      })

      const pkCols = table.columns
        .filter((column) => column.isPrimaryKey)
        .map((column) => `[${column.name}]`)
      if (pkCols.length > 0) {
        colDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`)
      }

      return `CREATE TABLE [${table.name}] (\n${colDefs.join(',\n')}\n);`
    }

    const fkBySourceColumn = new Map<
      string,
      { referencesTable: string; referencesColumn: string }
    >()
    const foreignKeys: NonNullable<
      SpecificationSchemaJsonTable['foreignKeys']
    > = []

    table.foreignKeys.forEach((fk, fkIndex) => {
      const targetTable = tables.find((t) => t.id === fk.targetTableId)
      if (!targetTable) return

      const sourceColumns: string[] = []
      const targetColumns: string[] = []
      fk.columnMapping.forEach((mapping) => {
        const sourceColumn = table.columns.find(
          (column) => column.id === mapping.sourceColumnId
        )
        const targetColumn = targetTable.columns.find(
          (column) => column.id === mapping.targetColumnId
        )
        if (!sourceColumn || !targetColumn) return
        sourceColumns.push(sourceColumn.name)
        targetColumns.push(targetColumn.name)
        fkBySourceColumn.set(sourceColumn.id, {
          referencesTable: targetTable.name,
          referencesColumn: targetColumn.name
        })
      })

      if (
        sourceColumns.length > 0 &&
        sourceColumns.length === targetColumns.length
      ) {
        foreignKeys.push({
          name: `FK_${table.name}_${targetTable.name}_${fkIndex + 1}`,
          sourceColumns,
          targetTable: targetTable.name,
          targetColumns,
          onDelete: 'NO_ACTION',
          onUpdate: 'NO_ACTION'
        })
      }
    })

    return {
      tableName: table.name,
      script: buildTableScript(),
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
      }),
      foreignKeys
    }
  })
}

export const buildTableData = (tables: TableDef[], dataset: DatasetDef) => {
  const buildPerTableInsertScript = (table: TableDef) => {
    const rows = dataset.rowsByTable[table.id] || []
    if (rows.length === 0) return ''

    let script = ''
    const hasIdentity = table.columns.some((c) => c.isAutoIncrement)
    if (hasIdentity) {
      script += `SET IDENTITY_INSERT [${table.name}] ON;\n`
    }

    const colNames = table.columns.map((c) => `[${c.name}]`).join(', ')
    rows.forEach((row) => {
      const values = table.columns
        .map((c) => {
          const val = row.values[c.id]
          if (val === undefined || val === '') return 'NULL'
          if (isNumericType(c.type)) return val
          return `N'${val.replace(/'/g, "''")}'`
        })
        .join(', ')
      script += `INSERT INTO [${table.name}] (${colNames}) VALUES (${values});\n`
    })

    if (hasIdentity) {
      script += `SET IDENTITY_INSERT [${table.name}] OFF;\n`
    }

    return script.trim()
  }

  const tableData = tables.map((table) => {
    const columns = table.columns.map((column) => column.name)
    const rows = (dataset.rowsByTable[table.id] || []).map((row) =>
      table.columns.map((column) => row.values[column.id] ?? null)
    )

    return {
      tableName: table.name,
      script: buildPerTableInsertScript(table),
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
