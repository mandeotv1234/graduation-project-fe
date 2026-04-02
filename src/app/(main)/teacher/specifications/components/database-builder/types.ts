export type ColumnDef = {
  id: string
  name: string
  type: string
  isPrimaryKey: boolean
  isNotNull: boolean
  isUnique: boolean
  isAutoIncrement: boolean
}

export type ForeignKeyDef = {
  id: string
  targetTableId: string
  columnMapping: { sourceColumnId: string; targetColumnId: string }[]
}

export type RowDef = {
  id: string
  values: Record<string, string>
}

export type TableDef = {
  id: string
  name: string
  columns: ColumnDef[]
  foreignKeys: ForeignKeyDef[]
}

export type DatasetDef = {
  id: string
  name: string
  rowsByTable: Record<string, RowDef[]>
  originalId?: number // id given by the backend, used for updates
}

export type AppState = {
  tables: TableDef[]
  datasets: DatasetDef[]
}
