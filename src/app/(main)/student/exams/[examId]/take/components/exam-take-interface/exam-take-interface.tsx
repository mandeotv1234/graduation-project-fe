'use client'

import { ViolationWarningModal } from '@/app/(main)/exam/components/violation-warning-modal/violation-warning-modal'
import { BlurOverlay } from '@/app/(main)/exam/components/blur-overlay/blur-overlay'
import { ConfirmLeaveDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-leave-dialog/confirm-leave-dialog'
import { ConfirmSubmitDialog } from '@/app/(main)/student/exams/[examId]/take/components/confirm-submit-dialog/confirm-submit-dialog'
import { DraftRestoredBanner } from '@/app/(main)/student/exams/[examId]/take/components/draft-restored-banner'
import { ExamTakeBottomPanel } from '@/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel/exam-take-bottom-panel'
import { NetworkStatusBanner } from '@/app/(main)/student/exams/[examId]/take/components/network-status-banner'
import { QuestionPanel } from '@/app/(main)/student/exams/[examId]/take/components/question-panel/question-panel'
import { QuestionSidebar } from '@/app/(main)/student/exams/[examId]/take/components/question-sidebar/question-sidebar'
import { SaveStatusIndicator } from '@/app/(main)/student/exams/[examId]/take/components/save-status-indicator'
import type { SchemaTable } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel/sql-editor-panel'
import { SqlEditorPanel } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel/sql-editor-panel'
import { SubmitResultDialog } from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog/submit-result-dialog'
import { useExamDraft } from '@/app/(main)/student/exams/[examId]/take/hooks/use-exam-draft'
import { useExamTake } from '@/app/(main)/student/exams/[examId]/take/hooks/use-exam-take'
import { PageSpinner } from '@/components/shared'
import { DatasetTableView } from '@/components/shared/dataset-table-view'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import {
  TeacherSchemaDiagram,
  buildInitialSchemaDiagram
} from '@/components/shared/teacher-schema-diagram'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAntiCheat } from '@/hooks/use-anti-cheat'
import { useExamSocket } from '@/hooks/use-exam-socket'
import { useExamTimer, type ExamTimerPhase } from '@/hooks/use-exam-timer'
import { clearExamSchema, getExamSpecification, getMe } from '@/lib/actions'
import { getExamTime } from '@/lib/actions/anti-cheat.action'
import { fetchExamPdfBlobUrl } from '@/lib/api/pdf-client'
import type {
  ExecuteSqlResponse,
  SpecificationSchemaJsonTable
} from '@/lib/types'
import {
  ExamQuestionItem,
  ExamSpecification,
  StudentExamDetail,
  SubmitExamResponse,
  User as UserType
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { downloadAnswersBackup } from '@/lib/utils/export-exam-answers'
import {
  Clock,
  Columns2,
  Keyboard,
  Loader2,
  Network,
  Send,
  Table2,
  User,
  X
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import styles from './exam-take-interface.module.scss'

interface ExamTakeInterfaceProps {
  exam: StudentExamDetail
  questions: ExamQuestionItem[]
}

type SchemaOverviewColumn = {
  name: string
  type: string
  primaryKey: boolean
  nullable: boolean
  foreignKey: boolean
  referencesTable: string | null
  referencesColumn: string | null
  unique: boolean
  autoIncrement: boolean
}

type SchemaOverviewTable = {
  tableName: string
  columns: SchemaOverviewColumn[]
}

type SchemaMeta = Array<{
  tableName: string
  columns: Array<{
    columnName: string
    dataType: string
    primaryKey: boolean
    nullable: boolean
    foreignKey?: boolean
    referencesTable?: string | null
    referencesColumn?: string | null
    unique?: boolean
    autoIncrement?: boolean
  }>
}>

function normalizeSchemaName(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function buildSchemaMetaFromSpecTables(
  tables: SpecificationSchemaJsonTable[]
): SchemaMeta {
  const tableNames = new Set(
    tables.map((table) => normalizeSchemaName(table.tableName)).filter(Boolean)
  )

  return tables.map((table) => {
    const fkByColumn = new Map<
      string,
      { referencesTable: string; referencesColumn: string }
    >()

    ;(table.foreignKeys || []).forEach((fk) => {
      fk.sourceColumns.forEach((sourceColumn, index) => {
        const referencesColumn = fk.targetColumns[index]
        if (!sourceColumn || !fk.targetTable || !referencesColumn) return

        fkByColumn.set(normalizeSchemaName(sourceColumn), {
          referencesTable: fk.targetTable,
          referencesColumn
        })
      })
    })

    table.columns.forEach((column) => {
      const columnKey = normalizeSchemaName(column.columnName)
      if (fkByColumn.has(columnKey)) return
      if (
        !column.foreignKey ||
        !column.referencesTable ||
        !column.referencesColumn
      ) {
        return
      }

      fkByColumn.set(columnKey, {
        referencesTable: column.referencesTable,
        referencesColumn: column.referencesColumn
      })
    })

    return {
      tableName: table.tableName,
      columns: table.columns.map((column) => {
        const fk = fkByColumn.get(normalizeSchemaName(column.columnName))
        const isValidForeignKey = Boolean(
          fk &&
          normalizeSchemaName(fk.referencesColumn) &&
          tableNames.has(normalizeSchemaName(fk.referencesTable))
        )

        return {
          columnName: column.columnName,
          dataType: column.dataType,
          primaryKey: Boolean(column.primaryKey),
          nullable: column.nullable ?? false,
          foreignKey: isValidForeignKey,
          referencesTable: isValidForeignKey ? fk!.referencesTable : null,
          referencesColumn: isValidForeignKey ? fk!.referencesColumn : null,
          unique: Boolean(column.unique),
          autoIncrement: Boolean(column.autoIncrement)
        }
      })
    }
  })
}

function mergeSchemaWithSpecConstraints(
  schema: ExecuteSqlResponse['schema'],
  specSchema: SchemaMeta | null
): SchemaMeta | null {
  if (!schema || schema.length === 0) return specSchema
  if (!specSchema || specSchema.length === 0) return schema

  const specByTable = new Map(
    specSchema.map((table) => [normalizeSchemaName(table.tableName), table])
  )

  return schema.map((table) => {
    const specTable = specByTable.get(normalizeSchemaName(table.tableName))
    if (!specTable) return table

    const specColumnsByName = new Map(
      specTable.columns.map((column) => [
        normalizeSchemaName(column.columnName),
        column
      ])
    )

    return {
      tableName: table.tableName,
      columns: table.columns.map((column) => {
        const specColumn = specColumnsByName.get(
          normalizeSchemaName(column.columnName)
        )

        if (!specColumn) return column

        const hasRuntimeForeignKey = Boolean(
          column.foreignKey && column.referencesTable && column.referencesColumn
        )

        return {
          ...column,
          foreignKey: hasRuntimeForeignKey
            ? column.foreignKey
            : specColumn.foreignKey,
          referencesTable: hasRuntimeForeignKey
            ? column.referencesTable
            : specColumn.referencesTable,
          referencesColumn: hasRuntimeForeignKey
            ? column.referencesColumn
            : specColumn.referencesColumn,
          unique: (column as { unique?: boolean }).unique ?? specColumn.unique,
          autoIncrement:
            (column as { autoIncrement?: boolean }).autoIncrement ??
            specColumn.autoIncrement
        }
      })
    }
  })
}

function getConstraintBadges(col: SchemaOverviewColumn) {
  const badges: Array<{ label: string; className: string }> = []

  if (col.primaryKey) {
    badges.push({
      label: 'PK',
      className:
        'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
    })
  }

  if (col.foreignKey) {
    badges.push({
      label: col.referencesTable
        ? `FK -> ${col.referencesTable}${col.referencesColumn ? `.${col.referencesColumn}` : ''}`
        : 'FK',
      className:
        'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
    })
  }

  if (col.unique) {
    badges.push({
      label: 'UNIQUE',
      className:
        'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300'
    })
  }

  if (col.autoIncrement) {
    badges.push({
      label: 'AUTO',
      className:
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    })
  }

  badges.push(
    col.nullable
      ? {
          label: 'NULL',
          className: 'border-border bg-muted/50 text-muted-foreground'
        }
      : {
          label: 'NOT NULL',
          className:
            'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
        }
  )

  return badges
}

function SchemaTablesOverview({
  tables,
  compact = false
}: {
  tables: SchemaOverviewTable[]
  compact?: boolean
}) {
  if (tables.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
        Chưa có thông tin schema
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {tables.map((table) => {
        const constrainedColumns = table.columns.filter(
          (col) =>
            col.primaryKey ||
            col.foreignKey ||
            col.unique ||
            col.autoIncrement ||
            !col.nullable
        ).length

        return (
          <section
            key={table.tableName}
            className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30',
                compact ? 'px-3 py-2' : 'px-4 py-3'
              )}
            >
              <div className="min-w-0">
                <h5
                  className={cn(
                    'truncate font-semibold text-primary',
                    compact ? 'text-xs' : 'text-sm'
                  )}
                >
                  {table.tableName}
                </h5>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {table.columns.length} cột · {constrainedColumns} cột có ràng
                  buộc
                </p>
              </div>
              <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                table
              </span>
            </div>

            <div className="overflow-x-auto">
              <table
                className={cn(
                  'w-full border-collapse',
                  compact
                    ? 'min-w-[520px] text-[11px]'
                    : 'min-w-[640px] text-xs'
                )}
              >
                <thead className="bg-background text-muted-foreground">
                  <tr className="border-b border-border">
                    <th
                      className={cn(
                        'text-left font-semibold',
                        compact ? 'px-3 py-2' : 'px-4 py-2.5'
                      )}
                    >
                      Cột
                    </th>
                    <th
                      className={cn(
                        'text-left font-semibold',
                        compact ? 'px-3 py-2' : 'px-4 py-2.5'
                      )}
                    >
                      Kiểu dữ liệu
                    </th>
                    <th
                      className={cn(
                        'text-left font-semibold',
                        compact ? 'px-3 py-2' : 'px-4 py-2.5'
                      )}
                    >
                      Ràng buộc
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => (
                    <tr
                      key={`${table.tableName}-${col.name}`}
                      className="border-b border-border/50 last:border-b-0 hover:bg-muted/30"
                    >
                      <td
                        className={cn(
                          'whitespace-nowrap font-medium text-foreground',
                          compact ? 'px-3 py-2' : 'px-4 py-2.5'
                        )}
                      >
                        {col.name}
                      </td>
                      <td
                        className={cn(
                          'whitespace-nowrap',
                          compact ? 'px-3 py-2' : 'px-4 py-2.5'
                        )}
                      >
                        <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {col.type}
                        </span>
                      </td>
                      <td className={cn(compact ? 'px-3 py-2' : 'px-4 py-2.5')}>
                        <div className="flex flex-wrap gap-1.5">
                          {getConstraintBadges(col).map((badge) => (
                            <span
                              key={`${col.name}-${badge.label}`}
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                badge.className
                              )}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function ExamTakeInterface({ exam, questions }: ExamTakeInterfaceProps) {
  // Always call hooks at the top
  const [sessionStarted, setSessionStarted] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [initialSeconds, setInitialSeconds] = useState(0)
  const [initialTimerPhase, setInitialTimerPhase] =
    useState<ExamTimerPhase>('REGULAR')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editorSchema, setEditorSchema] = useState<SchemaTable[]>([])
  const [editorRoutines, setEditorRoutines] = useState<
    ExecuteSqlResponse['routines']
  >([])
  const [schemaMeta, setSchemaMeta] =
    useState<ExecuteSqlResponse['schema']>(null)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showRestoredBanner, setShowRestoredBanner] = useState(false)
  const [examSpecification, setExamSpecification] =
    useState<ExamSpecification | null>(null)
  const [isOverviewSelected, setIsOverviewSelected] = useState(true)
  const [specViewMode, setSpecViewMode] = useState<'table' | 'diagram'>('table')
  const [layoutMode, setLayoutMode] = useState<'default' | 'split'>('default')
  const [showShortcutHint, setShowShortcutHint] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [specSchemaMeta, setSpecSchemaMeta] = useState<SchemaMeta | null>(null)
  const enrichedSchemaMeta = useMemo(
    () => mergeSchemaWithSpecConstraints(schemaMeta, specSchemaMeta),
    [schemaMeta, specSchemaMeta]
  )
  const schemaTablesForOverview = useMemo<SchemaOverviewTable[]>(() => {
    if (enrichedSchemaMeta && enrichedSchemaMeta.length > 0) {
      return enrichedSchemaMeta.map((table) => ({
        tableName: table.tableName,
        columns: table.columns.map((col) => ({
          name: col.columnName,
          type: col.dataType,
          primaryKey: Boolean(col.primaryKey),
          nullable: Boolean(col.nullable),
          foreignKey: Boolean((col as { foreignKey?: boolean }).foreignKey),
          referencesTable:
            (col as { referencesTable?: string | null }).referencesTable ??
            null,
          referencesColumn:
            (col as { referencesColumn?: string | null }).referencesColumn ??
            null,
          unique: Boolean((col as { unique?: boolean }).unique),
          autoIncrement: Boolean(
            (col as { autoIncrement?: boolean }).autoIncrement
          )
        }))
      }))
    }

    return editorSchema.map((table) => ({
      tableName: table.tableName,
      columns: table.columns.map((col) => ({
        name: col.name,
        type: col.type,
        primaryKey: false,
        nullable: true,
        foreignKey: false,
        referencesTable: null,
        referencesColumn: null,
        unique: false,
        autoIncrement: false
      }))
    }))
  }, [editorSchema, enrichedSchemaMeta])

  const schemaDiagramData = useMemo(() => {
    const schemaForDiagram =
      enrichedSchemaMeta && enrichedSchemaMeta.length > 0
        ? enrichedSchemaMeta
        : schemaTablesForOverview.length > 0
          ? (schemaTablesForOverview.map((table) => ({
              tableName: table.tableName,
              columns: table.columns.map((col) => ({
                columnName: col.name,
                dataType: col.type,
                primaryKey: col.primaryKey,
                nullable: col.nullable,
                foreignKey: col.foreignKey,
                referencesTable: col.referencesTable,
                referencesColumn: col.referencesColumn,
                unique: col.unique,
                autoIncrement: col.autoIncrement
              }))
            })) as ExecuteSqlResponse['schema'])
          : null

    if (!schemaForDiagram || schemaForDiagram.length === 0) return null
    return JSON.stringify(buildInitialSchemaDiagram(schemaForDiagram))
  }, [enrichedSchemaMeta, schemaTablesForOverview])

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

  // Exam logic hooks (always called, never conditionally)
  const examTake = useExamTake(exam, questions)

  const examActive =
    sessionStarted && !examTake.isSubmitted && !examTake.isGrading

  const { bypassAntiCheat } = useAntiCheat({
    examId: exam.examId,
    enabled: examActive,
    settings: exam.settings
  })

  const {
    saveStatus,
    lastSavedAt,
    isServerReachable,
    getRestoredAnswers,
    handleManualSave,
    clearLocalDraft
  } = useExamDraft(exam.examId, examTake.answers, examActive)

  const handleDownloadBackup = useCallback(() => {
    downloadAnswersBackup(
      exam.title || 'Exam',
      user?.fullName || 'Student',
      user?.studentId || user?.email || 'N/A',
      examTake.answers,
      questions
    )
  }, [exam.title, user, examTake.answers, questions])

  const isForceSubmittingRef = useRef(false)
  const handleForceSubmit = useCallback(
    (reason: string) => {
      if (isForceSubmittingRef.current) return
      isForceSubmittingRef.current = true

      if (reason === 'TIME_UP') {
        toast.info('Đã hết thời gian làm bài, hệ thống đang xử lý nộp bài...')
      }
      // useExamSocket already shows toast for FORCE_SUBMIT, VIOLATION, CONFLICT
      bypassAntiCheat()
      window.onbeforeunload = null
      clearLocalDraft()
      examTake.handleConfirmSubmit()
    },
    [examTake, bypassAntiCheat, clearLocalDraft]
  )

  const {
    setServerTime,
    remainingSeconds,
    phase: timerPhase
  } = useExamTimer({
    examId: exam.examId,
    initialSeconds,
    initialPhase: initialTimerPhase,
    enabled: examActive,
    allowOvertime: exam.settings?.allowOvertime,
    lateThresholdSeconds: Math.max(0, exam.lateThreshold ?? 0) * 60,
    onTimeUp: handleForceSubmit
  })

  useExamSocket({
    examId: exam.examId,
    studentId: user?.id,
    enabled: examActive,
    onForceSubmit: handleForceSubmit,
    onTimeSync: setServerTime,
    onKicked: useCallback(() => {
      bypassAntiCheat()
      window.onbeforeunload = null
      window.location.href = '/student/exams'
    }, [bypassAntiCheat]),
    onAutoSubmitted: bypassAntiCheat,
    onGradingResult: (rawResult: unknown) => {
      const result = rawResult as {
        status: string
        reason?: string
      } & SubmitExamResponse
      const shouldShowResult = Boolean(exam.settings?.showResultAfterSubmit)
      const hasCompletedResult =
        result.status === 'COMPLETED' &&
        (!shouldShowResult ||
          (typeof result.totalScore === 'number' &&
            Number.isFinite(result.totalScore) &&
            typeof result.maxScore === 'number' &&
            Number.isFinite(result.maxScore)))

      if (hasCompletedResult) {
        examTake.setSubmitResult((prev) => ({
          ...(prev || {}),
          ...result,
          // Prefer old details if new ones aren't provided in socket message
          details: result.details || prev?.details || []
        }))
        examTake.setIsGrading(false)
        examTake.setIsSubmitted(true)
      } else if (
        result.status === 'FAILED' ||
        result.status === 'SYSTEM_ERROR'
      ) {
        toast.error(
          'Chấm bài thất bại: ' + (result.reason || 'Lỗi không xác định')
        )
        examTake.setIsGrading(false)
      }
    }
  })

  // 1. Navigation Guard (Back button) - Intercept with Custom Dialog
  useEffect(() => {
    if (!examActive) return

    // Push dummy state to intercept first back action if not already present
    if (window.history.state?.guard !== true) {
      window.history.pushState({ guard: true }, '', window.location.href)
    }

    const handlePopState = () => {
      setShowLeaveDialog(true)
      // Immediately replace state instead of push to avoid history stack accumulation
      // while still keeping the user on the current page URL
      window.history.replaceState({ guard: true }, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [examActive])

  const hasPdf = Boolean(exam.pdfFilePath && exam.pdfFilePath.trim().length > 0)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!hasPdf) return
    let url: string | null = null
    fetchExamPdfBlobUrl(exam.examId)
      .then((blobUrl) => {
        url = blobUrl
        setPdfBlobUrl(blobUrl)
      })
      .catch(() => setPdfBlobUrl(null))
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [exam.examId, hasPdf])

  // Fetch exam specification to provide schema IntelliSense in SQL editor
  useEffect(() => {
    if (exam.schema && exam.schema.length > 0) {
      applySchemaMeta(exam.schema)
    }

    // Đề có thể vừa có PDF (hiển thị đề bài) vừa có đặc tả spec.
    // Luôn nạp spec nếu có để cấp schema/IntelliSense cho trình soạn SQL —
    // không phụ thuộc việc đề có PDF hay không.
    getExamSpecification(exam.examId)
      .then((res) => {
        const spec: ExamSpecification | null = res.data ?? null
        if (!spec) return
        setExamSpecification(spec)

        let parsedSchemaJson: SpecificationSchemaJsonTable[] = []
        const rawSchemaJson = spec.schemaJson
        if (typeof rawSchemaJson === 'string' && rawSchemaJson.trim()) {
          try {
            const parsed = JSON.parse(rawSchemaJson)
            if (Array.isArray(parsed)) {
              parsedSchemaJson = parsed as SpecificationSchemaJsonTable[]
            }
          } catch {
            parsedSchemaJson = []
          }
        } else if (Array.isArray(rawSchemaJson)) {
          parsedSchemaJson = rawSchemaJson
        }

        const specSchema = buildSchemaMetaFromSpecTables(parsedSchemaJson)
        setSpecSchemaMeta(specSchema.length > 0 ? specSchema : null)

        const tables: SchemaTable[] =
          spec.entities?.length > 0
            ? spec.entities.map((entity) => ({
                tableName: entity.entityName,
                columns: entity.attributes.map((attr) => ({
                  name: attr.attributeName,
                  type: attr.dataType
                }))
              }))
            : parsedSchemaJson.map((table) => ({
                tableName: table.tableName,
                columns: table.columns.map((col) => ({
                  name: col.columnName,
                  type: col.dataType
                }))
              }))

        setEditorSchema(tables)
      })
      .catch(() => {
        /* silent – IntelliSense just won't have schema context */
      })
  }, [applySchemaMeta, exam.examId, exam.schema])

  const handleExecuteSqlAndRefreshSchema = useCallback(async () => {
    const res = await examTake.handleExecuteSql()

    const schema = res?.schema
    // Provide both schema and routines if present
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
      const res = await clearExamSchema(exam.examId)
      if (res.code === 'OK' || !res.code) {
        toast.success('Đã xoá sạch các đối tượng trong schema thi!')
        applySchemaMeta([])
      } else {
        toast.error(res.message || 'Xoá schema thất bại')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Lỗi hệ thống khi xoá schema'
      toast.error(errorMessage)
    } finally {
      setIsClearing(false)
    }
  }, [exam.examId, applySchemaMeta])

  const formatTime = useCallback((seconds: number): string => {
    const sAbs = Math.abs(seconds)
    const h = Math.floor(sAbs / 3600)
    const m = Math.floor((sAbs % 3600) / 60)
    const s = Math.floor(sAbs % 60)
    let text = ''
    if (h > 0) {
      text = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    } else {
      text = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return seconds < 0 ? `-${text}` : text
  }, [])

  // Timer milestones and toasts
  useEffect(() => {
    if (!examActive) return

    if (timerPhase === 'LATE') {
      if (remainingSeconds === 60) {
        toast.error('Chỉ còn 1 phút trong thời gian nộp trễ!')
      } else if (remainingSeconds === 30) {
        toast.error('Chỉ còn 30 giây để nộp bài!')
      }
      return
    }

    if (timerPhase !== 'REGULAR') return

    if (remainingSeconds === 300) {
      toast.warning('Còn lại 5 phút!')
    } else if (remainingSeconds === 60) {
      toast.error('Chỉ còn 1 phút! Hãy kiểm tra lại bài làm.')
    } else if (remainingSeconds === 30) {
      toast.error('Cảnh báo: Chỉ còn 30 giây cuối cùng!')
    }
  }, [remainingSeconds, examActive, timerPhase])

  const previousTimerPhaseRef = useRef<ExamTimerPhase>('REGULAR')
  useEffect(() => {
    if (
      examActive &&
      timerPhase === 'LATE' &&
      previousTimerPhaseRef.current !== 'LATE'
    ) {
      toast.warning('Đã hết giờ làm bài. Bạn đang trong thời gian nộp trễ.')
    }
    previousTimerPhaseRef.current = timerPhase
  }, [examActive, timerPhase])

  // Keyboard shortcuts: Alt+S (toggle spec/question), Alt+← (prev), Alt+→ (next)
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
          if (examTake.currentQuestionIndex > 0) {
            examTake.goToQuestion(examTake.currentQuestionIndex - 1)
          } else {
            setIsOverviewSelected(true)
          }
        }
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        if (layoutMode === 'split') {
          if (examTake.currentQuestionIndex < questions.length - 1) {
            examTake.goToQuestion(examTake.currentQuestionIndex + 1)
          }
        } else if (!isOverviewSelected) {
          if (examTake.currentQuestionIndex < questions.length - 1) {
            examTake.goToQuestion(examTake.currentQuestionIndex + 1)
          } else {
            setIsOverviewSelected(true)
          }
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

  const getTimerState = useCallback((seconds: number) => {
    if (seconds <= 30) return 'critical'
    if (seconds <= 60) return 'danger'
    if (seconds <= 300) return 'warning'
    return 'normal'
  }, [])

  const timerState = getTimerState(remainingSeconds)
  const timerClass =
    timerPhase === 'LATE'
      ? styles.late
      : timerState === 'critical'
        ? styles.critical
        : timerState === 'danger'
          ? styles.danger
          : timerState === 'warning'
            ? styles.warning
            : ''

  // Only conditionally render UI, never call hooks conditionally
  useEffect(() => {
    async function initSession() {
      setLoading(true)
      setError(null)
      try {
        // Fetch user info in parallel
        const [timeRes, userRes] = await Promise.all([
          getExamTime(exam.examId),
          getMe()
        ])

        if (userRes.data) setUser(userRes.data)

        if (timeRes.data && timeRes.data.remainingSeconds > 0) {
          setInitialTimerPhase(
            timeRes.data.status === 'LATE_SUBMISSION' ? 'LATE' : 'REGULAR'
          )
          setInitialSeconds(timeRes.data.remainingSeconds)
          setSessionStarted(true)

          const restoredAnswers = await getRestoredAnswers()
          if (restoredAnswers) {
            examTake.restoreAnswers(restoredAnswers)
            setShowRestoredBanner(true)
            // Auto-hide restorative banner after 3 seconds
            setTimeout(() => setShowRestoredBanner(false), 3000)
          }
        } else if (timeRes.data && !timeRes.data.studentStartedAt) {
          // No active session — redirect user back to the waiting room to click Start
          window.location.href = `/student/exams/${exam.examId}/take`
          return
        } else {
          setError('Phiên thi đã kết thúc hoặc không tồn tại.')
        }
      } catch (err) {
        // Re-throw Next.js redirects to prevent them from being swallowed
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
          throw err
        }

        let errorObj: Record<string, unknown> = {}
        try {
          if (typeof err === 'string') errorObj = JSON.parse(err)
          else if (err && typeof err === 'object')
            errorObj = err as Record<string, unknown>
        } catch {
          /* parse error */
        }

        const errCode = errorObj?.code as string | undefined
        const errMessage = errorObj?.message as string | undefined

        if (
          errCode === '401' ||
          errCode === 'UNAUTHORIZED' ||
          errMessage === 'Access Denied'
        ) {
          setError(errMessage || 'Bạn không có quyền truy cập phiên thi này.')
          return
        }

        if (
          errCode === 'BAD_REQUEST' ||
          errMessage?.includes('expired') ||
          errMessage?.includes('ended')
        ) {
          setError(errMessage || 'Bài thi đã kết thúc hoặc quá hạn.')
        } else {
          setError('Lỗi khi khởi tạo phiên thi.')
        }
      } finally {
        setLoading(false)
      }
    }
    initSession()
  }, [exam.examId])

  if (loading) {
    return <PageSpinner label="Đang tải phiên thi..." />
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    )
  }

  if (examTake.isSubmitted && examTake.submitResult) {
    return (
      <SubmitResultDialog
        result={examTake.submitResult}
        showResult={Boolean(exam.settings?.showResultAfterSubmit)}
        onBack={examTake.handleBackToExams}
      />
    )
  }

  return (
    <>
      <div className={styles.timeProgressBar}>
        <div
          className={`${styles.timeFill} ${styles[timerState]}`}
          style={{
            width: `${Math.max(
              0,
              (remainingSeconds /
                (timerPhase === 'LATE'
                  ? Math.max(1, (exam.lateThreshold ?? 0) * 60)
                  : exam.durationMinutes * 60)) *
                100
            )}%`
          }}
        />
      </div>
      <ViolationWarningModal
        maxViolations={exam.settings?.maxViolations}
        autoSubmitOnViolation={exam.settings?.autoSubmitOnViolation}
        requireFullscreen={exam.settings?.forceFullscreen}
      />
      <BlurOverlay requireFullscreen={exam.settings?.forceFullscreen} />
      <NetworkStatusBanner
        isReachable={isServerReachable}
        onDownloadBackup={handleDownloadBackup}
      />
      {showRestoredBanner && (
        <DraftRestoredBanner onDismiss={() => setShowRestoredBanner(false)} />
      )}
      {examTake.isGrading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loaderContent}>
            <div className={styles.spinnerBox}>
              <div className={styles.spinnerBg} />
              <div className={styles.spinnerFg} />
            </div>
            <div>
              <h2 className={styles.title}>Hệ thống đang chấm bài...</h2>
              <p className={styles.subtitle}>
                Vui lòng không thoát trang web này. Kết quả sẽ hiển thị ngay khi
                hoàn tất.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className={styles.interfaceContainer}>
        <div className={styles.mainContent}>
          {/* LEFT: Spec panel (split mode) or Question sidebar (default mode) */}
          {layoutMode === 'split' ? (
            <div className={styles.splitSpecPanel}>
              {hasPdf ? (
                <div className="h-full p-3">
                  {pdfBlobUrl ? (
                    <iframe
                      src={pdfBlobUrl}
                      title={exam.originalPdfFileName || 'Đặc tả PDF'}
                      className="h-full w-full rounded-lg border border-border"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
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
                  <div className="min-h-0 flex-1 overflow-auto">
                    {specViewMode === 'table' ? (
                      <div className="space-y-2 p-2">
                        <SchemaTablesOverview
                          tables={schemaTablesForOverview}
                          compact
                        />

                        {examSpecification?.datasets?.length ? (
                          <div className="space-y-3 pt-2">
                            <div className="border-t border-border pt-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                                Dữ liệu mẫu trong bảng
                              </h4>
                              <p className="text-[11px] text-muted-foreground">
                                Hiển thị theo dataset hiện có của đề
                              </p>
                            </div>
                            {examSpecification.datasets
                              .slice()
                              .sort((a, b) => a.orderIndex - b.orderIndex)
                              .map((dataset, idx) => (
                                <section
                                  key={`${dataset.id ?? idx}-${dataset.name}`}
                                  className="space-y-2"
                                >
                                  <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      Dataset
                                    </span>
                                    <h4 className="text-xs font-semibold text-foreground">
                                      {dataset.name}
                                    </h4>
                                  </div>
                                  <DatasetTableView
                                    sql={dataset.dataScript}
                                    tableData={dataset.tableData}
                                    variant="exam-spec"
                                  />
                                </section>
                              ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="h-full min-h-full min-w-[720px]">
                        {schemaDiagramData ? (
                          <TeacherSchemaDiagram
                            diagramData={schemaDiagramData}
                            readOnly
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

          {/* Right: Prompt + Editor + Bottom panel */}
          <div className={styles.rightPanel}>
            {/* Top Header Bar */}
            <div className={styles.headerBar}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {user?.fullName?.charAt(0) || <User className="h-4 w-4" />}
                </div>
                <div className={styles.details}>
                  <span className={styles.name}>
                    {user?.fullName || 'Đang tải...'}
                  </span>
                  <span className={styles.id}>
                    {user?.studentId || user?.email || '...'}
                  </span>
                </div>
              </div>

              <div className={styles.statusActions}>
                <SaveStatusIndicator
                  status={saveStatus}
                  lastSavedAt={lastSavedAt}
                  onManualSave={handleManualSave}
                  isServerReachable={isServerReachable}
                />
                <div className={styles.progressContainer}>
                  <div className={styles.progressText}>
                    Tiến độ: {examTake.answeredCount}/{questions.length} câu
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${
                          questions.length > 0
                            ? (examTake.answeredCount / questions.length) * 100
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={() => setShowShortcutHint((prev) => !prev)}
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
                    title={
                      layoutMode === 'split'
                        ? 'Trở về chế độ mặc định'
                        : 'Bật chế độ chia đôi (Đặc tả | Câu hỏi)'
                    }
                    onClick={() =>
                      setLayoutMode((prev) => {
                        const next = prev === 'default' ? 'split' : 'default'
                        if (next === 'split' && isOverviewSelected) {
                          setIsOverviewSelected(false)
                        }
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
                      {layoutMode === 'split' ? 'Gộp lại' : 'Chia đôi màn hình'}
                    </span>
                  </button>
                  <div className={`${styles.timer} ${timerClass}`}>
                    <Clock
                      className={`h-4 w-4 ${
                        timerState === 'normal' ? 'text-primary' : ''
                      }`}
                    />
                    {timerPhase === 'LATE' && (
                      <span className="font-sans text-[10px] font-semibold uppercase">
                        Nộp trễ
                      </span>
                    )}
                    <span>{formatTime(Math.max(0, remainingSeconds))}</span>
                  </div>
                  <Button
                    onClick={examTake.handleRequestSubmit}
                    disabled={examTake.isLoading}
                    size="sm"
                    className={styles.submitBtn}
                  >
                    <Send className="h-4 w-4" />
                    Nộp bài
                  </Button>
                </div>
              </div>
            </div>

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

            {/* Mini question navigation strip (split mode only) */}
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

            {/* Prompt (compact) */}
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

            {/* Editor + Bottom Panel with Resizer */}
            <div className={styles.editorArea}>
              {layoutMode === 'split' ? (
                examTake.currentQuestion ? (
                  <ResizablePanel defaultSize={65} minSize={30} maxSize={85}>
                    <SqlEditorPanel
                      value={
                        examTake.answers[examTake.currentQuestion.id] || ''
                      }
                      onChange={(val: string) =>
                        examTake.updateAnswer(examTake.currentQuestion.id, val)
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
                      result={examTake.sqlResult}
                      schemaMeta={schemaMeta}
                      examId={exam.examId}
                      onSchemaMetaChange={applySchemaMeta}
                    />
                  </ResizablePanel>
                ) : (
                  <div className={styles.emptyStateCenter}>
                    Chọn một câu hỏi để bắt đầu
                  </div>
                )
              ) : isOverviewSelected ? (
                hasPdf ? (
                  <div className="h-full min-h-0 p-4">
                    {pdfBlobUrl ? (
                      <iframe
                        src={pdfBlobUrl}
                        title={exam.originalPdfFileName || 'Đặc tả PDF'}
                        className="h-full w-full rounded-lg border border-border"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
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
                          <Table2 className="h-3.5 w-3.5" />
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
                          <Network className="h-3.5 w-3.5" />
                          Dạng lược đồ
                        </button>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden p-4">
                      <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-2">
                        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
                          {specViewMode === 'table' ? (
                            <>
                              <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                                <h4 className="text-sm font-semibold text-foreground">
                                  Thông tin bảng
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Tên bảng, tên cột, kiểu dữ liệu, ràng buộc
                                </p>
                              </div>
                              <ScrollArea className="h-full min-h-0 flex-1 p-3">
                                <SchemaTablesOverview
                                  tables={schemaTablesForOverview}
                                />
                              </ScrollArea>
                            </>
                          ) : (
                            <>
                              <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                                <h4 className="text-sm font-semibold text-foreground">
                                  Lược đồ CSDL
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Sơ đồ quan hệ giữa các bảng
                                </p>
                              </div>
                              <div className="min-h-0 flex-1">
                                {schemaDiagramData ? (
                                  <TeacherSchemaDiagram
                                    diagramData={schemaDiagramData}
                                    readOnly
                                    className="h-full border-0 rounded-none"
                                  />
                                ) : (
                                  <div className={styles.emptyStateCenter}>
                                    Chưa có thông tin lược đồ
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </section>

                        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
                          <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                            <h4 className="text-sm font-semibold text-foreground">
                              Dữ liệu mẫu trong bảng
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Hiển thị theo dataset hiện có của đề
                            </p>
                          </div>
                          <div className="min-h-0 flex-1 overflow-auto p-3">
                            {examSpecification?.datasets?.length ? (
                              <div className="space-y-4">
                                {examSpecification.datasets
                                  .slice()
                                  .sort((a, b) => a.orderIndex - b.orderIndex)
                                  .map((dataset, idx) => (
                                    <section
                                      key={`${dataset.id ?? idx}-${dataset.name}`}
                                      className="space-y-2"
                                    >
                                      <div>
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                          Dataset
                                        </span>
                                        <h4 className="text-sm font-semibold text-foreground">
                                          {dataset.name}
                                        </h4>
                                      </div>
                                      <DatasetTableView
                                        sql={dataset.dataScript}
                                        tableData={dataset.tableData}
                                        variant="exam-spec"
                                      />
                                    </section>
                                  ))}
                              </div>
                            ) : (
                              <div className={styles.emptyStateCenter}>
                                Chưa có dữ liệu mẫu để hiển thị
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <ResizablePanel defaultSize={65} minSize={30} maxSize={85}>
                  {examTake.currentQuestion ? (
                    <SqlEditorPanel
                      value={
                        examTake.answers[examTake.currentQuestion.id] || ''
                      }
                      onChange={(val: string) =>
                        examTake.updateAnswer(examTake.currentQuestion.id, val)
                      }
                      onExecute={handleExecuteSqlAndRefreshSchema}
                      onExecuteSelected={handleExecuteSelectedSql}
                      onClearSchema={handleClearSchema}
                      isLoading={examTake.isLoading}
                      isClearing={isClearing}
                      schema={editorSchema}
                      routines={editorRoutines || []}
                    />
                  ) : (
                    <div className={styles.emptyStateCenter}>
                      Chọn một câu hỏi để bắt đầu
                    </div>
                  )}

                  <ExamTakeBottomPanel
                    result={examTake.sqlResult}
                    schemaMeta={schemaMeta}
                    examId={exam.examId}
                    onSchemaMetaChange={applySchemaMeta}
                  />
                </ResizablePanel>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcut hint panel */}
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
            * Phím tắt hoạt động ở chế độ mặc định và chế độ chia đôi
          </p>
        </div>
      )}

      {/* Custom confirmation dialogs */}
      <ConfirmSubmitDialog
        open={examTake.showConfirmDialog}
        onOpenChange={examTake.setShowConfirmDialog}
        onConfirm={() => {
          bypassAntiCheat()
          clearLocalDraft()
          examTake.handleConfirmSubmit()
        }}
        unansweredCount={examTake.unansweredCount}
        totalQuestions={questions.length}
        isLoading={examTake.isLoading}
      />

      <ConfirmLeaveDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        onConfirm={() => {
          // Force back navigation after user confirms
          setShowLeaveDialog(false)
          // Double back usually needed because we pushed one state
          window.history.go(-2)
        }}
      />
    </>
  )
}
