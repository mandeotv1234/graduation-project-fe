import type { SpecificationSchemaJsonTable } from '@/lib/types/specification-schema-json.type'

type SchemaColumn = {
  columnName: string
  dataType: string
  primaryKey: boolean
  foreignKey?: boolean
  referencesTable?: string | null
  referencesColumn?: string | null
  nullable?: boolean
  unique?: boolean
  autoIncrement?: boolean
}

type SchemaTable = {
  tableName: string
  columns: SchemaColumn[]
}

type EntityAttribute = {
  attributeName: string
  dataType: string
  isPrimaryKey: boolean
  isNullable: boolean
}

type Entity = {
  entityName: string
  attributes: EntityAttribute[]
}

export type CreateTableSpecSource = {
  ddlScript?: string | null
  schemaJson?: string | SpecificationSchemaJsonTable[] | null
  entities?: Entity[] | null
}

export type CreateTableSqlGenerateOptions = {
  includeForeignKeys?: boolean
}

function escapeSqlIdentifier(value: string) {
  return `[${value.replace(/]/g, ']]')}]`
}

function parseSchemaJson(
  raw: string | SpecificationSchemaJsonTable[] | null | undefined
): SchemaTable[] {
  if (raw == null) return []
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is SchemaTable => {
        const tableName = (item as { tableName?: unknown }).tableName
        const columns = (item as { columns?: unknown }).columns
        return (
          typeof tableName === 'string' &&
          tableName.trim().length > 0 &&
          Array.isArray(columns)
        )
      })
      .map((table) => ({
        tableName: table.tableName,
        columns: Array.isArray(table.columns) ? table.columns : []
      }))
  } catch {
    return []
  }
}

function mapEntitiesToSchemaTables(entities: Entity[] | null | undefined) {
  if (!Array.isArray(entities)) return []

  return entities
    .filter(
      (entity) =>
        typeof entity.entityName === 'string' &&
        entity.entityName.trim().length > 0
    )
    .map((entity) => ({
      tableName: entity.entityName.trim(),
      columns: Array.isArray(entity.attributes)
        ? entity.attributes
            .filter(
              (attribute) =>
                typeof attribute.attributeName === 'string' &&
                attribute.attributeName.trim().length > 0
            )
            .map((attribute) => ({
              columnName: attribute.attributeName.trim(),
              dataType:
                typeof attribute.dataType === 'string' &&
                attribute.dataType.trim().length > 0
                  ? attribute.dataType.trim()
                  : 'NVARCHAR(255)',
              primaryKey: Boolean(attribute.isPrimaryKey),
              nullable: Boolean(attribute.isNullable)
            }))
        : []
    }))
}

function normalizeTableName(name: string | null | undefined) {
  return (name ?? '')
    .trim()
    .replace(/^\[|\]$/g, '')
    .toUpperCase()
}

export function getCreateTableSpecTables(
  specification: CreateTableSpecSource | null | undefined
) {
  const parsed = parseSchemaJson(specification?.schemaJson)
  if (parsed.length > 0) return parsed
  return mapEntitiesToSchemaTables(specification?.entities)
}

function buildCreateTableSql(
  allTables: SchemaTable[],
  selectedTableNames: Set<string>,
  options: CreateTableSqlGenerateOptions = {}
) {
  const includeForeignKeys = options.includeForeignKeys ?? true
  const selectedTables = allTables.filter((table) =>
    selectedTableNames.has(table.tableName.toUpperCase())
  )

  if (selectedTables.length === 0) return ''

  const createStatements = selectedTables.map((table) => {
    const lines: string[] = []

    for (const column of table.columns) {
      const type =
        typeof column.dataType === 'string' && column.dataType.trim().length > 0
          ? column.dataType.trim()
          : 'NVARCHAR(255)'
      const nullable = column.primaryKey
        ? false
        : column.nullable === undefined
          ? true
          : Boolean(column.nullable)

      let definition = `  ${escapeSqlIdentifier(column.columnName)} ${type}`
      if (column.autoIncrement) {
        definition += ' IDENTITY(1,1)'
      }
      definition += nullable ? ' NULL' : ' NOT NULL'
      if (column.unique && !column.primaryKey) {
        definition += ' UNIQUE'
      }
      lines.push(definition)
    }

    const primaryKeys = table.columns
      .filter((column) => column.primaryKey)
      .map((column) => escapeSqlIdentifier(column.columnName))

    if (primaryKeys.length > 0) {
      lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`)
    }

    return `CREATE TABLE ${escapeSqlIdentifier(table.tableName)} (\n${lines.join(',\n')}\n);`
  })

  const alterStatements: string[] = []

  if (includeForeignKeys) {
    for (const table of selectedTables) {
      const fkByTarget = new Map<
        string,
        Array<{ sourceColumn: string; targetColumn: string }>
      >()

      table.columns.forEach((column) => {
        const targetTable = column.referencesTable?.trim()
        const targetColumn = column.referencesColumn?.trim()
        if (!column.foreignKey || !targetTable || !targetColumn) return
        if (!selectedTableNames.has(targetTable.toUpperCase())) return

        const existing = fkByTarget.get(targetTable) ?? []
        existing.push({
          sourceColumn: column.columnName,
          targetColumn
        })
        fkByTarget.set(targetTable, existing)
      })

      fkByTarget.forEach((mappings, targetTable) => {
        if (mappings.length === 0) return
        const sourceColumns = mappings.map((mapping) =>
          escapeSqlIdentifier(mapping.sourceColumn)
        )
        const targetColumns = mappings.map((mapping) =>
          escapeSqlIdentifier(mapping.targetColumn)
        )

        alterStatements.push(
          `ALTER TABLE ${escapeSqlIdentifier(table.tableName)} ADD FOREIGN KEY (${sourceColumns.join(', ')}) REFERENCES ${escapeSqlIdentifier(targetTable)} (${targetColumns.join(', ')});`
        )
      })
    }
  }

  return [...createStatements, ...alterStatements].join('\n\n')
}

function buildCreateTableSqlFromDdl(
  ddlScript: string,
  selectedTableNames: Set<string>,
  options: CreateTableSqlGenerateOptions = {}
) {
  const includeForeignKeys = options.includeForeignKeys ?? true
  const selectedCreates: string[] = []
  const createTableRegex =
    /CREATE\s+TABLE\s+(\[[^\]]+\]|[A-Za-z0-9_]+)\s*\(([\s\S]*?)\)\s*;/gi

  let createMatch = createTableRegex.exec(ddlScript)
  while (createMatch) {
    const tableName = normalizeTableName(createMatch[1])
    if (selectedTableNames.has(tableName)) {
      selectedCreates.push(createMatch[0].trim())
    }
    createMatch = createTableRegex.exec(ddlScript)
  }

  if (!includeForeignKeys) {
    return selectedCreates.join('\n\n')
  }

  const selectedAlters: string[] = []
  const alterTableRegex = /ALTER\s+TABLE\s+[\s\S]*?;/gi
  let alterMatch = alterTableRegex.exec(ddlScript)
  while (alterMatch) {
    const statement = alterMatch[0].trim()
    const sourceMatch = statement.match(
      /ALTER\s+TABLE\s+(\[[^\]]+\]|[A-Za-z0-9_]+)/i
    )
    const sourceTable = normalizeTableName(sourceMatch?.[1] ?? '')
    if (!selectedTableNames.has(sourceTable)) {
      alterMatch = alterTableRegex.exec(ddlScript)
      continue
    }

    const refMatch = statement.match(/REFERENCES\s+(\[[^\]]+\]|[A-Za-z0-9_]+)/i)
    if (refMatch) {
      const refTable = normalizeTableName(refMatch[1])
      if (!selectedTableNames.has(refTable)) {
        alterMatch = alterTableRegex.exec(ddlScript)
        continue
      }
    }

    selectedAlters.push(statement)
    alterMatch = alterTableRegex.exec(ddlScript)
  }

  if (selectedCreates.length === 0) return ''
  return [...selectedCreates, ...selectedAlters].join('\n\n')
}

export function buildCreateTableSqlFromSpecSelection(
  specification: CreateTableSpecSource | null | undefined,
  selectedTableNames: string[],
  options: CreateTableSqlGenerateOptions = {}
) {
  const selectedTables = new Set(
    selectedTableNames.map((name) => normalizeTableName(name)).filter(Boolean)
  )
  if (selectedTables.size === 0) return ''

  const ddlScript = specification?.ddlScript?.trim() ?? ''
  const scriptFromDdl = ddlScript
    ? buildCreateTableSqlFromDdl(ddlScript, selectedTables, options)
    : ''
  if (scriptFromDdl.trim()) return scriptFromDdl

  return buildCreateTableSql(
    getCreateTableSpecTables(specification),
    selectedTables,
    options
  )
}
