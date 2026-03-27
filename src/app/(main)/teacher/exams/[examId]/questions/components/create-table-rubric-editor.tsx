'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Table2,
  Columns3,
  Link2,
  Settings2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Equal,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateGradingRubric } from '@/lib/actions'
import {
  GradingRubric,
  GradingSettings,
  RubricTable,
  RubricColumn,
  RubricConstraint,
  ConstraintType,
  SyntaxErrorAction,
  MissingPenaltyAction
} from '@/lib/types'

// ===== Default factories =====

function createDefaultRubric(totalPoints: number): GradingRubric {
  return {
    total_points: totalPoints,
    question_category: 'CREATE_TABLE',
    grading_payload: {
      grading_settings: {
        syntax_error_action: 'FAIL_ALL',
        case_sensitive_names: false,
        allow_implicit_constraints: true,
        positive_only_scoring: false
      },
      tables: []
    }
  }
}

function createDefaultTable(): RubricTable {
  return {
    expected_name: '',
    existence_points: 0.1,
    missing_penalty_action: 'SKIP_TABLE',
    columns: [],
    constraints: []
  }
}

function createDefaultColumn(): RubricColumn {
  return {
    name: '',
    expected_type: 'VARCHAR',
    is_nullable: true,
    points: 0.05,
    type_mismatch_penalty: 0.02
  }
}

function createDefaultConstraint(): RubricConstraint {
  return {
    type: 'PRIMARY_KEY',
    columns: [],
    points: 0.1,
    missing_penalty: 0.05
  }
}

function toBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false
  }
  return defaultValue
}

function toSyntaxErrorAction(value: unknown): SyntaxErrorAction {
  return value === 'PARTIAL' ? 'PARTIAL' : 'FAIL_ALL'
}

function normalizeCreateTablePayload(
  payload: GradingRubric['grading_payload'] | undefined
): {
  grading_settings: GradingSettings
  tables: RubricTable[]
} {
  const defaultSettings: GradingSettings = {
    syntax_error_action: 'FAIL_ALL',
    case_sensitive_names: false,
    allow_implicit_constraints: true,
    positive_only_scoring: false
  }

  if (!payload || typeof payload !== 'object') {
    return {
      grading_settings: defaultSettings,
      tables: []
    }
  }

  const payloadRecord = payload as Record<string, unknown>
  const rawSettings =
    payloadRecord.grading_settings &&
    typeof payloadRecord.grading_settings === 'object'
      ? (payloadRecord.grading_settings as Record<string, unknown>)
      : {}

  const settings: GradingSettings = {
    syntax_error_action: toSyntaxErrorAction(rawSettings.syntax_error_action),
    case_sensitive_names: toBoolean(rawSettings.case_sensitive_names, false),
    allow_implicit_constraints: toBoolean(
      rawSettings.allow_implicit_constraints,
      true
    ),
    positive_only_scoring: toBoolean(rawSettings.positive_only_scoring, false)
  }

  return {
    grading_settings: settings,
    tables: Array.isArray(payloadRecord.tables)
      ? (payloadRecord.tables as RubricTable[])
      : []
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function rebalanceCreateTablePoints(
  tables: RubricTable[],
  totalPoints: number
): RubricTable[] {
  if (tables.length === 0) {
    return tables
  }

  type PointBucket =
    | { type: 'table'; tableIdx: number; value: number }
    | { type: 'column'; tableIdx: number; colIdx: number; value: number }
    | {
        type: 'constraint'
        tableIdx: number
        constraintIdx: number
        value: number
      }

  const buckets: PointBucket[] = []
  tables.forEach((table, tableIdx) => {
    buckets.push({
      type: 'table',
      tableIdx,
      value: Math.max(0, Number(table.existence_points) || 0)
    })

    table.columns.forEach((column, colIdx) => {
      buckets.push({
        type: 'column',
        tableIdx,
        colIdx,
        value: Math.max(0, Number(column.points) || 0)
      })
    })

    table.constraints.forEach((constraint, constraintIdx) => {
      buckets.push({
        type: 'constraint',
        tableIdx,
        constraintIdx,
        value: Math.max(0, Number(constraint.points) || 0)
      })
    })
  })

  if (buckets.length === 0) {
    return tables
  }

  const totalCents = Math.max(0, Math.round(totalPoints * 100))
  const weightSum = buckets.reduce((sum, bucket) => sum + bucket.value, 0)
  const fallbackWeight = weightSum > 0 ? 0 : 1

  const weighted = buckets.map((bucket) => {
    const weight = weightSum > 0 ? bucket.value : fallbackWeight
    const raw = (weight / (weightSum || buckets.length)) * totalCents
    const cents = Math.floor(raw)
    return { ...bucket, cents, fraction: raw - cents }
  })

  let assigned = weighted.reduce((sum, bucket) => sum + bucket.cents, 0)
  let remainder = totalCents - assigned
  if (remainder > 0) {
    const order = [...weighted]
      .map((bucket, idx) => ({ idx, fraction: bucket.fraction }))
      .sort((a, b) => b.fraction - a.fraction)
    let i = 0
    while (remainder > 0) {
      weighted[order[i % order.length].idx].cents += 1
      remainder -= 1
      i += 1
    }
  }

  const nextTables = tables.map((table) => ({
    ...table,
    columns: table.columns.map((column) => ({ ...column })),
    constraints: table.constraints.map((constraint) => ({ ...constraint }))
  }))

  weighted.forEach((bucket) => {
    const nextPoints = bucket.cents / 100
    if (bucket.type === 'table') {
      nextTables[bucket.tableIdx].existence_points = nextPoints
      return
    }

    if (bucket.type === 'column') {
      const original = tables[bucket.tableIdx].columns[bucket.colIdx]
      const ratio =
        original.points > 0
          ? original.type_mismatch_penalty / original.points
          : 0.4
      nextTables[bucket.tableIdx].columns[bucket.colIdx] = {
        ...nextTables[bucket.tableIdx].columns[bucket.colIdx],
        points: nextPoints,
        type_mismatch_penalty: round2(Math.max(0, nextPoints * ratio))
      }
      return
    }

    const original = tables[bucket.tableIdx].constraints[bucket.constraintIdx]
    const ratio =
      original.points > 0 ? original.missing_penalty / original.points : 0.5
    nextTables[bucket.tableIdx].constraints[bucket.constraintIdx] = {
      ...nextTables[bucket.tableIdx].constraints[bucket.constraintIdx],
      points: nextPoints,
      missing_penalty: round2(Math.max(0, nextPoints * ratio))
    }
  })

  assigned = weighted.reduce((sum, bucket) => sum + bucket.cents, 0)
  if (assigned !== totalCents) {
    const delta = round2((totalCents - assigned) / 100)
    nextTables[0].existence_points = round2(
      Math.max(0, nextTables[0].existence_points + delta)
    )
  }

  return nextTables
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
  totalPoints: number
  rubric: GradingRubric | null
  onChange: (rubric: GradingRubric) => void
  correctQuery?: string
  questionContent?: string
}

export function CreateTableRubricEditor({
  totalPoints,
  rubric,
  onChange,
  correctQuery,
  questionContent
}: CreateTableRubricEditorProps) {
  const currentRubric = rubric ?? createDefaultRubric(totalPoints)
  const payload = normalizeCreateTablePayload(currentRubric.grading_payload)
  const settings = payload.grading_settings
  const tables = payload.tables

  // ===== Helper to update rubric immutably =====
  const updateRubric = useCallback(
    (updater: (draft: GradingRubric) => GradingRubric) => {
      onChange(updater({ ...currentRubric }))
    },
    [currentRubric, onChange]
  )

  const updateSettings = (partial: Partial<GradingSettings>) => {
    updateRubric((r) => {
      const normalizedPayload = normalizeCreateTablePayload(r.grading_payload)
      return {
        ...r,
        total_points: totalPoints,
        question_category: 'CREATE_TABLE',
        grading_payload: {
          ...normalizedPayload,
          grading_settings: {
            ...normalizedPayload.grading_settings,
            ...partial
          }
        }
      }
    })
  }

  const setTables = (newTables: RubricTable[]) => {
    updateRubric((r) => {
      const normalizedPayload = normalizeCreateTablePayload(r.grading_payload)
      return {
        ...r,
        total_points: totalPoints,
        question_category: 'CREATE_TABLE',
        grading_payload: { ...normalizedPayload, tables: newTables }
      }
    })
  }

  // ===== Points calculation =====
  const allocatedPoints = useMemo(() => {
    let sum = 0
    for (const t of tables) {
      sum += t.existence_points
      for (const c of t.columns) sum += c.points
      for (const cn of t.constraints) sum += cn.points
    }
    return Math.round(sum * 100) / 100
  }, [tables])

  const pointsDiff = Math.round((totalPoints - allocatedPoints) * 100) / 100

  // ===== Auto distribute points =====
  const autoDistributePoints = () => {
    if (tables.length === 0) return
    const perTable = totalPoints / tables.length
    const newTables = tables.map((t) => {
      const existPts = Math.round(perTable * 0.1 * 100) / 100
      const totalItems = t.columns.length + t.constraints.length
      if (totalItems === 0) return { ...t, existence_points: perTable }
      const remaining = perTable - existPts
      const perItem = Math.round((remaining / totalItems) * 100) / 100
      return {
        ...t,
        existence_points: existPts,
        columns: t.columns.map((c) => ({
          ...c,
          points: perItem,
          type_mismatch_penalty: Math.round(perItem * 0.4 * 100) / 100
        })),
        constraints: t.constraints.map((cn) => ({
          ...cn,
          points: perItem,
          missing_penalty: Math.round(perItem * 0.5 * 100) / 100
        }))
      }
    })
    setTables(newTables)
  }

  // ===== Table-level expand/collapse =====
  const [expandedTables, setExpandedTables] = useState<Record<number, boolean>>(
    {}
  )
  const toggleTable = (idx: number) => {
    setExpandedTables((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  // ===== AI Generate =====
  const [isGenerating, setIsGenerating] = useState(false)
  const [enforceExactPoints, setEnforceExactPoints] = useState(true)

  const handleAiGenerate = async () => {
    if (!correctQuery?.trim()) {
      toast.error('Vui lòng nhập SQL đáp án (Correct Query) trước khi dùng AI')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateGradingRubric({
        correctQuery: correctQuery.trim(),
        questionContent: questionContent || '',
        totalPoints,
        questionType: 'CREATE_TABLE',
        enforceExactTotalPoints: enforceExactPoints
      })

      if (result.data) {
        const parsed: GradingRubric =
          typeof result.data === 'string'
            ? JSON.parse(result.data)
            : result.data

        const parsedPayload = normalizeCreateTablePayload(
          parsed.grading_payload
        )
        const parsedTables = parsedPayload.tables

        const nextTables = enforceExactPoints
          ? rebalanceCreateTablePoints(parsedTables, totalPoints)
          : parsedTables

        const nextRubric: GradingRubric = {
          ...parsed,
          total_points: totalPoints,
          question_category: 'CREATE_TABLE',
          grading_payload: {
            ...parsedPayload,
            tables: nextTables
          }
        }

        onChange(nextRubric)

        // Auto-expand all tables
        const expanded: Record<number, boolean> = {}
        nextTables.forEach((_, i) => {
          expanded[i] = true
        })
        setExpandedTables(expanded)

        toast.success(
          `AI đã tạo rubric thành công (${nextTables.length} bảng${enforceExactPoints ? ', đã cân đúng tổng điểm' : ''})`
        )
      } else {
        toast.error(result.message || 'AI không thể tạo rubric')
      }
    } catch (err) {
      console.error('AI rubric generation failed:', err)
      toast.error('Lỗi khi gọi AI. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* AI Generate + Points summary bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleAiGenerate}
          disabled={isGenerating}
          className="gap-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md h-9 px-4"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Tạo Rubric
            </>
          )}
        </Button>

        <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={enforceExactPoints}
            onChange={(e) => setEnforceExactPoints(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          AI cân đúng tổng điểm
        </label>

        <div
          className={`flex-1 flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium border ${
            pointsDiff === 0
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {pointsDiff === 0 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>
              Đã phân bổ: <strong>{allocatedPoints}</strong> / {totalPoints}{' '}
              điểm
              {pointsDiff !== 0 && (
                <span className="ml-2 text-xs">
                  (
                  {pointsDiff > 0
                    ? `Còn thiếu ${pointsDiff}`
                    : `Dư ${Math.abs(pointsDiff)}`}{' '}
                  điểm)
                </span>
              )}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={autoDistributePoints}
            className="gap-1 text-xs h-7"
          >
            <Equal className="h-3 w-3" />
            Phân bổ đều
          </Button>
        </div>
      </div>

      {/* Zone 1: General Settings */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Settings2 className="h-4 w-4 text-primary" />
          Cấu hình chung
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Xử lý lỗi cú pháp
            </label>
            <select
              value={settings.syntax_error_action}
              onChange={(e) =>
                updateSettings({
                  syntax_error_action: e.target.value as SyntaxErrorAction
                })
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="FAIL_ALL">0 điểm toàn bộ (FAIL_ALL)</option>
              <option value="PARTIAL">Chấm từng phần (PARTIAL)</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.case_sensitive_names}
              onChange={(e) =>
                updateSettings({ case_sensitive_names: e.target.checked })
              }
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Phân biệt hoa/thường
              </p>
              <p className="text-xs text-muted-foreground">
                Tên bảng, cột phải khớp chính xác
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(settings.positive_only_scoring)}
              onChange={(e) =>
                updateSettings({ positive_only_scoring: e.target.checked })
              }
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Chỉ tính điểm cộng
              </p>
              <p className="text-xs text-muted-foreground">
                Bật lên để tắt trừ điểm, mục sai sẽ không được cộng điểm
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Zone 2–4: Tables + Columns + Constraints */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Table2 className="h-4 w-4 text-primary" />
            Danh sách bảng ({tables.length})
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setTables([...tables, createDefaultTable()])
              setExpandedTables((prev) => ({ ...prev, [tables.length]: true }))
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

        {tables.map((table, tableIdx) => (
          <TableEditor
            key={tableIdx}
            table={table}
            positiveOnlyScoring={Boolean(settings.positive_only_scoring)}
            isExpanded={expandedTables[tableIdx] ?? false}
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
        ))}
      </div>
    </div>
  )
}

// ===== Table Editor =====

function TableEditor({
  table,
  positiveOnlyScoring,
  isExpanded,
  onToggle,
  onChange,
  onRemove
}: {
  table: RubricTable
  positiveOnlyScoring: boolean
  isExpanded: boolean
  onToggle: () => void
  onChange: (t: RubricTable) => void
  onRemove: () => void
}) {
  const colPoints = table.columns.reduce((s, c) => s + c.points, 0)
  const conPoints = table.constraints.reduce((s, c) => s + c.points, 0)
  const tableTotal =
    Math.round((table.existence_points + colPoints + conPoints) * 100) / 100

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Table Header */}
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
        <span className="text-xs text-muted-foreground">
          ({table.columns.length} cột · {table.constraints.length} ràng buộc ·{' '}
          {tableTotal}đ)
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
          {/* Table basic info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Điểm tồn tại bảng
              </label>
              <input
                type="number"
                value={table.existence_points}
                onChange={(e) =>
                  onChange({
                    ...table,
                    existence_points: Number(e.target.value)
                  })
                }
                min={0}
                step={0.01}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Khi thiếu bảng
              </label>
              <select
                value={table.missing_penalty_action}
                onChange={(e) =>
                  onChange({
                    ...table,
                    missing_penalty_action: e.target
                      .value as MissingPenaltyAction
                  })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="SKIP_TABLE">Bỏ qua (SKIP_TABLE)</option>
                <option value="ZERO_POINTS">0 điểm (ZERO_POINTS)</option>
              </select>
            </div>
          </div>

          {/* Columns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                <Columns3 className="h-3.5 w-3.5 text-violet-500" />
                Cột ({table.columns.length})
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
                      <th className="px-3 py-2 text-left font-semibold w-[25%]">
                        Tên cột
                      </th>
                      <th className="px-3 py-2 text-left font-semibold w-[20%]">
                        Kiểu dữ liệu
                      </th>
                      <th className="px-3 py-2 text-center font-semibold w-[10%]">
                        Nullable
                      </th>
                      <th className="px-3 py-2 text-center font-semibold w-[15%]">
                        Điểm
                      </th>
                      {!positiveOnlyScoring && (
                        <th className="px-3 py-2 text-center font-semibold w-[15%]">
                          Trừ sai kiểu
                        </th>
                      )}
                      <th className="px-3 py-2 text-center font-semibold w-[8%]"></th>
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
                            className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={col.expected_type}
                            onChange={(e) => {
                              const newCols = [...table.columns]
                              newCols[colIdx] = {
                                ...col,
                                expected_type: e.target.value
                              }
                              onChange({ ...table, columns: newCols })
                            }}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={col.points}
                            onChange={(e) => {
                              const newCols = [...table.columns]
                              newCols[colIdx] = {
                                ...col,
                                points: Number(e.target.value)
                              }
                              onChange({ ...table, columns: newCols })
                            }}
                            min={0}
                            step={0.01}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-center text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </td>
                        {!positiveOnlyScoring && (
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={col.type_mismatch_penalty}
                              onChange={(e) => {
                                const newCols = [...table.columns]
                                newCols[colIdx] = {
                                  ...col,
                                  type_mismatch_penalty: Number(e.target.value)
                                }
                                onChange({ ...table, columns: newCols })
                              }}
                              min={0}
                              step={0.01}
                              className="w-full rounded border border-border bg-background px-2 py-1 text-center text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

          {/* Constraints */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                <Link2 className="h-3.5 w-3.5 text-amber-500" />
                Ràng buộc ({table.constraints.length})
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
  availableColumns,
  onChange,
  onRemove
}: {
  constraint: RubricConstraint
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
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
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-8"
            >
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">
              Điểm
            </label>
            <input
              type="number"
              value={constraint.points}
              onChange={(e) =>
                onChange({ ...constraint, points: Number(e.target.value) })
              }
              min={0}
              step={0.01}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">
              Trừ khi thiếu
            </label>
            <input
              type="number"
              value={constraint.missing_penalty}
              onChange={(e) =>
                onChange({
                  ...constraint,
                  missing_penalty: Number(e.target.value)
                })
              }
              min={0}
              step={0.01}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-destructive/10 transition-colors mt-4"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>

      {/* FK-specific fields */}
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
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}

      {/* CHECK / DEFAULT expression */}
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
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      )}
    </div>
  )
}
