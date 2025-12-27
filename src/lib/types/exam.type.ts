export interface Question {
  id: number
  title: string
  status: string
  description: string
  defaultCode?: string
}

export interface Columns {
  name: string
  type: string
}

export interface TableSchema {
  name: string
  columns: Columns[]
}
