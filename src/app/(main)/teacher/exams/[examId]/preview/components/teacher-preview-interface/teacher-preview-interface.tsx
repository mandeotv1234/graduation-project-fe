'use client'

import { ConfirmSubmitDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-submit-dialog/confirm-submit-dialog'
import { ExamTakeBottomPanel } from '@/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel/exam-take-bottom-panel'
import { QuestionPanel } from '@/app/(main)/student/exams/[examId]/take/components/question-panel/question-panel'
import { QuestionSidebar } from '@/app/(main)/student/exams/[examId]/take/components/question-sidebar/question-sidebar'
import { SqlEditorPanel } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel/sql-editor-panel'
import { SubmitResultDialog } from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog/submit-result-dialog'
import { useExamTake } from '@/app/(main)/student/exams/[examId]/take/hooks/use-exam-take'
import { PageSpinner } from '@/components/shared'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import {
  TeacherSchemaDiagram,
  buildInitialSchemaDiagram
} from '@/components/shared/teacher-schema-diagram'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useExamTimer } from '@/hooks/use-exam-timer'
import { fetchExamPdfBlobUrl } from '@/lib/api/pdf-client'
import { getExamSpecification } from '@/lib/actions'
import {
  clearPreviewSchema,
  initializePreviewSchema,
  submitExamPreview
} from '@/lib/actions/preview.action'
import { PATH } from '@/lib/constants'
import type {
  ExecuteSqlResponse,
  ExamQuestionItem,
  ExamSpecification,
  SpecificationSchemaJsonTable,
  StudentExamDetail
} from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Clock,
  Columns2,
  Keyboard,
  Loader2,
  Send,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { SchemaTable } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel/sql-editor-panel'
import styles from './teacher-preview-interface.module.scss'

interface TeacherPreviewInterfaceProps {
  exam: StudentExamDetail
  questions: ExamQuestionItem[]
}

type SchemaMeta = NonNullable<ExecuteSqlResponse['schema']>

function normalizeSchemaName(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function parseSpecificationSchemaJson(
  rawSchemaJson: ExamSpecification['schemaJson']
): SpecificationSchemaJsonTable[] {
  if (Array.isArray(rawSchemaJson)) return rawSchemaJson
  if (typeof rawSchemaJson !== 'string' || !rawSchemaJson.trim()) return []

  try {
    const parsed = JSON.parse(rawSchemaJson)
    return Array.isArray(parsed)
      ? (parsed as SpecificationSchemaJsonTable[])
      : []
  } catch {
    return []
  }
}

function buildSpecificationSchemaMeta(
  specification: ExamSpecification | null
): SchemaMeta {
  if (!specification) return []

  const schemaTables = parseSpecificationSchemaJson(specification.schemaJson)
  if (schemaTables.length > 0) {
    const tableNames = new Set(
      schemaTables
        .map((table) => normalizeSchemaName(table.tableName))
        .filter(Boolean)
    )

    return schemaTables.map((table) => {
      const foreignKeyByColumn = new Map<
        string,
        { referencesTable: string; referencesColumn: string }
      >()

      ;(table.foreignKeys || []).forEach((foreignKey) => {
        foreignKey.sourceColumns.forEach((sourceColumn, index) => {
          const referencesColumn = foreignKey.targetColumns[index]
          if (!sourceColumn || !foreignKey.targetTable || !referencesColumn) {
            return
          }
          foreignKeyByColumn.set(normalizeSchemaName(sourceColumn), {
            referencesTable: foreignKey.targetTable,
            referencesColumn
          })
        })
      })

      table.columns.forEach((column) => {
        const columnKey = normalizeSchemaName(column.columnName)
        if (
          foreignKeyByColumn.has(columnKey) ||
          !column.foreignKey ||
          !column.referencesTable ||
          !column.referencesColumn
        ) {
          return
        }
        foreignKeyByColumn.set(columnKey, {
          referencesTable: column.referencesTable,
          referencesColumn: column.referencesColumn
        })
      })

      return {
        tableName: table.tableName,
        columns: table.columns.map((column) => {
          const foreignKey = foreignKeyByColumn.get(
            normalizeSchemaName(column.columnName)
          )
          const hasValidForeignKey = Boolean(
            foreignKey &&
            tableNames.has(normalizeSchemaName(foreignKey.referencesTable))
          )

          return {
            columnName: column.columnName,
            dataType: column.dataType,
            primaryKey: Boolean(column.primaryKey),
            nullable: column.nullable ?? false,
            foreignKey: hasValidForeignKey,
            referencesTable: hasValidForeignKey
              ? foreignKey!.referencesTable
              : null,
            referencesColumn: hasValidForeignKey
              ? foreignKey!.referencesColumn
              : null,
            foreignKeys: hasValidForeignKey
              ? [
                  {
                    referencesTable: foreignKey!.referencesTable,
                    referencesColumn: foreignKey!.referencesColumn
                  }
                ]
              : []
          }
        })
      }
    })
  }

  return (specification.entities || []).map((entity) => ({
    tableName: entity.entityName,
    columns: entity.attributes.map((attribute) => ({
      columnName: attribute.attributeName,
      dataType: attribute.dataType,
      primaryKey: Boolean(attribute.isPrimaryKey),
      nullable: Boolean(attribute.isNullable),
      foreignKey: false,
      referencesTable: null,
      referencesColumn: null,
      foreignKeys: []
    }))
  }))
}

function hasDiagramNodes(diagramData?: string | null) {
  if (!diagramData?.trim()) return false
  try {
    const parsed = JSON.parse(diagramData) as { nodes?: unknown[] }
    return Array.isArray(parsed.nodes) && parsed.nodes.length > 0
  } catch {
    return false
  }
}

export function TeacherPreviewInterface({
  exam,
  questions
}: TeacherPreviewInterfaceProps) {
  const router = useRouter()

  const [sessionStarted, setSessionStarted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editorSchema, setEditorSchema] = useState<SchemaTable[]>([])
  const [editorRoutines, setEditorRoutines] = useState<
    ExecuteSqlResponse['routines']
  >([])
  const [schemaMeta, setSchemaMeta] =
    useState<ExecuteSqlResponse['schema']>(null)
  const [isOverviewSelected, setIsOverviewSelected] = useState(true)
  const [specViewMode, setSpecViewMode] = useState<'table' | 'diagram'>('table')
  const [layoutMode, setLayoutMode] = useState<'default' | 'split'>('default')
  const [showShortcutHint, setShowShortcutHint] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [examSpecification, setExamSpecification] =
    useState<ExamSpecification | null>(null)
  const hasPdf = useMemo(
    () => Boolean(exam.pdfFilePath && exam.pdfFilePath.trim().length > 0),
    [exam.pdfFilePath]
  )
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  const specificationSchemaMeta = useMemo(
    () => buildSpecificationSchemaMeta(examSpecification),
    [examSpecification]
  )
  const overviewSchemaMeta = useMemo(
    () =>
      schemaMeta && schemaMeta.length > 0
        ? schemaMeta
        : specificationSchemaMeta,
    [schemaMeta, specificationSchemaMeta]
  )

  const schemaTablesForOverview = useMemo(() => {
    return overviewSchemaMeta.map((table) => ({
      tableName: table.tableName,
      columns: table.columns.map((col) => ({
        name: col.columnName,
        type: col.dataType,
        primaryKey: Boolean(col.primaryKey),
        nullable: Boolean(col.nullable),
        foreignKey: Boolean(col.foreignKey),
        referencesTable: col.referencesTable ?? null,
        referencesColumn: col.referencesColumn ?? null
      }))
    }))
  }, [overviewSchemaMeta])

  const schemaDiagramData = useMemo(() => {
    if (schemaMeta && schemaMeta.length > 0) {
      return JSON.stringify(buildInitialSchemaDiagram(schemaMeta))
    }
    if (hasDiagramNodes(examSpecification?.schemaDiagram)) {
      return examSpecification!.schemaDiagram!
    }
    if (specificationSchemaMeta.length > 0) {
      return JSON.stringify(buildInitialSchemaDiagram(specificationSchemaMeta))
    }
    return null
  }, [examSpecification, schemaMeta, specificationSchemaMeta])

  const applySchemaMeta = useCallback(
    (
      schema: ExecuteSqlResponse['schema'],
      routines?: ExecuteSqlResponse['routines']
    ) => {
      setSchemaMeta(schema)
      setEditorRoutines(routines || [])
      setEditorSchema(
        schema
          ? schema.map((table) => ({
              tableName: table.tableName,
              columns: table.columns.map((col) => ({
                name: col.columnName,
                type: col.dataType
              }))
            }))
          : []
      )
    },
    []
  )

  const examTake = useExamTake(exam, questions)

  useEffect(() => {
    if (!hasPdf) {
      setPdfBlobUrl(null)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    fetchExamPdfBlobUrl(exam.examId)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl)
          return
        }
        objectUrl = blobUrl
        setPdfBlobUrl(blobUrl)
      })
      .catch(() => {
        if (!cancelled) setPdfBlobUrl(null)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [exam.examId, hasPdf])

  // Timer counts down but never force-submits (allowOvertime intentionally true)
  const { remainingSeconds } = useExamTimer({
    examId: exam.examId,
    initialSeconds: (exam.durationMinutes ?? 90) * 60,
    enabled: sessionStarted && !examTake.isSubmitted,
    allowOvertime: true,
    onTimeUp: undefined
  })

  // Initialize preview schema on mount
  useEffect(() => {
    async function initPreview() {
      setLoading(true)
      setError(null)
      try {
        const res = await initializePreviewSchema(exam.examId)
        if (res.data?.schema) {
          applySchemaMeta(res.data.schema as ExecuteSqlResponse['schema'])
        }
        setSessionStarted(true)
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Không thể khởi tạo schema xem thử'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }
    initPreview()
  }, [exam.examId, applySchemaMeta])

  // Load spec for IntelliSense — runs once; editorSchema functional update guards against
  // overwriting a real sandbox schema that may have loaded concurrently
  useEffect(() => {
    getExamSpecification(exam.examId)
      .then((res) => {
        const spec: ExamSpecification | null = res.data ?? null
        if (!spec) return
        setExamSpecification(spec)
        const specTables: SchemaTable[] = buildSpecificationSchemaMeta(
          spec
        ).map((table) => ({
          tableName: table.tableName,
          columns: table.columns.map((column) => ({
            name: column.columnName,
            type: column.dataType
          }))
        }))

        // Only apply spec schema if real sandbox schema hasn't loaded yet
        setEditorSchema((current) =>
          current.length > 0 ? current : specTables
        )
      })
      .catch(() => {
        /* silent — IntelliSense just won't have schema context */
      })
  }, [exam.examId])

  const handleExecuteSqlAndRefreshSchema = useCallback(async () => {
    const res = await examTake.handleExecuteSql()
    const schema = res?.schema
    if (!schema || schema.length === 0) return
    applySchemaMeta(schema, res?.routines)
  }, [examTake, applySchemaMeta])

  const handleExecuteSelectedSql = useCallback(
    async (selectedSql: string) => {
      const res = await examTake.handleExecuteSql(selectedSql)
      const schema = res?.schema
      if (!schema || schema.length === 0) return
      applySchemaMeta(schema, res?.routines)
    },
    [examTake, applySchemaMeta]
  )

  const handleClearSchema = useCallback(async () => {
    setIsClearing(true)
    try {
      const res = await clearPreviewSchema(exam.examId)
      if (res.code === 'OK') {
        toast.success('Đã xoá sạch schema xem thử!')
        applySchemaMeta([])
      } else {
        toast.error(res.message || 'Xoá schema thất bại')
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Lỗi hệ thống khi xoá schema'
      )
    } finally {
      setIsClearing(false)
    }
  }, [exam.examId, applySchemaMeta])

  const isSubmittingRef = useRef(false)
  const handlePreviewSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    examTake.setIsGrading(true)
    try {
      const answers = questions.map((q) => ({
        questionId: q.id,
        studentQuery: examTake.answers[q.id] ?? ''
      }))
      const res = await submitExamPreview(exam.examId, answers)
      if (res.data) {
        examTake.setSubmitResult(res.data)
        examTake.setIsSubmitted(true)
      } else {
        toast.error('Chấm bài thất bại')
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Lỗi khi nộp bài xem thử'
      )
    } finally {
      examTake.setIsGrading(false)
      isSubmittingRef.current = false
    }
  }, [exam.examId, examTake, questions])

  const formatTime = useCallback((seconds: number): string => {
    const sAbs = Math.abs(seconds)
    const h = Math.floor(sAbs / 3600)
    const m = Math.floor((sAbs % 3600) / 60)
    const s = Math.floor(sAbs % 60)
    const text =
      h > 0
        ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return seconds < 0 ? `-${text}` : text
  }, [])

  const getTimerState = useCallback((seconds: number) => {
    if (seconds <= 30) return 'critical'
    if (seconds <= 60) return 'danger'
    if (seconds <= 300) return 'warning'
    return 'normal'
  }, [])

  const timerState = getTimerState(remainingSeconds)
  const timerClass =
    timerState === 'critical'
      ? styles.critical
      : timerState === 'danger'
        ? styles.danger
        : timerState === 'warning'
          ? styles.warning
          : ''

  const renderPdfSpecificationPanel = (headingClassName: string) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <h4 className={cn('font-semibold text-foreground', headingClassName)}>
          {exam.originalPdfFileName || 'Đặc tả PDF'}
        </h4>
      </div>
      <div className="min-h-0 flex-1 p-3">
        {pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            title={exam.originalPdfFileName || 'Đặc tả PDF'}
            className="h-full w-full rounded-lg border border-border bg-background"
          />
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )

  // Keyboard shortcuts
  useEffect(() => {
    if (!sessionStarted) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.code === 'KeyS' || e.key.toLowerCase() === 's')) {
        e.preventDefault()
        if (layoutMode === 'default') setIsOverviewSelected((prev) => !prev)
      }
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        if (layoutMode === 'split') {
          if (examTake.currentQuestionIndex > 0)
            examTake.goToQuestion(examTake.currentQuestionIndex - 1)
        } else if (!isOverviewSelected) {
          if (examTake.currentQuestionIndex > 0)
            examTake.goToQuestion(examTake.currentQuestionIndex - 1)
          else setIsOverviewSelected(true)
        }
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        if (layoutMode === 'split') {
          if (examTake.currentQuestionIndex < questions.length - 1)
            examTake.goToQuestion(examTake.currentQuestionIndex + 1)
        } else if (!isOverviewSelected) {
          if (examTake.currentQuestionIndex < questions.length - 1)
            examTake.goToQuestion(examTake.currentQuestionIndex + 1)
          else setIsOverviewSelected(true)
        } else {
          setIsOverviewSelected(false)
          if (questions.length > 0) examTake.goToQuestion(0)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    sessionStarted,
    isOverviewSelected,
    layoutMode,
    examTake,
    questions.length
  ])

  if (loading) return <PageSpinner label="Đang khởi tạo schema xem thử..." />

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          onClick={() => router.push(PATH.TEACHER_EXAM_DETAIL(exam.examId))}
        >
          Quay lại đề thi
        </Button>
      </div>
    )
  }

  if (examTake.isSubmitted && examTake.submitResult) {
    return (
      <SubmitResultDialog
        result={examTake.submitResult}
        showResult
        onBack={() => router.push(PATH.TEACHER_EXAM_DETAIL(exam.examId))}
      />
    )
  }

  return (
    <>
      {/* Grading overlay */}
      {examTake.isGrading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loaderContent}>
            <div className={styles.spinnerBox}>
              <div className={styles.spinnerBg} />
              <div className={styles.spinnerFg} />
            </div>
            <div>
              <h2 className={styles.title}>Đang chấm bài xem thử...</h2>
              <p className={styles.subtitle}>
                Vui lòng không thoát trang. Kết quả sẽ hiển thị ngay.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.interfaceContainer}>
        {/* Orange preview banner */}
        <div className="flex shrink-0 items-center justify-between bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          <span>CHẾ ĐỘ XEM THỬ — kết quả sẽ không được lưu vào hệ thống</span>
          <button
            type="button"
            className="cursor-pointer flex items-center gap-1.5 rounded border border-white/30 px-2.5 py-1 text-xs font-medium hover:bg-orange-600"
            onClick={() => router.push(PATH.TEACHER_EXAM_DETAIL(exam.examId))}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Thoát xem thử
          </button>
        </div>

        <div className={styles.mainContent}>
          {/* Left: Question sidebar (default mode) or Spec panel (split mode) */}
          {layoutMode === 'split' ? (
            <div className={styles.splitSpecPanel}>
              {hasPdf ? (
                renderPdfSpecificationPanel('text-xs uppercase tracking-wide')
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      Đặc tả CSDL
                    </h4>
                    <div className="flex rounded border border-border bg-background p-0.5">
                      <button
                        type="button"
                        onClick={() => setSpecViewMode('table')}
                        className={cn(
                          'rounded px-2 py-1 text-[10px] font-medium transition-colors',
                          specViewMode === 'table'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        Bảng
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpecViewMode('diagram')}
                        className={cn(
                          'rounded px-2 py-1 text-[10px] font-medium transition-colors',
                          specViewMode === 'diagram'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        Sơ đồ
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    {specViewMode === 'table' ? (
                      <ScrollArea className="h-full">
                        <div className="space-y-2 p-2">
                          {schemaTablesForOverview.length > 0 ? (
                            schemaTablesForOverview.map((table) => (
                              <div
                                key={table.tableName}
                                className="overflow-hidden rounded border border-border/70"
                              >
                                <div className="border-b border-border bg-muted/30 px-2 py-1.5 text-xs font-semibold text-primary">
                                  {table.tableName}
                                </div>
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/20 text-muted-foreground">
                                    <tr>
                                      <th className="border-b border-r border-border px-2 py-1.5 text-left">
                                        Cột
                                      </th>
                                      <th className="border-b border-r border-border px-2 py-1.5 text-left">
                                        Kiểu
                                      </th>
                                      <th className="border-b border-border px-2 py-1.5 text-left">
                                        Ràng buộc
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {table.columns.map((col) => (
                                      <tr
                                        key={`${table.tableName}-${col.name}`}
                                        className="odd:bg-background even:bg-muted/10"
                                      >
                                        <td className="border-r border-border px-2 py-1 font-medium text-foreground">
                                          {col.name}
                                        </td>
                                        <td className="border-r border-border px-2 py-1 font-mono text-[10px] text-muted-foreground">
                                          {col.type}
                                        </td>
                                        <td className="px-2 py-1 text-[10px] text-muted-foreground">
                                          {[
                                            col.primaryKey ? 'PK' : null,
                                            col.foreignKey ? 'FK' : null,
                                            !col.nullable ? 'NOT NULL' : null
                                          ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))
                          ) : (
                            <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
                              Chưa có thông tin schema
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="h-full min-h-[300px] w-full">
                        {schemaDiagramData ? (
                          <TeacherSchemaDiagram
                            diagramData={schemaDiagramData}
                            className="h-full border-0 rounded-none"
                          />
                        ) : (
                          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                            Chưa có thông tin lược đồ
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.desktopQuestionSidebar}>
              <QuestionSidebar
                questions={questions}
                currentIndex={examTake.currentQuestionIndex}
                answers={examTake.answers}
                onSelect={(index) => {
                  setIsOverviewSelected(false)
                  examTake.goToQuestion(index)
                }}
                onSelectOverview={() => setIsOverviewSelected(true)}
                isOverviewSelected={isOverviewSelected}
                header={null}
              />
            </div>
          )}

          {/* Right: header + question prompt + editor */}
          <div className={styles.rightPanel}>
            {/* Header bar */}
            <div className={styles.headerBar}>
              <div className={styles.statusActions}>
                <div className={styles.progressContainer}>
                  <div className={styles.progressText}>
                    Tiến độ: {examTake.answeredCount}/{questions.length} câu
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${questions.length > 0 ? (examTake.answeredCount / questions.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={() => setShowShortcutHint((p) => !p)}
                    title="Phím tắt bàn phím (Alt+S, Alt+←, Alt+→)"
                    className={cn(
                      'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors',
                      showShortcutHint
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Phím tắt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLayoutMode((m) => {
                        const next = m === 'default' ? 'split' : 'default'
                        if (next === 'split' && isOverviewSelected)
                          setIsOverviewSelected(false)
                        return next
                      })
                    }
                    className={cn(
                      'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
                      layoutMode === 'split'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Columns2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {layoutMode === 'split' ? 'Gộp lại' : 'Chia đôi'}
                    </span>
                  </button>
                  <div className={`${styles.timer} ${timerClass}`}>
                    <Clock
                      className={`h-4 w-4 ${timerState === 'normal' ? 'text-primary' : ''}`}
                    />
                    <span>{formatTime(remainingSeconds)}</span>
                    {remainingSeconds < 0 && (
                      <span className="ml-1 text-xs opacity-75">(hết giờ)</span>
                    )}
                  </div>
                  <Button
                    onClick={() => examTake.setShowConfirmDialog(true)}
                    disabled={examTake.isGrading}
                    size="sm"
                    className={styles.submitBtn}
                  >
                    <Send className="h-4 w-4" />
                    Nộp bài
                  </Button>
                </div>
              </div>
            </div>

            {/* Shortcut hint panel */}
            {showShortcutHint && (
              <div className={styles.shortcutHintPanel}>
                <div className={styles.shortcutHintTitle}>
                  <span className="flex items-center gap-1.5">
                    <Keyboard className="h-3.5 w-3.5" />
                    Phím tắt bàn phím
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowShortcutHint(false)}
                    className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Đặc tả ↔ Câu hỏi</span>
                  <kbd className={styles.kbd}>Alt + S</kbd>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Câu trước</span>
                  <kbd className={styles.kbd}>Alt + ←</kbd>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Câu tiếp theo</span>
                  <kbd className={styles.kbd}>Alt + →</kbd>
                </div>
                <p className={styles.shortcutNote}>
                  * Phím tắt hoạt động ở cả hai chế độ xem
                </p>
              </div>
            )}

            {/* Mobile question nav (default mode only) */}
            {layoutMode === 'default' && (
              <div className={styles.mobileQuestionNav}>
                <QuestionSidebar
                  questions={questions}
                  currentIndex={examTake.currentQuestionIndex}
                  answers={examTake.answers}
                  onSelect={(index) => {
                    setIsOverviewSelected(false)
                    examTake.goToQuestion(index)
                  }}
                  onSelectOverview={() => setIsOverviewSelected(true)}
                  isOverviewSelected={isOverviewSelected}
                  header={null}
                />
              </div>
            )}

            {/* Mini nav strip (split mode) */}
            {layoutMode === 'split' && (
              <div className={styles.miniQuestionNav}>
                {questions.map((q, i) => {
                  const isActive = i === examTake.currentQuestionIndex
                  const hasAnswer = !!examTake.answers[q.id]?.trim()
                  return (
                    <button
                      key={q.id}
                      onClick={() => examTake.goToQuestion(i)}
                      className={cn(
                        styles.miniNavBtn,
                        isActive
                          ? styles.miniNavActive
                          : hasAnswer
                            ? styles.miniNavAnswered
                            : styles.miniNavIdle
                      )}
                    >
                      <span>Câu {q.orderIndex}</span>
                      {hasAnswer && (
                        <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Question prompt area */}
            <div className={styles.questionPrompt}>
              {layoutMode === 'split' ? (
                examTake.currentQuestion ? (
                  <div className={styles.panelWrapper}>
                    <QuestionPanel question={examTake.currentQuestion} />
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    Chọn một câu hỏi để bắt đầu
                  </div>
                )
              ) : isOverviewSelected ? (
                <div className={styles.panelWrapper}>
                  <h3 className="text-lg font-semibold text-foreground">
                    {exam.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {examSpecification?.description || exam.description || ''}
                  </p>
                </div>
              ) : examTake.currentQuestion ? (
                <div className={styles.panelWrapper}>
                  <QuestionPanel question={examTake.currentQuestion} />
                </div>
              ) : (
                <div className={styles.emptyState}>
                  Chọn một câu hỏi để bắt đầu
                </div>
              )}
            </div>

            {/* Editor + bottom panel */}
            <div className={styles.editorArea}>
              {layoutMode === 'split' ? (
                examTake.currentQuestion ? (
                  <ResizablePanel defaultSize={65} minSize={30} maxSize={85}>
                    <SqlEditorPanel
                      value={
                        examTake.answers[examTake.currentQuestion.id] || ''
                      }
                      onChange={(val) =>
                        examTake.updateAnswer(examTake.currentQuestion!.id, val)
                      }
                      onExecute={handleExecuteSqlAndRefreshSchema}
                      onExecuteSelected={handleExecuteSelectedSql}
                      onClearSchema={handleClearSchema}
                      isLoading={examTake.isLoading}
                      isClearing={isClearing}
                      schema={editorSchema}
                      routines={editorRoutines || []}
                    />
                    <ExamTakeBottomPanel
                      examId={exam.examId}
                      result={examTake.sqlResult}
                      schemaMeta={schemaMeta}
                      onSchemaMetaChange={(schema) => applySchemaMeta(schema)}
                    />
                  </ResizablePanel>
                ) : (
                  <div className={styles.emptyStateCenter}>
                    Chọn một câu hỏi để bắt đầu
                  </div>
                )
              ) : isOverviewSelected ? (
                hasPdf ? (
                  renderPdfSpecificationPanel('text-sm')
                ) : (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        Đặc tả CSDL
                      </h4>
                      <div className="flex rounded-lg border border-border bg-background p-0.5">
                        <button
                          type="button"
                          onClick={() => setSpecViewMode('table')}
                          className={cn(
                            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            specViewMode === 'table'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          Dạng bảng
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpecViewMode('diagram')}
                          className={cn(
                            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            specViewMode === 'diagram'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          Sơ đồ quan hệ
                        </button>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-hidden">
                      {specViewMode === 'table' ? (
                        <ScrollArea className="h-full">
                          <div className="space-y-3 p-4">
                            {schemaTablesForOverview.length > 0 ? (
                              schemaTablesForOverview.map((table) => (
                                <div
                                  key={table.tableName}
                                  className="overflow-hidden rounded-lg border border-border"
                                >
                                  <div className="border-b border-border bg-muted/50 px-3 py-2 text-sm font-semibold text-primary">
                                    {table.tableName}
                                  </div>
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/30 text-muted-foreground">
                                      <tr>
                                        <th className="border-b border-r border-border px-3 py-2 text-left">
                                          Cột
                                        </th>
                                        <th className="border-b border-r border-border px-3 py-2 text-left">
                                          Kiểu
                                        </th>
                                        <th className="border-b border-border px-3 py-2 text-left">
                                          Ràng buộc
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {table.columns.map((col) => (
                                        <tr
                                          key={`${table.tableName}-${col.name}`}
                                          className="odd:bg-background even:bg-muted/10"
                                        >
                                          <td className="border-r border-border px-3 py-1.5 font-medium">
                                            {col.name}
                                          </td>
                                          <td className="border-r border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">
                                            {col.type}
                                          </td>
                                          <td className="px-3 py-1.5 text-xs text-muted-foreground">
                                            {[
                                              col.primaryKey ? 'PK' : null,
                                              col.foreignKey ? 'FK' : null,
                                              !col.nullable ? 'NOT NULL' : null
                                            ]
                                              .filter(Boolean)
                                              .join(' · ')}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))
                            ) : (
                              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                                Chưa có thông tin schema
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="h-full min-h-[400px] w-full">
                          {schemaDiagramData ? (
                            <TeacherSchemaDiagram
                              diagramData={schemaDiagramData}
                              className="h-full border-0 rounded-none"
                            />
                          ) : (
                            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                              Chưa có thông tin lược đồ
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : examTake.currentQuestion ? (
                <ResizablePanel defaultSize={65} minSize={30} maxSize={85}>
                  <SqlEditorPanel
                    value={examTake.answers[examTake.currentQuestion.id] || ''}
                    onChange={(val) =>
                      examTake.updateAnswer(examTake.currentQuestion!.id, val)
                    }
                    onExecute={handleExecuteSqlAndRefreshSchema}
                    onExecuteSelected={handleExecuteSelectedSql}
                    onClearSchema={handleClearSchema}
                    isLoading={examTake.isLoading}
                    isClearing={isClearing}
                    schema={editorSchema}
                    routines={editorRoutines || []}
                  />
                  <ExamTakeBottomPanel
                    examId={exam.examId}
                    result={examTake.sqlResult}
                    schemaMeta={schemaMeta}
                    onSchemaMetaChange={(schema) => applySchemaMeta(schema)}
                  />
                </ResizablePanel>
              ) : (
                <div className={styles.emptyStateCenter}>
                  Chọn một câu hỏi để bắt đầu
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmSubmitDialog
        open={examTake.showConfirmDialog}
        onOpenChange={examTake.setShowConfirmDialog}
        onConfirm={() => {
          examTake.setShowConfirmDialog(false)
          handlePreviewSubmit()
        }}
        unansweredCount={examTake.unansweredCount}
        totalQuestions={questions.length}
        isLoading={examTake.isGrading}
      />
    </>
  )
}
