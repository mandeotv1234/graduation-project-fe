'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buildCreateTablesFromAnswer } from '@/lib/actions'
import {
  ConstraintType,
  GradingRubric,
  InsertDataGradingRule,
  MissingPenaltyAction,
  RubricColumn,
  RubricConstraint,
  RubricTable
} from '@/lib/types'
import {
  ChevronDown,
  ChevronRight,
  Columns3,
  Link2,
  Loader2,
  Plus,
  Table2,
  Trash2
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AiRubricRefinementPanel } from './ai-rubric-refinement-panel'
import { GradingRulesEditor } from './grading-rules-editor'

// ===== Default factories =====

function createDefaultRubric(totalPoints: number): GradingRubric {
  return {
    total_points: totalPoints,
    question_category: 'CREATE_TABLE',
    grading_payload: {
      grading_rules: [],
      tables: []
    }
  }
}

function createDefaultTable(): RubricTable {
  return {
    expected_name: '',
    columns: [],
    constraints: []
  }
}

function createDefaultColumn(): RubricColumn {
  return {
    name: '',
    expected_type: 'VARCHAR',
    is_nullable: true
  }
}

function createDefaultConstraint(): RubricConstraint {
  return {
    type: 'PRIMARY_KEY',
    columns: []
  }
}

function parseOptionalPenalty(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'string' && value.trim() === '') {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return undefined
  }

  return Math.max(0, parsed)
}

function hasAnySpecialPenaltyValue(tables: RubricTable[]): boolean {
  return tables.some((table) => {
    if (typeof table.missing_table_penalty === 'number') return true

    const hasColumnPenalty = table.columns.some(
      (column) =>
        typeof column.missing_column_penalty === 'number' ||
        typeof column.type_mismatch_penalty === 'number'
    )
    if (hasColumnPenalty) return true

    return table.constraints.some(
      (constraint) => typeof constraint.missing_constraint_penalty === 'number'
    )
  })
}

function sanitizeSpecialPenaltyFields(
  tables: RubricTable[],
  enabled: boolean
): RubricTable[] {
  if (enabled) {
    return tables.map((table) => ({
      ...table,
      missing_penalty_action: table.missing_penalty_action ?? 'SKIP_TABLE',
      columns: (table.columns ?? []).map((column) => ({
        ...column
      })),
      constraints: (table.constraints ?? []).map((constraint) => ({
        ...constraint
      }))
    }))
  }

  return tables.map((table) => {
    const tableRest = { ...table }
    delete tableRest.missing_table_penalty
    delete tableRest.missing_penalty_action

    return {
      ...tableRest,
      columns: (table.columns ?? []).map((column) => {
        const columnRest = { ...column }
        delete columnRest.missing_column_penalty
        delete columnRest.type_mismatch_penalty
        return columnRest
      }),
      constraints: (table.constraints ?? []).map((constraint) => {
        const constraintRest = { ...constraint }
        delete constraintRest.missing_constraint_penalty
        return constraintRest
      })
    }
  })
}

function normalizeCreateTablePayload(
  payload: GradingRubric['grading_payload'] | undefined
): {
  grading_rules: InsertDataGradingRule[]
  tables: RubricTable[]
} {
  if (!payload || typeof payload !== 'object') {
    return {
      grading_rules: [],
      tables: []
    }
  }

  const payloadRecord = payload as Record<string, unknown>

  return {
    grading_rules: Array.isArray(payloadRecord.grading_rules)
      ? (payloadRecord.grading_rules as InsertDataGradingRule[])
      : [],
    tables: Array.isArray(payloadRecord.tables)
      ? (payloadRecord.tables as RubricTable[]).map((table) => ({
          ...table,
          missing_table_penalty: parseOptionalPenalty(
            table.missing_table_penalty
          ),
          missing_penalty_action: table.missing_penalty_action,
          columns: (table.columns ?? []).map((column) => ({
            ...column,
            missing_column_penalty: parseOptionalPenalty(
              column.missing_column_penalty
            ),
            type_mismatch_penalty: parseOptionalPenalty(
              column.type_mismatch_penalty
            )
          })),
          constraints: (table.constraints ?? []).map((constraint) => ({
            ...constraint,
            missing_constraint_penalty: parseOptionalPenalty(
              constraint.missing_constraint_penalty
            )
          }))
        }))
      : []
  }
}

function normalizeSqlTypeBase(type: string): string {
  const normalized = (type || '').trim().toUpperCase()
  if (!normalized) return 'VARCHAR'
  const parenIndex = normalized.indexOf('(')
  const noParams =
    parenIndex >= 0 ? normalized.substring(0, parenIndex) : normalized
  return noParams.trim() || 'VARCHAR'
}

const SQL_TYPES = [
  'INT',
  'BIGINT',
  'SMALLINT',
  'TINYINT',
  'VARCHAR',
  'NVARCHAR',
  'CHAR',
  'NCHAR',
  'TEXT',
  'NTEXT',
  'DECIMAL',
  'NUMERIC',
  'FLOAT',
  'REAL',
  'MONEY',
  'DATE',
  'DATETIME',
  'DATETIME2',
  'TIME',
  'TIMESTAMP',
  'BIT',
  'BINARY',
  'VARBINARY',
  'IMAGE',
  'UNIQUEIDENTIFIER',
  'XML'
]

const CONSTRAINT_TYPES: { value: ConstraintType; label: string }[] = [
  { value: 'PRIMARY_KEY', label: 'Khóa chính' },
  { value: 'FOREIGN_KEY', label: 'Khóa ngoại' },
  { value: 'UNIQUE', label: 'Unique' },
  { value: 'CHECK', label: 'Check' },
  { value: 'DEFAULT', label: 'Default' }
]

// ===== Props =====

interface CreateTableRubricEditorProps {
  examId: number
  totalPoints: number
  rubric: GradingRubric | null
  onChange: (rubric: GradingRubric) => void
  correctQuery?: string
  questionContent?: string
  wizardStep?: number
}

export function CreateTableRubricEditor({
  examId,
  totalPoints,
  rubric,
  onChange,
  correctQuery,
  questionContent,
  wizardStep
}: CreateTableRubricEditorProps) {
  const currentRubric = rubric ?? createDefaultRubric(totalPoints)
  const rubricRef = useRef<GradingRubric>(currentRubric)

  useEffect(() => {
    rubricRef.current = currentRubric
  }, [currentRubric])

  const payload = normalizeCreateTablePayload(currentRubric.grading_payload)
  const gradingRules = payload.grading_rules
  const tables = payload.tables
  const hasSpecialPenaltyConfig = useMemo(
    () => hasAnySpecialPenaltyValue(tables),
    [tables]
  )

  // ===== Helper to update rubric immutably =====
  const updateRubric = useCallback(
    (updater: (draft: GradingRubric) => GradingRubric) => {
      const next = updater({ ...rubricRef.current })
      rubricRef.current = next
      onChange(next)
    },
    [onChange]
  )

  const setTables = (
    newTables: RubricTable[],
    options?: { specialPenaltyEnabled?: boolean }
  ) => {
    const specialPenaltyEnabled =
      options?.specialPenaltyEnabled ?? showSpecialPenalties
    const sanitizedTables = sanitizeSpecialPenaltyFields(
      newTables,
      specialPenaltyEnabled
    )
    updateRubric((r) => {
      const normalizedPayload = normalizeCreateTablePayload(r.grading_payload)
      return {
        ...r,
        total_points: totalPoints,
        question_category: 'CREATE_TABLE',
        grading_payload: {
          grading_rules: normalizedPayload.grading_rules,
          tables: sanitizedTables
        }
      }
    })
  }

  const setGradingRules = (newRules: InsertDataGradingRule[]) => {
    updateRubric((r) => {
      const normalizedPayload = normalizeCreateTablePayload(r.grading_payload)
      return {
        ...r,
        total_points: totalPoints,
        question_category: 'CREATE_TABLE',
        grading_payload: {
          grading_rules: newRules,
          tables: normalizedPayload.tables
        }
      }
    })
  }

  // ===== Table-level expand/collapse =====
  const [expandedTables, setExpandedTables] = useState<Record<number, boolean>>(
    {}
  )
  const [activeTableIndex, setActiveTableIndex] = useState(0)
  const toggleTable = (idx: number) => {
    setExpandedTables((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  useEffect(() => {
    if (tables.length === 0) {
      if (activeTableIndex !== 0) setActiveTableIndex(0)
      return
    }

    if (activeTableIndex >= tables.length) {
      setActiveTableIndex(tables.length - 1)
    }
  }, [activeTableIndex, tables.length])

  // ===== AI Generate =====
  const [isBuildingTables, setIsBuildingTables] = useState(false)
  const [showSpecialPenalties, setShowSpecialPenalties] = useState<boolean>(
    hasSpecialPenaltyConfig
  )

  useEffect(() => {
    if (hasSpecialPenaltyConfig) {
      setShowSpecialPenalties(true)
    }
  }, [hasSpecialPenaltyConfig])

  const tableContextSummary = useMemo(() => {
    if (tables.length === 0) {
      return '- Chưa có bảng nào trong rubric CREATE TABLE.'
    }

    return tables
      .map((table) => {
        const tableName = table.expected_name?.trim() || 'UNKNOWN_TABLE'
        const columns = table.columns
          .map((column) => column.name?.trim())
          .filter(Boolean)
        const constraints = table.constraints
          .map((constraint) => constraint.type)
          .filter(Boolean)

        return [
          `- ${tableName}`,
          `columns=[${columns.join(', ') || 'none'}]`,
          `constraints=[${constraints.join(', ') || 'none'}]`
        ].join(' | ')
      })
      .join('\n')
  }, [tables])

  const handleBuildTablesFromAnswer = async () => {
    if (!correctQuery?.trim()) {
      toast.error('Vui long nhap SQL dap an truoc khi dung cau truc bang')
      return
    }

    setIsBuildingTables(true)
    try {
      const result = await buildCreateTablesFromAnswer(examId, {
        correctQuery: correctQuery.trim()
      })

      if (!result.data) {
        toast.error(result.message || 'Khong the dung cau truc bang tu dap an')
        return
      }

      const generatedTables = Array.isArray(result.data.tables)
        ? (result.data.tables as RubricTable[])
        : []

      if (generatedTables.length === 0) {
        toast.error('Khong tao duoc tables tu SQL dap an')
        return
      }

      setShowSpecialPenalties(false)
      setTables(generatedTables, { specialPenaltyEnabled: false })
      setActiveTableIndex(0)
      toast.success(`Đã tạo ${generatedTables.length} bảng từ SQL đáp án`)
    } catch {
      toast.error('Lỗi khi dựng cấu trúc bảng từ đáp án. Vui lòng thử lại.')
    } finally {
      setIsBuildingTables(false)
    }
  }

  const currentRubricForAi = useMemo<GradingRubric>(
    () => ({
      total_points: totalPoints,
      question_category: 'CREATE_TABLE',
      grading_payload: {
        grading_rules: gradingRules,
        tables
      }
    }),
    [gradingRules, tables, totalPoints]
  )

  const handleApplyAiRefinement = useCallback(
    (nextRubric: GradingRubric) => {
      const activeTableName = tables[activeTableIndex]?.expected_name
      const normalizedPayload = normalizeCreateTablePayload(
        nextRubric.grading_payload
      )
      const refinedHasSpecialPenalty = hasAnySpecialPenaltyValue(
        normalizedPayload.tables
      )
      const shouldKeepSpecialPenalties =
        showSpecialPenalties || refinedHasSpecialPenalty
      const normalizedTables = sanitizeSpecialPenaltyFields(
        normalizedPayload.tables,
        shouldKeepSpecialPenalties
      )
      const normalizedRubric: GradingRubric = {
        ...nextRubric,
        total_points: totalPoints,
        question_category: 'CREATE_TABLE',
        grading_payload: {
          grading_rules: normalizedPayload.grading_rules,
          tables: normalizedTables
        }
      }
      const nextActiveIndex = activeTableName
        ? normalizedTables.findIndex(
            (table) => table.expected_name === activeTableName
          )
        : -1

      if (refinedHasSpecialPenalty) {
        setShowSpecialPenalties(true)
      }
      rubricRef.current = normalizedRubric
      onChange(normalizedRubric)
      setActiveTableIndex(nextActiveIndex >= 0 ? nextActiveIndex : 0)
      setExpandedTables((prev) => ({
        ...prev,
        [nextActiveIndex >= 0 ? nextActiveIndex : 0]: true
      }))
    },
    [activeTableIndex, onChange, showSpecialPenalties, tables, totalPoints]
  )

  const isWizardMode = typeof wizardStep === 'number'

  // Auto-trigger build when entering Step 2 with empty tables
  const hasAutoTriggeredRef = useRef(false)
  useEffect(() => {
    if (
      isWizardMode &&
      wizardStep === 2 &&
      tables.length === 0 &&
      correctQuery?.trim() &&
      !isBuildingTables &&
      !hasAutoTriggeredRef.current
    ) {
      hasAutoTriggeredRef.current = true
      handleBuildTablesFromAnswer()
    }
  }, [wizardStep, isWizardMode, tables.length, correctQuery, isBuildingTables])

  return (
    <div className="space-y-5">
      {(!isWizardMode || wizardStep === 2) && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBuildTablesFromAnswer}
            disabled={isBuildingTables}
            className="h-9 px-4 text-sm font-semibold"
          >
            {isBuildingTables ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang tạo bảng...
              </>
            ) : (
              <>
                <Table2 className="mr-1.5 h-4 w-4" />
                Dùng cấu trúc bảng từ đáp án
              </>
            )}
          </Button>

          <label className="flex items-center gap-2 rounded-md border border-border bg-sub-background px-3 py-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showSpecialPenalties}
              onChange={(e) => {
                const enabled = e.target.checked
                setShowSpecialPenalties(enabled)
                setTables(tables, { specialPenaltyEnabled: enabled })
              }}
              className="h-4 w-4 rounded border-border accent-sub-primary"
            />
            Bật trọng số đặc biệt theo bảng/cột/ràng buộc
          </label>
        </div>
      )}

      {(!isWizardMode || wizardStep === 2) && (
        <AiRubricRefinementPanel
          questionType="CREATE_TABLE"
          totalPoints={totalPoints}
          currentRubric={currentRubricForAi}
          onApply={handleApplyAiRefinement}
          correctQuery={correctQuery}
          questionContent={questionContent}
          activeTargetId={tables[activeTableIndex]?.expected_name}
          activeTargetLabel={
            tables[activeTableIndex]?.expected_name ||
            (tables.length > 0 ? `Bảng ${activeTableIndex + 1}` : undefined)
          }
        />
      )}

      {(!isWizardMode || wizardStep === 3) && (
        <GradingRulesEditor
          questionType="CREATE_TABLE"
          totalPoints={totalPoints}
          rules={gradingRules}
          onChange={setGradingRules}
          onTablesPatch={(tablePatches) => {
            if (!tablePatches || tablePatches.length === 0) return
            const nextTables = [...tables]
            let hasChanges = false
            tablePatches.forEach((patch: Record<string, unknown>) => {
              if (!patch || typeof patch.expected_name !== 'string') return
              const expectedName = patch.expected_name as string
              const normalizedName = expectedName.trim().toLowerCase()
              const idx = nextTables.findIndex(
                (t) =>
                  (t.expected_name || '').trim().toLowerCase() ===
                  normalizedName
              )
              if (idx >= 0) {
                const tableToUpdate = nextTables[idx]
                const nextTable = { ...tableToUpdate }

                if (patch.missing_table_penalty !== undefined) {
                  nextTable.missing_table_penalty = Number(
                    patch.missing_table_penalty
                  )
                }
                if (patch.missing_penalty_action !== undefined) {
                  nextTable.missing_penalty_action =
                    patch.missing_penalty_action as MissingPenaltyAction
                }

                if (
                  Array.isArray(patch.columns) &&
                  Array.isArray(nextTable.columns)
                ) {
                  patch.columns.forEach((patchCol: Record<string, unknown>) => {
                    const colName =
                      typeof patchCol.name === 'string' ? patchCol.name : ''
                    const matchedCol = nextTable.columns.find(
                      (c) => c.name?.toLowerCase() === colName.toLowerCase()
                    )
                    if (matchedCol) {
                      if (patchCol.missing_column_penalty !== undefined)
                        matchedCol.missing_column_penalty = Number(
                          patchCol.missing_column_penalty
                        )
                      if (patchCol.type_mismatch_penalty !== undefined)
                        matchedCol.type_mismatch_penalty = Number(
                          patchCol.type_mismatch_penalty
                        )
                    }
                  })
                }

                if (
                  Array.isArray(patch.constraints) &&
                  Array.isArray(nextTable.constraints)
                ) {
                  patch.constraints.forEach(
                    (patchCons: Record<string, unknown>) => {
                      const consType =
                        typeof patchCons.type === 'string' ? patchCons.type : ''
                      const matchedCons = nextTable.constraints.find(
                        (c) => c.type === consType
                      )
                      if (matchedCons) {
                        if (patchCons.missing_constraint_penalty !== undefined)
                          matchedCons.missing_constraint_penalty = Number(
                            patchCons.missing_constraint_penalty
                          )
                      }
                    }
                  )
                }

                nextTables[idx] = nextTable
                hasChanges = true
              } else {
                nextTables.push({
                  expected_name: expectedName,
                  missing_table_penalty:
                    patch.missing_table_penalty !== undefined
                      ? Number(patch.missing_table_penalty)
                      : undefined,
                  missing_penalty_action:
                    (patch.missing_penalty_action as MissingPenaltyAction) ||
                    'SKIP_TABLE',
                  columns: Array.isArray(patch.columns)
                    ? (patch.columns as RubricColumn[])
                    : [],
                  constraints: Array.isArray(patch.constraints)
                    ? (patch.constraints as RubricConstraint[])
                    : []
                })
                hasChanges = true
              }
            })

            if (hasChanges) {
              setTables(nextTables, { specialPenaltyEnabled: true })
              setShowSpecialPenalties(true)
              toast.success(
                'Đã tự động nhận diện và cập nhật trọng số đặc biệt phần cấu trúc bảng/cột.'
              )
            }
          }}
          correctQuery={correctQuery}
          questionContent={questionContent}
          contextSummary={tableContextSummary}
        />
      )}

      {/* Tables + Columns + Constraints */}
      {(!isWizardMode || wizardStep === 2) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
              Danh sách bảng
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0 text-[10px]"
              >
                {tables.length}
              </Badge>
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTables([...tables, createDefaultTable()])
                setActiveTableIndex(tables.length)
                setExpandedTables((prev) => ({
                  ...prev,
                  [tables.length]: true
                }))
              }}
              className="gap-1 text-xs h-7"
            >
              <Plus className="h-3 w-3" />
              Thêm bảng
            </Button>
          </div>

          {tables.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
              Chưa có bảng nào. Nhấn &quot;Thêm bảng&quot; để bắt đầu cấu hình
              rubric.
            </div>
          )}

          {tables.length > 0 && (
            <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-2">
              {tables.map((table, tableIdx) => (
                <Button
                  key={`${table.expected_name || 'table'}-${tableIdx}`}
                  type="button"
                  variant={
                    tableIdx === activeTableIndex ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => {
                    setActiveTableIndex(tableIdx)
                    setExpandedTables((prev) => ({
                      ...prev,
                      [tableIdx]: true
                    }))
                  }}
                  className="h-8 min-w-0 max-w-[13rem] justify-start truncate text-xs"
                  title={table.expected_name || `Bảng ${tableIdx + 1}`}
                >
                  <span className="truncate">TC{tableIdx + 1}</span>
                </Button>
              ))}
            </div>
          )}

          {tables.map((table, tableIdx) =>
            tableIdx === activeTableIndex ? (
              <TableEditor
                key={tableIdx}
                table={table}
                showSpecialPenaltyFields={showSpecialPenalties}
                isExpanded={expandedTables[tableIdx] ?? true}
                onToggle={() => toggleTable(tableIdx)}
                onChange={(updated) => {
                  const newTables = [...tables]
                  newTables[tableIdx] = updated
                  setTables(newTables)
                }}
                onRemove={() => {
                  setTables(tables.filter((_, i) => i !== tableIdx))
                }}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  )
}

// ===== Table Editor =====

function TableEditor({
  table,
  showSpecialPenaltyFields,
  isExpanded,
  onToggle,
  onChange,
  onRemove
}: {
  table: RubricTable
  showSpecialPenaltyFields: boolean
  isExpanded: boolean
  onToggle: () => void
  onChange: (t: RubricTable) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <Table2 className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="font-mono text-sm font-bold text-foreground">
          {table.expected_name || 'Bảng chưa đặt tên'}
        </span>
        <div
          className="ml-auto flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-destructive/10 transition-colors"
            title="Xóa bảng"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-5">
          <div
            className={
              showSpecialPenaltyFields
                ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
                : 'grid grid-cols-1 gap-4'
            }
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tên bảng
              </label>
              <input
                type="text"
                value={table.expected_name}
                onChange={(e) =>
                  onChange({ ...table, expected_name: e.target.value })
                }
                placeholder="VD: CONGTY"
                className="w-full rounded-md border border-border bg-sub-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {showSpecialPenaltyFields && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Trừ khi thiếu bảng
                  </label>
                  <input
                    type="number"
                    value={table.missing_table_penalty ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...table,
                        missing_table_penalty: parseOptionalPenalty(
                          e.target.value
                        )
                      })
                    }
                    min={0}
                    step={0.01}
                    className="w-full rounded-md border border-border bg-sub-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Khi thiếu bảng
                  </label>
                  <select
                    value={table.missing_penalty_action ?? 'SKIP_TABLE'}
                    onChange={(e) =>
                      onChange({
                        ...table,
                        missing_penalty_action: e.target
                          .value as MissingPenaltyAction
                      })
                    }
                    className="w-full rounded-md border border-border bg-sub-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="SKIP_TABLE">
                      Bỏ qua lỗi con (SKIP_TABLE)
                    </option>
                    <option value="ZERO_POINTS">
                      0 điểm bảng này (ZERO_POINTS)
                    </option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="flex items-center text-xs font-bold text-foreground uppercase tracking-wider">
                <Columns3 className="h-3.5 w-3.5 text-violet-500 mr-1.5" />
                Cột
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0 text-[10px] ml-2 font-semibold"
                >
                  {table.columns.length}
                </Badge>
              </h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({
                    ...table,
                    columns: [...table.columns, createDefaultColumn()]
                  })
                }
                className="gap-1 text-xs h-6"
              >
                <Plus className="h-3 w-3" />
                Thêm cột
              </Button>
            </div>

            {table.columns.length > 0 && (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-3 py-2 text-left font-semibold w-[24%]">
                        Tên cột
                      </th>
                      <th className="px-3 py-2 text-left font-semibold w-[20%]">
                        Kiểu dữ liệu
                      </th>
                      <th className="px-3 py-2 text-center font-semibold w-[10%]">
                        Nullable
                      </th>
                      {showSpecialPenaltyFields && (
                        <th className="px-3 py-2 text-center font-semibold w-[18%]">
                          Trừ khi thiếu cột
                        </th>
                      )}
                      {showSpecialPenaltyFields && (
                        <th className="px-3 py-2 text-center font-semibold w-[18%]">
                          Trừ sai kiểu
                        </th>
                      )}
                      <th className="px-3 py-2 text-center font-semibold w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col, colIdx) => (
                      <tr
                        key={colIdx}
                        className="border-b last:border-0 border-border hover:bg-muted/20"
                      >
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => {
                              const newCols = [...table.columns]
                              newCols[colIdx] = { ...col, name: e.target.value }
                              onChange({ ...table, columns: newCols })
                            }}
                            placeholder="MaCT"
                            className="w-full rounded border border-border bg-sub-background px-2 py-1 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={normalizeSqlTypeBase(col.expected_type)}
                            onChange={(e) => {
                              const newCols = [...table.columns]
                              newCols[colIdx] = {
                                ...col,
                                expected_type: e.target.value
                              }
                              onChange({ ...table, columns: newCols })
                            }}
                            className="w-full rounded border border-border bg-sub-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {SQL_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={col.is_nullable}
                            onChange={(e) => {
                              const newCols = [...table.columns]
                              newCols[colIdx] = {
                                ...col,
                                is_nullable: e.target.checked
                              }
                              onChange({ ...table, columns: newCols })
                            }}
                            className="h-4 w-4 rounded border-border accent-sub-primary"
                          />
                        </td>
                        {showSpecialPenaltyFields && (
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={col.missing_column_penalty ?? ''}
                              onChange={(e) => {
                                const newCols = [...table.columns]
                                newCols[colIdx] = {
                                  ...col,
                                  missing_column_penalty: parseOptionalPenalty(
                                    e.target.value
                                  )
                                }
                                onChange({ ...table, columns: newCols })
                              }}
                              min={0}
                              step={0.01}
                              className="w-full rounded border border-border bg-background px-2 py-1 text-center text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </td>
                        )}
                        {showSpecialPenaltyFields && (
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={col.type_mismatch_penalty ?? ''}
                              onChange={(e) => {
                                const newCols = [...table.columns]
                                newCols[colIdx] = {
                                  ...col,
                                  type_mismatch_penalty: parseOptionalPenalty(
                                    e.target.value
                                  )
                                }
                                onChange({ ...table, columns: newCols })
                              }}
                              min={0}
                              step={0.01}
                              className="w-full rounded border border-border bg-sub-background px-2 py-1 text-center text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </td>
                        )}
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              onChange({
                                ...table,
                                columns: table.columns.filter(
                                  (_, i) => i !== colIdx
                                )
                              })
                            }}
                            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="flex items-center text-xs font-bold text-foreground uppercase tracking-wider">
                <Link2 className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                Ràng buộc
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0 text-[10px] ml-2 font-semibold"
                >
                  {table.constraints.length}
                </Badge>
              </h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({
                    ...table,
                    constraints: [
                      ...table.constraints,
                      createDefaultConstraint()
                    ]
                  })
                }
                className="gap-1 text-xs h-6"
              >
                <Plus className="h-3 w-3" />
                Thêm ràng buộc
              </Button>
            </div>

            {table.constraints.map((con, conIdx) => (
              <ConstraintEditor
                key={conIdx}
                constraint={con}
                showSpecialPenaltyFields={showSpecialPenaltyFields}
                availableColumns={table.columns
                  .map((c) => c.name)
                  .filter(Boolean)}
                onChange={(updated) => {
                  const newCons = [...table.constraints]
                  newCons[conIdx] = updated
                  onChange({ ...table, constraints: newCons })
                }}
                onRemove={() => {
                  onChange({
                    ...table,
                    constraints: table.constraints.filter(
                      (_, i) => i !== conIdx
                    )
                  })
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Constraint Editor =====

function ConstraintEditor({
  constraint,
  showSpecialPenaltyFields,
  availableColumns,
  onChange,
  onRemove
}: {
  constraint: RubricConstraint
  showSpecialPenaltyFields: boolean
  availableColumns: string[]
  onChange: (c: RubricConstraint) => void
  onRemove: () => void
}) {
  const isFk = constraint.type === 'FOREIGN_KEY'
  const isCheck = constraint.type === 'CHECK'
  const isDefault = constraint.type === 'DEFAULT'

  return (
    <div className="rounded-md border border-border bg-muted/10 p-3 space-y-3">
      <div className="flex items-start gap-3">
        <div
          className={
            showSpecialPenaltyFields
              ? 'grid grid-cols-2 md:grid-cols-3 gap-3 flex-1'
              : 'grid grid-cols-2 gap-3 flex-1'
          }
        >
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">
              Loại
            </label>
            <select
              value={constraint.type}
              onChange={(e) =>
                onChange({
                  ...constraint,
                  type: e.target.value as ConstraintType
                })
              }
              className="w-full rounded border border-border bg-sub-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {CONSTRAINT_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">
              Cột áp dụng
            </label>
            <select
              multiple
              value={constraint.columns}
              onChange={(e) =>
                onChange({
                  ...constraint,
                  columns: Array.from(e.target.selectedOptions, (o) => o.value)
                })
              }
              className="w-full rounded border border-border bg-sub-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-8"
            >
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {showSpecialPenaltyFields && (
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">
                Trừ khi thiếu
              </label>
              <input
                type="number"
                value={constraint.missing_constraint_penalty ?? ''}
                onChange={(e) =>
                  onChange({
                    ...constraint,
                    missing_constraint_penalty: parseOptionalPenalty(
                      e.target.value
                    )
                  })
                }
                min={0}
                step={0.01}
                className="w-full rounded border border-border bg-sub-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-destructive/10 transition-colors mt-4"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>

      {isFk && (
        <div className="grid grid-cols-2 gap-3 pl-0">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">
              Bảng tham chiếu
            </label>
            <input
              type="text"
              value={constraint.references_table ?? ''}
              onChange={(e) =>
                onChange({ ...constraint, references_table: e.target.value })
              }
              placeholder="VD: NHANVIEN"
              className="w-full rounded border border-border bg-sub-background px-2 py-1.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">
              Cột tham chiếu (phân cách bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={(constraint.references_columns ?? []).join(', ')}
              onChange={(e) =>
                onChange({
                  ...constraint,
                  references_columns: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                })
              }
              placeholder="VD: MaNV"
              className="w-full rounded border border-border bg-sub-background px-2 py-1.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}

      {(isCheck || isDefault) && (
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">
            Biểu thức
          </label>
          <input
            type="text"
            value={constraint.expression ?? ''}
            onChange={(e) =>
              onChange({ ...constraint, expression: e.target.value })
            }
            placeholder={isCheck ? 'VD: Luong > 0' : 'VD: GETDATE()'}
            className="w-full rounded border border-border bg-sub-background px-2 py-1.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      )}
    </div>
  )
}
