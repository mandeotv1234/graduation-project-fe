// NOTE: All consumers now import directly from their respective module files.
// This barrel file is kept for backward compatibility only.
// New components should NOT be added here — import directly from the module file instead.

export { SqlEditor } from '@/components/shared/sql-editor'
export { SqlViewer } from '@/components/shared/sql-viewer/sql-viewer'
export { ResizablePanel } from '@/components/shared/resizable-panel'
export { ExamSpecificationView } from '@/components/shared/exam-specification-view'
export { TeacherSqlEditor } from '@/components/shared/teacher-sql-editor'
export { EntitiesEditor } from '@/components/shared/entities-editor'
export {
  TeacherSchemaDiagram,
  buildInitialSchemaDiagram
} from '@/components/shared/teacher-schema-diagram'
export { StudentCommonPartView } from '@/components/shared/student-common-part-view'
export { DatasetTableView } from '@/components/shared/dataset-table-view'
export {
  Spinner,
  PageSpinner,
  ButtonSpinner
} from '@/components/shared/spinner'
