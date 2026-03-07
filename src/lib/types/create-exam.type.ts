export interface SampleDataRow {
  studentId: string
  firstName: string
  lastName: string
}

export interface ExamFormData {
  title: string
  description: string
  schema: string
  sampleData: SampleDataRow[]
  attachments: File[]
}

export interface SchemaTab {
  id: string
  label: string
  content: string
}
