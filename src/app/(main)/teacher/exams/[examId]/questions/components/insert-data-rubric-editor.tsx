'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Table2,
  Settings2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Equal,
  Loader2,
  Rows4,
  Columns3
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateGradingRubric } from '@/lib/actions'
import {
  GradingRubric,
  InsertDataGradingSettings,
  InsertDataExpectedDataset,
  InsertDataColumnConfig,
  InsertDataExpectedRow,
  MatchType,
  SyntaxErrorAction
} from '@/lib/types'

// ===== Default factories =====

function createDefaultRubric(totalPoints: number): GradingRubric {
  return {
    total_points: totalPoints,
    question_category: 'INSERT_DATA',
    grading_payload: {
      grading_settings: {
        syntax_error_action: 'PARTIAL',
        allow_extra_rows: false,
        penalty_per_extra_row: 0.1
      },
      tables: []
    }
  }
}

function createDefaultTable(): InsertDataExpectedDataset {
  return {
    table_name: '',
    table_points: 0,
    row_grading_strategy: 'PARTIAL_BY_COLUMN',
    missing_row_penalty: 0.1,
    columns_config: [],
    expected_data: []
  }
}

function createDefaultColumn(): InsertDataColumnConfig {
  return {
    name: '',
    is_primary_key: false,
    points: 0.05,
    match_type: 'EXACT'
  }
}

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function toBoolean(value: unknown, defaultValue: boolean) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false
  }
  return defaultValue
}

function toNumber(value: unknown, defaultValue: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return defaultValue
}

function toSyntaxErrorAction(value: unknown): SyntaxErrorAction {
  if (typeof value === 'string' && value.trim().toUpperCase() === 'FAIL_ALL') {
    return 'FAIL_ALL'
  }
  return 'PARTIAL'
}

function rebalanceInsertTablePoints(
  tables: InsertDataExpectedDataset[],
  totalPoints: number
): InsertDataExpectedDataset[] {
  if (tables.length === 0) {
    return tables
  }

  const totalCents = Math.max(0, Math.round(totalPoints * 100))
  const weights = tables.map((table) => Math.max(0, Number(table.table_points)))
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)

  const weighted = tables.map((table, idx) => {
    const basis = weightSum > 0 ? weights[idx] : 1
    const raw = (basis / (weightSum || tables.length)) * totalCents
    const cents = Math.floor(raw)
    return {
      table,
      idx,
      cents,
      fraction: raw - cents
    }
  })

  let remainder =
    totalCents - weighted.reduce((sum, item) => sum + item.cents, 0)
  if (remainder > 0) {
    const order = [...weighted]
      .map((item, idx) => ({ idx, fraction: item.fraction }))
      .sort((a, b) => b.fraction - a.fraction)
    let i = 0
    while (remainder > 0) {
      weighted[order[i % order.length].idx].cents += 1
      remainder -= 1
      i += 1
    }
  }

  return weighted.map(({ table, cents }) => {
    const nextTablePoints = cents / 100
    const rowCount = Math.max(1, table.expected_data.length)
    const nextMissingPenalty = roundTo(nextTablePoints / rowCount, 2)
    const columnCount = table.columns_config.length
    const perColumnPoints =
      columnCount > 0 ? roundTo(nextMissingPenalty / columnCount, 3) : 0

    return {
      ...table,
      table_points: nextTablePoints,
      missing_row_penalty: nextMissingPenalty,
      columns_config: table.columns_config.map((column) => ({
        ...column,
        points: perColumnPoints
      }))
    }
  })
}

function normalizeInsertRubric(
  rubric: GradingRubric,
  totalPoints: number
): GradingRubric {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = rubric.grading_payload || {}
  const tablesRaw = Array.isArray(payload.tables) ? payload.tables : []
  const datasetsRaw = Array.isArray(payload.expected_datasets)
    ? payload.expected_datasets
    : []

  const hasTables = tablesRaw.length > 0

  const normalizedTables: InsertDataExpectedDataset[] = hasTables
    ? tablesRaw
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      datasetsRaw.map((dataset: any) => {
        const rows = Array.isArray(dataset?.rows) ? dataset.rows : []
        const columnsToGrade = Array.isArray(dataset?.columns_to_grade)
          ? dataset.columns_to_grade
          : []
        const primaryKeys = new Set(
          Array.isArray(dataset?.primary_keys) ? dataset.primary_keys : []
        )

        const defaultColPoints =
          rows.length > 0 && columnsToGrade.length > 0
            ? roundTo(
                (Number(dataset?.table_points) || 0) /
                  rows.length /
                  columnsToGrade.length,
                3
              )
            : 0.05

        return {
          table_name: String(dataset?.table_name || ''),
          table_points: Number(dataset?.table_points) || 0,
          row_grading_strategy: 'PARTIAL_BY_COLUMN',
          missing_row_penalty:
            Number(dataset?.points_per_row) ||
            (rows.length > 0
              ? roundTo((Number(dataset?.table_points) || 0) / rows.length, 2)
              : 0),
          columns_config: columnsToGrade.map((name: string) => ({
            name,
            is_primary_key: primaryKeys.has(name),
            points: defaultColPoints,
            match_type: 'EXACT' as MatchType
          })),
          expected_data: rows as InsertDataExpectedRow[]
        }
      })

  const expectedDatasets = normalizedTables.map((table) => {
    const safeRows = Array.isArray(table.expected_data)
      ? table.expected_data
      : []
    const safeColumns = Array.isArray(table.columns_config)
      ? table.columns_config
      : []

    const columnsToGrade = safeColumns
      .map((c) => c.name?.trim())
      .filter((name): name is string => Boolean(name))

    const primaryKeys = safeColumns
      .filter((c) => c.is_primary_key)
      .map((c) => c.name?.trim())
      .filter((name): name is string => Boolean(name))

    const pointsPerRow =
      safeRows.length > 0
        ? roundTo((Number(table.table_points) || 0) / safeRows.length, 3)
        : 0

    return {
      table_name: table.table_name,
      table_points: Number(table.table_points) || 0,
      points_per_row: pointsPerRow,
      primary_keys: primaryKeys,
      columns_to_grade: columnsToGrade,
      rows: safeRows
    }
  })

  const currentSettings = payload.grading_settings || {}

  return {
    ...rubric,
    total_points: totalPoints,
    question_category: 'INSERT_DATA',
    grading_payload: {
      ...payload,
      grading_settings: {
        syntax_error_action: toSyntaxErrorAction(
          currentSettings.syntax_error_action
        ),
        allow_extra_rows: toBoolean(currentSettings.allow_extra_rows, false),
        penalty_per_extra_row: toNumber(
          currentSettings.penalty_per_extra_row,
          0.1
        ),
        ignore_column_order: toBoolean(
          currentSettings.ignore_column_order,
          true
        ),
        trim_string_spaces: toBoolean(currentSettings.trim_string_spaces, true),
        case_insensitive_data: toBoolean(
          currentSettings.case_insensitive_data,
          false
        )
      },
      tables: normalizedTables,
      expected_datasets: expectedDatasets
    }
  }
}

const MATCH_TYPES: { value: MatchType; label: string }[] = [
  { value: 'EXACT', label: 'Chính xác hoàn toàn (EXACT)' },
  {
    value: 'IGNORE_CASE_AND_SPACE',
    label: 'Bỏ qua hoa thường & khoảng trắng (IGNORE_CASE)'
  },
  {
    value: 'NUMERIC_TOLERANCE',
    label: 'Chấp nhận sai số toán học (NUMERIC_TOLERANCE)'
  }
]

// ===== Props =====

interface InsertDataRubricEditorProps {
  totalPoints: number
  rubric: GradingRubric | null
  onChange: (rubric: GradingRubric) => void
  correctQuery?: string
  questionContent?: string
}

export function InsertDataRubricEditor({
  totalPoints,
  rubric,
  onChange,
  correctQuery,
  questionContent
}: InsertDataRubricEditorProps) {
  const currentRubric = normalizeInsertRubric(
    rubric ?? createDefaultRubric(totalPoints),
    totalPoints
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = currentRubric.grading_payload || {}
  const settings = payload.grading_settings || {}
  const tables: InsertDataExpectedDataset[] = Array.isArray(payload.tables)
    ? (payload.tables as InsertDataExpectedDataset[])
    : []

  // ===== Helper to update rubric immutably =====
  const updateRubric = useCallback(
    (updater: (draft: GradingRubric) => GradingRubric) => {
      const next = updater({ ...currentRubric })
      onChange(normalizeInsertRubric(next, totalPoints))
    },
    [currentRubric, onChange, totalPoints]
  )

  const updateSettings = (partial: Partial<InsertDataGradingSettings>) => {
    updateRubric((r) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentPayload: any = r.grading_payload || {}
      return {
        ...r,
        total_points: totalPoints,
        grading_payload: {
          ...currentPayload,
          grading_settings: {
            ...(currentPayload.grading_settings || {}),
            ...partial
          }
        }
      }
    })
  }

  const setTables = (newTables: InsertDataExpectedDataset[]) => {
    updateRubric((r) => ({
      ...r,
      total_points: totalPoints,
      grading_payload: { ...r.grading_payload, tables: newTables }
    }))
  }

  // ===== Points calculation =====
  const allocatedPoints = useMemo(() => {
    let sum = 0
    for (const t of tables) {
      sum += t.table_points
    }
    return Math.round(sum * 100) / 100
  }, [tables])

  const pointsDiff = Math.round((totalPoints - allocatedPoints) * 100) / 100

  // ===== Auto distribute points =====
  const autoDistributePoints = () => {
    if (tables.length === 0) return
    const perTable = totalPoints / tables.length

    // For each table, distribute points to its columns
    const newTables = tables.map((t) => {
      const roundedTablePts = Math.round(perTable * 100) / 100

      const numRows = t.expected_data.length || 1
      const defaultMissingRowPenalty =
        Math.round((roundedTablePts / numRows) * 100) / 100

      let newCols = [...t.columns_config]
      if (newCols.length > 0) {
        // Points per row divided into column points
        const pointsPerCol =
          Math.round((defaultMissingRowPenalty / newCols.length) * 1000) / 1000
        newCols = newCols.map((c) => ({ ...c, points: pointsPerCol }))
      }

      return {
        ...t,
        table_points: roundedTablePts,
        missing_row_penalty: defaultMissingRowPenalty,
        columns_config: newCols
      }
    })
    setTables(newTables)
  }

  // ===== Expand/Collapse =====
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
      toast.error('Vui lòng nhập SQL đáp án dự kiến trước khi dùng AI')
      return
    }
    setIsGenerating(true)
    try {
      const result = await generateGradingRubric({
        correctQuery: correctQuery.trim(),
        questionContent: questionContent || '',
        totalPoints,
        questionType: 'INSERT_DATA',
        enforceExactTotalPoints: enforceExactPoints
      })

      if (result.data) {
        const parsed: GradingRubric =
          typeof result.data === 'string'
            ? JSON.parse(result.data)
            : result.data
        let normalized = normalizeInsertRubric(parsed, totalPoints)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizedPayload: any = normalized.grading_payload || {}

        if (enforceExactPoints) {
          const tablesForRebalance = Array.isArray(normalizedPayload.tables)
            ? (normalizedPayload.tables as InsertDataExpectedDataset[])
            : []

          normalized = normalizeInsertRubric(
            {
              ...normalized,
              grading_payload: {
                ...normalizedPayload,
                tables: rebalanceInsertTablePoints(
                  tablesForRebalance,
                  totalPoints
                )
              }
            },
            totalPoints
          )
        }

        onChange(normalized)

        const expanded: Record<number, boolean> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalPayload: any = normalized.grading_payload || {}
        if (Array.isArray(finalPayload.tables)) {
          finalPayload.tables.forEach((_t: unknown, i: number) => {
            expanded[i] = true
          })
        }
        setExpandedTables(expanded)

        toast.success(
          `AI đã tạo rubric thành công (${Array.isArray(finalPayload.tables) ? finalPayload.tables.length : 0} bảng${enforceExactPoints ? ', đã cân đúng tổng điểm' : ''})`
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
      {/* AI Generate + Points summary */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleAiGenerate}
          disabled={isGenerating}
          className="gap-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md h-9 px-4"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang phân tích dữ liệu...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI tạo Rubric từ script đáp án
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
              Tổng điểm các bảng: <strong>{allocatedPoints}</strong> /{' '}
              {totalPoints} điểm
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
            Phân bổ tự động
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
        <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Settings2 className="h-4 w-4 text-emerald-600" />
          Cấu hình chung cho toàn bộ INSERT
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Khi sai dữ liệu / thiếu dòng
            </label>
            <select
              value={settings.syntax_error_action ?? 'PARTIAL'}
              onChange={(e) =>
                updateSettings({
                  syntax_error_action: e.target.value as SyntaxErrorAction
                })
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="PARTIAL">Chấm từng phần (PARTIAL)</option>
              <option value="FAIL_ALL">0 điểm toàn bộ (FAIL_ALL)</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_extra_rows}
              onChange={(e) =>
                updateSettings({ allow_extra_rows: e.target.checked })
              }
              className="h-4 w-4 rounded border-border accent-emerald-600"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Cho phép dư dòng (Extra row)
              </p>
              <p className="text-[10px] text-muted-foreground">
                Sinh viên insert nhiều hơn đáp án
              </p>
            </div>
          </label>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Trừ điểm nếu dư 1 dòng (Penalty)
            </label>
            <input
              type="number"
              value={settings.penalty_per_extra_row ?? 0.1}
              onChange={(e) =>
                updateSettings({
                  penalty_per_extra_row: Number(e.target.value)
                })
              }
              min={0}
              step={0.01}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Tables Mapping */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Table2 className="h-4 w-4 text-emerald-600" />
            Danh sách Bảng Dữ Liệu ({tables.length})
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
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg bg-muted/10">
            Chưa có bảng nào. Nhấn &quot;Thêm bảng&quot; để bắt đầu thiết lập dữ
            liệu so khớp.
          </div>
        )}

        {tables.map((table, tableIdx) => (
          <TableEditor
            key={tableIdx}
            table={table}
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

function TableEditor({
  table,
  isExpanded,
  onToggle,
  onChange,
  onRemove
}: {
  table: InsertDataExpectedDataset
  isExpanded: boolean
  onToggle: () => void
  onChange: (t: InsertDataExpectedDataset) => void
  onRemove: () => void
}) {
  const handlePasteData = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const clipboardData = e.clipboardData.getData('text')
    if (!clipboardData) return

    // Split by lines
    const lines = clipboardData
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
    if (lines.length === 0) return

    // Auto-detect if pasting headers
    // We assume if table.columns_config is empty, first line is headers
    let cols = [...table.columns_config]
    let dataStartIdx = 0

    // basic CSV/TSV parser (tab or comma separated)
    const delimiter = lines[0].includes('\t')
      ? '\t'
      : lines[0].includes(',')
        ? ','
        : null

    if (delimiter) {
      if (cols.length === 0) {
        const headers = lines[0].split(delimiter).map((h) => h.trim())
        cols = headers.map((h) => ({
          name: h,
          is_primary_key: false,
          points: 0.05,
          match_type: 'EXACT' as MatchType
        }))
        dataStartIdx = 1 // skip header line
      }

      const newRows: InsertDataExpectedRow[] = []
      for (let i = dataStartIdx; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map((v) => v.trim())
        const rowObj: InsertDataExpectedRow = {}
        for (let j = 0; j < cols.length; j++) {
          if (j < values.length) {
            // Try to infer numeric/boolean
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let val: any = values[j]
            if (val === 'true' || val === 'TRUE') val = true
            else if (val === 'false' || val === 'FALSE') val = false
            else if (val === 'null' || val === 'NULL' || val === '') val = null
            else if (!isNaN(Number(val))) val = Number(val)
            rowObj[cols[j].name] = val
          }
        }
        newRows.push(rowObj)
      }

      onChange({
        ...table,
        columns_config: cols,
        expected_data: [...table.expected_data, ...newRows]
      })
      toast.success(`Đã dán và phân tích ${newRows.length} dòng dữ liệu`)
    } else {
      toast.error(
        'Không thể nhận diện định dạng dữ liệu (Yêu cầu TSV hoặc CSV)'
      )
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
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
        <Table2 className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="font-mono text-sm font-bold text-foreground">
          {table.table_name || 'Bảng chưa đặt tên'}
        </span>
        <span className="text-xs text-muted-foreground">
          ({table.expected_data.length} dòng · {table.table_points}đ)
        </span>
        <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
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
        <div className="border-t border-border p-4 space-y-6">
          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/20 p-3 rounded border border-border">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tên bảng SQL
              </label>
              <input
                type="text"
                value={table.table_name}
                onChange={(e) =>
                  onChange({ ...table, table_name: e.target.value })
                }
                placeholder="CONGTY"
                className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tổng điểm bảng này
              </label>
              <input
                type="number"
                value={table.table_points}
                onChange={(e) =>
                  onChange({ ...table, table_points: Number(e.target.value) })
                }
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                step={0.01}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Chiến lược chấm
              </label>
              <select
                value={table.row_grading_strategy}
                onChange={(e) =>
                  onChange({ ...table, row_grading_strategy: e.target.value })
                }
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="PARTIAL_BY_COLUMN">
                  Khớp từng cột (PARTIAL_BY_COLUMN)
                </option>
                <option value="ALL_OR_NOTHING">
                  Khớp nguyên dòng cấm sai lệch (ALL_OR_NOTHING)
                </option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Trừ điểm nếu thiếu 1 dòng
              </label>
              <input
                type="number"
                value={table.missing_row_penalty}
                onChange={(e) =>
                  onChange({
                    ...table,
                    missing_row_penalty: Number(e.target.value)
                  })
                }
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-red-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                step={0.01}
                min={0}
              />
            </div>
          </div>

          {/* Columns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                <Columns3 className="h-3.5 w-3.5 text-blue-500" />
                Cấu hình Cột (Rất quan trọng chọn Khóa Chính)
              </h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({
                    ...table,
                    columns_config: [
                      ...table.columns_config,
                      createDefaultColumn()
                    ]
                  })
                }
                className="gap-1 text-xs h-6"
              >
                <Plus className="h-3 w-3" /> Thêm cột
              </Button>
            </div>
            {table.columns_config.length > 0 && (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Tên Cột
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-amber-600">
                        Là khóa tham chiếu? (PK)
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        Cộng điểm nếu khớp
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Phương pháp duyệt chuỗi
                      </th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns_config.map((col, cIdx) => (
                      <tr
                        key={cIdx}
                        className={`${col.is_primary_key ? 'bg-amber-500/5' : ''} border-b last:border-0 border-border hover:bg-muted/20`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => {
                              const newCols = [...table.columns_config]
                              newCols[cIdx].name = e.target.value
                              onChange({ ...table, columns_config: newCols })
                            }}
                            placeholder="VD: MaCT"
                            className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={col.is_primary_key}
                            onChange={(e) => {
                              const newCols = [...table.columns_config]
                              newCols[cIdx].is_primary_key = e.target.checked
                              onChange({ ...table, columns_config: newCols })
                            }}
                            className="h-4 w-4 rounded accent-amber-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={col.points}
                            onChange={(e) => {
                              const newCols = [...table.columns_config]
                              newCols[cIdx].points = Number(e.target.value)
                              onChange({ ...table, columns_config: newCols })
                            }}
                            step={0.001}
                            min={0}
                            className="w-full text-center rounded border border-border bg-background px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={col.match_type}
                            onChange={(e) => {
                              const newCols = [...table.columns_config]
                              newCols[cIdx].match_type = e.target
                                .value as MatchType
                              onChange({ ...table, columns_config: newCols })
                            }}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                          >
                            {MATCH_TYPES.map((mt) => (
                              <option key={mt.value} value={mt.value}>
                                {mt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              onChange({
                                ...table,
                                columns_config: table.columns_config.filter(
                                  (_, i) => i !== cIdx
                                )
                              })
                            }
                            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-destructive/10"
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

          {/* Expected Data */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="flex items-center gap-1.5 text-xs font-bold text-foreground justify-between uppercase tracking-wider">
                <Rows4 className="h-3.5 w-3.5 text-teal-600" />
                Data Records / Dữ liệu mẫu (Số dòng:{' '}
                {table.expected_data.length})
              </h5>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...table, expected_data: [] })}
                  className="gap-1 text-xs h-6 text-destructive hover:text-destructive"
                >
                  Xóa tất cả Data
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const emptyRow: any = {}
                    table.columns_config.forEach((c) => (emptyRow[c.name] = ''))
                    onChange({
                      ...table,
                      expected_data: [...table.expected_data, emptyRow]
                    })
                  }}
                  className="gap-1 text-xs h-6"
                >
                  <Plus className="h-3 w-3" /> Thêm 1 dòng
                </Button>
              </div>
            </div>

            <textarea
              onPaste={handlePasteData}
              placeholder="Click vào ĐÂY và Bấm Ctrl+V để DÁN nhanh dữ liệu Copy từ Excel / Table Word..."
              className="w-full h-10 border border-dashed border-primary/40 bg-primary/5 rounded-md px-3 py-2 text-xs text-primary placeholder:text-primary/60 outline-none focus:ring-1 focus:ring-primary"
              value=""
              onChange={() => {}}
            />

            {table.expected_data.length > 0 &&
              table.columns_config.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-border mt-2">
                  <table className="w-full text-xs min-w-max">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-2 py-2 text-center w-8 text-muted-foreground">
                          #
                        </th>
                        {table.columns_config.map((col, cIdx) => (
                          <th
                            key={cIdx}
                            className="px-3 py-2 text-left font-semibold"
                          >
                            {col.name}{' '}
                            {col.is_primary_key && (
                              <span
                                className="text-amber-500 font-bold ml-1"
                                title="Primary Key"
                              >
                                🔑
                              </span>
                            )}
                          </th>
                        ))}
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.expected_data.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="border-b last:border-0 border-border hover:bg-muted/10"
                        >
                          <td className="px-2 py-2 text-center text-muted-foreground font-mono">
                            {rIdx + 1}
                          </td>
                          {table.columns_config.map((col, cIdx) => (
                            <td
                              key={`${rIdx}-${cIdx}`}
                              className="px-3 py-2 align-top"
                            >
                              {/* Minimal editable cell */}
                              <input
                                type="text"
                                value={
                                  row[col.name] !== null &&
                                  row[col.name] !== undefined
                                    ? String(row[col.name])
                                    : ''
                                }
                                onChange={(e) => {
                                  const newRows = [...table.expected_data]
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  let val: any = e.target.value
                                  if (val === 'null') val = null
                                  else if (val === 'true') val = true
                                  else if (val === 'false') val = false
                                  else if (
                                    !isNaN(Number(val)) &&
                                    val.trim() !== ''
                                  )
                                    val = Number(val)

                                  newRows[rIdx] = {
                                    ...newRows[rIdx],
                                    [col.name]: val
                                  }
                                  onChange({ ...table, expected_data: newRows })
                                }}
                                className="w-full bg-transparent border-b border-transparent focus:border-ring outline-none"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center align-top">
                            <button
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...table,
                                  expected_data: table.expected_data.filter(
                                    (_, i) => i !== rIdx
                                  )
                                })
                              }
                              className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  )
}
