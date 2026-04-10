/**
 * Canonical shape of persisted `schema_json` (API / DB).
 * Keep in sync with `buildSchemaJson` and `parseSpecificationToAppState`.
 */
export type SpecificationSchemaJsonColumn = {
  columnName: string
  dataType: string
  primaryKey: boolean
  foreignKey?: boolean
  referencesTable?: string | null
  referencesColumn?: string | null
  /** When omitted, treat as NOT NULL (matches older payloads). */
  nullable?: boolean
  /** UNIQUE (non-PK columns); PK uniqueness is also implied by `primaryKey`. */
  unique?: boolean
  autoIncrement?: boolean
}

export type SpecificationSchemaJsonForeignKey = {
  name?: string
  sourceColumns: string[]
  targetTable: string
  targetColumns: string[]
  onDelete?: string
  onUpdate?: string
}

export type SpecificationSchemaJsonTable = {
  tableName: string
  script?: string
  columns: SpecificationSchemaJsonColumn[]
  foreignKeys?: SpecificationSchemaJsonForeignKey[]
}
