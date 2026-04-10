import type {
  SpecificationSchemaJsonForeignKey,
  SpecificationSchemaJsonTable
} from '@/lib/types'

export type CreateTableQuestionOptions = {
  includeForeignKeys: boolean
}

export type GeneratedCreateTableQuestion = {
  content: string
  correctQuery: string
}

const escapeSqlIdentifier = (value: string) => `[${value}]`

const normalizeScript = (script: string) => script.trim().replace(/;+\s*$/, ';')

const buildFallbackTableScript = (
  table: SpecificationSchemaJsonTable
): string => {
  const colDefs = table.columns.map((column) => {
    let def = `  ${escapeSqlIdentifier(column.columnName)} ${column.dataType}`
    if (column.autoIncrement) def += ' IDENTITY(1,1)'
    if (column.unique && !column.primaryKey) def += ' UNIQUE'
    if (column.nullable === false && !column.primaryKey) def += ' NOT NULL'
    return def
  })
  const pkCols = table.columns
    .filter((column) => column.primaryKey)
    .map((column) => escapeSqlIdentifier(column.columnName))
  if (pkCols.length > 0) {
    colDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`)
  }
  return `CREATE TABLE ${escapeSqlIdentifier(table.tableName)} (\n${colDefs.join(',\n')}\n);`
}

const buildForeignKeyScript = (
  sourceTable: string,
  fk: SpecificationSchemaJsonForeignKey
): string => {
  const sourceColumns = fk.sourceColumns.map(escapeSqlIdentifier).join(', ')
  const targetColumns = fk.targetColumns.map(escapeSqlIdentifier).join(', ')
  return [
    `ALTER TABLE ${escapeSqlIdentifier(sourceTable)}`,
    `ADD FOREIGN KEY (${sourceColumns})`,
    `REFERENCES ${escapeSqlIdentifier(fk.targetTable)}(${targetColumns});`
  ].join(' ')
}

const topologicalSortTables = (
  selectedTables: SpecificationSchemaJsonTable[]
): SpecificationSchemaJsonTable[] => {
  const nameToTable = new Map(
    selectedTables.map((table) => [table.tableName, table])
  )

  const indegree = new Map<string, number>()
  const adj = new Map<string, string[]>()
  selectedTables.forEach((table) => {
    indegree.set(table.tableName, 0)
    adj.set(table.tableName, [])
  })

  selectedTables.forEach((table) => {
    ;(table.foreignKeys || []).forEach((fk) => {
      if (!nameToTable.has(fk.targetTable)) return
      // Edge target -> source so target table appears first
      adj.get(fk.targetTable)!.push(table.tableName)
      indegree.set(table.tableName, (indegree.get(table.tableName) || 0) + 1)
    })
  })

  const queue: string[] = []
  indegree.forEach((deg, name) => {
    if (deg === 0) queue.push(name)
  })

  const ordered: string[] = []
  while (queue.length > 0) {
    const name = queue.shift()!
    ordered.push(name)
    ;(adj.get(name) || []).forEach((next) => {
      indegree.set(next, (indegree.get(next) || 0) - 1)
      if (indegree.get(next) === 0) queue.push(next)
    })
  }

  if (ordered.length < selectedTables.length) {
    // Cycle exists: keep original deterministic order from user selection.
    return selectedTables
  }

  return ordered
    .map((name) => nameToTable.get(name))
    .filter((table): table is SpecificationSchemaJsonTable => Boolean(table))
}

export const generateCreateTableQuestionFromSchema = (
  schemaTables: SpecificationSchemaJsonTable[],
  selectedTableNames: string[],
  options: CreateTableQuestionOptions
): GeneratedCreateTableQuestion => {
  const selectedSet = new Set(selectedTableNames)
  const selectedTables = schemaTables.filter((table) =>
    selectedSet.has(table.tableName)
  )

  if (selectedTables.length === 0) {
    return {
      content: '',
      correctQuery: ''
    }
  }

  const orderedTables = topologicalSortTables(selectedTables)
  const createTableScripts = orderedTables.map((table) =>
    normalizeScript(table.script?.trim() || buildFallbackTableScript(table))
  )

  const fkScripts: string[] = []
  if (options.includeForeignKeys) {
    orderedTables.forEach((table) => {
      ;(table.foreignKeys || []).forEach((fk) => {
        if (!selectedSet.has(fk.targetTable)) return
        fkScripts.push(buildForeignKeyScript(table.tableName, fk))
      })
    })
  }

  const tablesPhrase = selectedTableNames.join(', ')
  const content = options.includeForeignKeys
    ? `Tạo bảng và các ràng buộc cần thiết cho ${tablesPhrase}.`
    : `Tạo bảng ${tablesPhrase} (chưa cần khóa ngoại).`

  const sections = [...createTableScripts]
  if (fkScripts.length > 0) {
    sections.push(
      '-- Add foreign keys after CREATE TABLE to support circular dependencies',
      ...fkScripts
    )
  }

  return {
    content,
    correctQuery: sections.join('\n\n').trim()
  }
}

export const sanitizeSchemaTables = (
  schemaJson: unknown
): SpecificationSchemaJsonTable[] => {
  if (!Array.isArray(schemaJson)) return []
  return schemaJson
    .filter(
      (item): item is SpecificationSchemaJsonTable =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as SpecificationSchemaJsonTable).tableName === 'string' &&
        Array.isArray((item as SpecificationSchemaJsonTable).columns)
    )
    .map((table) => ({
      ...table,
      foreignKeys: Array.isArray(table.foreignKeys) ? table.foreignKeys : [],
      columns: (table.columns || []).map((column) => ({
        ...column,
        nullable: column.nullable ?? true,
        unique: column.unique ?? false,
        autoIncrement: column.autoIncrement ?? false
      }))
    }))
}
