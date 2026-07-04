'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buildInsertTablesFromAnswer } from '@/lib/actions'
import {
  GradingRubric,
  InsertDataExpectedDataset,
  InsertDataGradingPayload,
  InsertDataGradingRule,
  WhiteboxRule,
  WhiteboxSettings
} from '@/lib/types'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Key,
  Loader2,
  Maximize2,
  Minimize2,
  Settings2,
  Table2,
  X
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AiRubricRefinementPanel } from './ai-rubric-refinement-panel'
import { GradingRulesEditor } from './grading-rules-editor'
import { WhiteboxRulesEditor } from './whitebox-rules-editor'

// ===== Default factories =====

function createDefaultRubric(totalPoints: number): GradingRubric {
  return {
    total_points: totalPoints,
    question_category: 'INSERT_DATA',
    grading_payload: {
      grading_rules: [],
      tables: [],
      whitebox_rules: [],
      whitebox_settings: {}
    }
  }
}

type NormalizedInsertDataPayload = InsertDataGradingPayload & {
  grading_rules: InsertDataGradingRule[]
  tables: InsertDataExpectedDataset[]
  whitebox_rules: WhiteboxRule[]
  whitebox_settings: WhiteboxSettings
}

function normalizeInsertDataPayload(
  payload: GradingRubric['grading_payload'] | undefined
): NormalizedInsertDataPayload {
  if (!payload || typeof payload !== 'object') {
    return {
      grading_rules: [],
      tables: [],
      whitebox_rules: [],
      whitebox_settings: {}
    }
  }

  const payloadRecord = payload as Record<string, unknown>

  return {
    ...(payloadRecord as Partial<InsertDataGradingPayload>),
    grading_rules: Array.isArray(payloadRecord.grading_rules)
      ? (payloadRecord.grading_rules as InsertDataGradingRule[])
      : [],
    tables: Array.isArray(payloadRecord.tables)
      ? (payloadRecord.tables as InsertDataExpectedDataset[])
      : [],
    whitebox_rules: Array.isArray(payloadRecord.whitebox_rules)
      ? (payloadRecord.whitebox_rules as WhiteboxRule[])
      : [],
    whitebox_settings:
      payloadRecord.whitebox_settings &&
      typeof payloadRecord.whitebox_settings === 'object' &&
      !Array.isArray(payloadRecord.whitebox_settings)
        ? (payloadRecord.whitebox_settings as WhiteboxSettings)
        : {}
  }
}

// ===== Props =====

interface InsertDataRubricEditorProps {
  examId: number
  totalPoints: number
  rubric: GradingRubric | null
  onChange: (rubric: GradingRubric) => void
  correctQuery?: string
  questionContent?: string
  wizardStep?: number
}

export function InsertDataRubricEditor({
  examId,
  totalPoints,
  rubric,
  onChange,
  correctQuery,
  questionContent,
  wizardStep
}: InsertDataRubricEditorProps) {
  const currentRubric = rubric ?? createDefaultRubric(totalPoints)
  const rubricRef = useRef<GradingRubric>(currentRubric)

  useEffect(() => {
    rubricRef.current = currentRubric
  }, [currentRubric])

  const payload = useMemo(
    () => normalizeInsertDataPayload(currentRubric.grading_payload),
    [currentRubric.grading_payload]
  )
  const gradingRules = payload.grading_rules
  const tables = payload.tables
  const whiteboxRules = payload.whitebox_rules
  const whiteboxSettings = payload.whitebox_settings

  // ===== Helper to update rubric immutably =====
  const updateRubric = useCallback(
    (updater: (draft: GradingRubric) => GradingRubric) => {
      const next = updater({ ...rubricRef.current })
      rubricRef.current = next
      onChange(next)
    },
    [onChange]
  )

  const setTables = (newTables: InsertDataExpectedDataset[]) => {
    updateRubric((r) => {
      const normalizedPayload = normalizeInsertDataPayload(r.grading_payload)
      return {
        ...r,
        total_points: totalPoints,
        question_category: 'INSERT_DATA',
        grading_payload: {
          ...normalizedPayload,
          grading_rules: normalizedPayload.grading_rules,
          tables: newTables
        }
      }
    })
  }

  const setGradingRules = (newRules: InsertDataGradingRule[]) => {
    updateRubric((r) => {
      const normalizedPayload = normalizeInsertDataPayload(r.grading_payload)
      return {
        ...r,
        total_points: totalPoints,
        question_category: 'INSERT_DATA',
        grading_payload: {
          ...normalizedPayload,
          grading_rules: newRules,
          tables: normalizedPayload.tables
        }
      }
    })
  }

  const setWhitebox = (
    nextRules: WhiteboxRule[],
    nextSettings: WhiteboxSettings
  ) => {
    updateRubric((r) => {
      const normalizedPayload = normalizeInsertDataPayload(r.grading_payload)
      return {
        ...r,
        total_points: totalPoints,
        question_category: 'INSERT_DATA',
        grading_payload: {
          ...normalizedPayload,
          whitebox_rules: nextRules,
          whitebox_settings: nextSettings
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

  const expandAll = () => {
    const newState: Record<number, boolean> = {}
    tables.forEach((_, idx) => {
      newState[idx] = true
    })
    setExpandedTables(newState)
  }

  const collapseAll = () => {
    const newState: Record<number, boolean> = {}
    tables.forEach((_, idx) => {
      newState[idx] = false
    })
    setExpandedTables(newState)
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
  const [showAdvancedJson, setShowAdvancedJson] = useState(false)
  const [advancedJsonText, setAdvancedJsonText] = useState('')

  const expectedJsonPreview = useMemo(
    () => ({
      question_category: 'INSERT_DATA',
      total_points: totalPoints,
      grading_payload: {
        ...payload,
        grading_rules: gradingRules,
        tables,
        whitebox_rules: whiteboxRules,
        whitebox_settings: whiteboxSettings
      }
    }),
    [
      totalPoints,
      payload,
      gradingRules,
      tables,
      whiteboxRules,
      whiteboxSettings
    ]
  )

  useEffect(() => {
    setAdvancedJsonText(
      JSON.stringify(expectedJsonPreview.grading_payload, null, 2)
    )
  }, [expectedJsonPreview])

  const tableContextSummary = useMemo(() => {
    if (tables.length === 0) {
      return '- Chưa có cấu hình bảng nào.'
    }

    return tables
      .map((table) => {
        const tableName = (table.table_name || '').trim() || 'UNKNOWN_TABLE'
        const columns = Array.isArray(table.columns_config)
          ? table.columns_config
          : []
        const gradedColumns = columns
          .filter((column) => column.is_graded !== false)
          .map((column) => String(column.name || '').trim())
          .filter(Boolean)
        const ignoredColumns = columns
          .filter((column) => column.is_graded === false)
          .map((column) => String(column.name || '').trim())
          .filter(Boolean)

        return [
          `- ${tableName}`,
          `graded_columns=[${gradedColumns.join(', ') || 'none'}]`,
          `ignored_columns=[${ignoredColumns.join(', ') || 'none'}]`,
          `row_strategy=${table.row_grading_strategy || 'PARTIAL_BY_COLUMN'}`
        ].join(' | ')
      })
      .join('\n')
  }, [tables])

  const handleBuildTablesFromAnswer = async () => {
    if (!correctQuery?.trim()) {
      toast.error('Vui lòng nhập SQL đáp án trước khi tạo dữ liệu bảng')
      return
    }

    setIsBuildingTables(true)
    try {
      const result = await buildInsertTablesFromAnswer(examId, {
        correctQuery: correctQuery.trim()
      })

      if (!result.data) {
        toast.error(result.message || 'Không thể tạo dữ liệu bảng từ đáp án')
        return
      }

      const generatedTables = Array.isArray(result.data.tables)
        ? (result.data.tables as InsertDataExpectedDataset[])
        : []

      if (generatedTables.length === 0) {
        toast.error('Không tạo được tables từ SQL đáp án.')
        return
      }

      setTables(generatedTables)
      setActiveTableIndex(0)
      toast.success(
        `Đã dựng dữ liệu cho ${generatedTables.length} bảng để chấm thử`
      )
    } catch {
      toast.error('Lỗi khi dựng dữ liệu bảng từ đáp án. Vui lòng thử lại.')
    } finally {
      setIsBuildingTables(false)
    }
  }

  const resetAdvancedJsonEditor = () => {
    setAdvancedJsonText(
      JSON.stringify(expectedJsonPreview.grading_payload, null, 2)
    )
  }

  const applyAdvancedJson = () => {
    try {
      const parsed = JSON.parse(advancedJsonText) as unknown

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        toast.error('JSON phải là một object (grading_payload)')
        return
      }

      const parsedPayload = parsed as Record<string, unknown>

      updateRubric((r) => {
        return {
          ...r,
          total_points: totalPoints,
          question_category: 'INSERT_DATA',
          grading_payload: {
            ...normalizeInsertDataPayload(
              parsedPayload as GradingRubric['grading_payload']
            ),
            grading_rules: Array.isArray(parsedPayload.grading_rules)
              ? (parsedPayload.grading_rules as InsertDataGradingRule[])
              : [],
            tables: Array.isArray(parsedPayload.tables)
              ? (parsedPayload.tables as InsertDataExpectedDataset[])
              : [],
            whitebox_rules: Array.isArray(parsedPayload.whitebox_rules)
              ? (parsedPayload.whitebox_rules as WhiteboxRule[])
              : [],
            whitebox_settings:
              parsedPayload.whitebox_settings &&
              typeof parsedPayload.whitebox_settings === 'object' &&
              !Array.isArray(parsedPayload.whitebox_settings)
                ? (parsedPayload.whitebox_settings as WhiteboxSettings)
                : {}
          }
        }
      })
      toast.success('Đã áp dụng payload JSON')
    } catch {
      toast.error('JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.')
    }
  }

  const handleApplyAiRefinement = useCallback(
    (nextRubric: GradingRubric) => {
      const activeTableName = tables[activeTableIndex]?.table_name
      const normalizedPayload = normalizeInsertDataPayload(
        nextRubric.grading_payload
      )
      const normalizedRubric: GradingRubric = {
        ...nextRubric,
        total_points: totalPoints,
        question_category: 'INSERT_DATA',
        grading_payload: {
          ...normalizedPayload,
          grading_rules: normalizedPayload.grading_rules,
          tables: normalizedPayload.tables,
          whitebox_rules: normalizedPayload.whitebox_rules,
          whitebox_settings: normalizedPayload.whitebox_settings
        }
      }
      const nextActiveIndex = activeTableName
        ? normalizedPayload.tables.findIndex(
            (table) => table.table_name === activeTableName
          )
        : -1

      rubricRef.current = normalizedRubric
      onChange(normalizedRubric)
      setActiveTableIndex(nextActiveIndex >= 0 ? nextActiveIndex : 0)
      setExpandedTables((prev) => ({
        ...prev,
        [nextActiveIndex >= 0 ? nextActiveIndex : 0]: true
      }))
    },
    [activeTableIndex, onChange, tables, totalPoints]
  )
  const isAnyExpanded = useMemo(
    () => tables.some((_, idx) => expandedTables[idx] ?? false),
    [tables, expandedTables]
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
                Đang tạo dữ liệu...
              </>
            ) : (
              <>
                <Table2 className="mr-1.5 h-4 w-4" />
                Cấu hình từ đáp án
              </>
            )}
          </Button>
        </div>
      )}

      {(!isWizardMode || wizardStep === 2) && (
        <AiRubricRefinementPanel
          examId={examId}
          questionType="INSERT_DATA"
          totalPoints={totalPoints}
          currentRubric={expectedJsonPreview}
          onApply={handleApplyAiRefinement}
          correctQuery={correctQuery}
          questionContent={questionContent}
          activeTargetId={tables[activeTableIndex]?.table_name}
          activeTargetLabel={
            tables[activeTableIndex]?.table_name ||
            (tables.length > 0 ? `Bảng ${activeTableIndex + 1}` : undefined)
          }
        />
      )}

      {(!isWizardMode || wizardStep === 3) && (
        <GradingRulesEditor
          questionType="INSERT_DATA"
          totalPoints={totalPoints}
          rules={gradingRules}
          onChange={setGradingRules}
          onTablesPatch={(tablePatches) => {
            if (!tablePatches || tablePatches.length === 0) return
            // Merge AI suggestion into tables array if the user generated a prompt that touches table properties
            // For INSERT_DATA we don't have penalties inside table object as often as CREATE_TABLE but
            // we can at least ensure the table name exists
            const nextTables = [...tables]
            let hasChanges = false

            tablePatches.forEach((p) => {
              const patch = p as Record<string, unknown> & {
                table_name?: string
              }
              if (!patch || !patch.table_name) return
              const normalizedName = patch.table_name.trim().toLowerCase()
              const idx = nextTables.findIndex(
                (t) =>
                  (t.table_name || '').trim().toLowerCase() === normalizedName
              )

              // simple merge or push new
              if (idx < 0) {
                nextTables.push(patch as unknown as InsertDataExpectedDataset)
                hasChanges = true
              }
            })

            if (hasChanges) {
              setTables(nextTables)
            }
          }}
          correctQuery={correctQuery}
          questionContent={questionContent}
          contextSummary={tableContextSummary}
        />
      )}

      {(!isWizardMode || wizardStep === 4) && (
        <WhiteboxRulesEditor
          questionType="INSERT_DATA"
          totalPoints={totalPoints}
          rules={whiteboxRules}
          settings={whiteboxSettings}
          onChange={setWhitebox}
          sqlForPreview={correctQuery}
        />
      )}

      {(!isWizardMode || wizardStep === 2) && tables.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Chi tiết kỳ vọng
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0 text-[10px]"
              >
                {tables.length}
              </Badge>
            </h3>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentStrategy =
                    tables[0]?.row_grading_strategy || 'PARTIAL_BY_COLUMN'
                  const newStrategy =
                    currentStrategy === 'ALL_OR_NOTHING'
                      ? 'PARTIAL_BY_COLUMN'
                      : 'ALL_OR_NOTHING'
                  setTables(
                    tables.map((t) => ({
                      ...t,
                      row_grading_strategy: newStrategy
                    }))
                  )
                  toast.success(
                    `Đã đổi chiến lược tất cả thành: ${newStrategy === 'ALL_OR_NOTHING' ? 'Đúng tất cả các cột' : 'Chấm từng cột'}`
                  )
                }}
                className="h-7 px-2 text-[10px] gap-1"
                title="Đổi chiến lược chấm cho tất cả các bảng"
              >
                <Settings2 className="h-3 w-3" />
                Đổi chiến lược
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={isAnyExpanded ? collapseAll : expandAll}
                className="h-7 px-2 text-[10px] gap-1 hover:bg-muted"
              >
                {isAnyExpanded ? (
                  <>
                    <Minimize2 className="h-3 w-3" />
                    Thu gọn tất cả
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3 w-3" />
                    Mở tất cả
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-2">
            {tables.map((table, tIdx) => {
              const tableName = table.table_name || `Bảng ${tIdx + 1}`

              return (
                <Button
                  key={`${tableName}-${tIdx}`}
                  type="button"
                  variant={tIdx === activeTableIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveTableIndex(tIdx)
                    setExpandedTables((prev) => ({ ...prev, [tIdx]: true }))
                  }}
                  className="h-8 min-w-0 max-w-[13rem] justify-start truncate text-xs"
                  title={tableName}
                >
                  <span className="truncate">TC{tIdx + 1}</span>
                </Button>
              )
            })}
          </div>

          <div className="grid gap-4">
            {tables.map((table, tIdx) => {
              if (tIdx !== activeTableIndex) return null

              const tableName = table.table_name || `Bảng ${tIdx + 1}`
              const cols = Array.isArray(table.columns_config)
                ? table.columns_config
                : []
              const dataRows = Array.isArray(table.expected_data)
                ? table.expected_data
                : []

              const toggleColumnGraded = (colName: string) => {
                const newTables = [...tables]
                const targetTable = { ...newTables[tIdx] }
                const targetCols = [...cols]
                const colIdx = targetCols.findIndex((c) => c.name === colName)
                if (colIdx >= 0) {
                  targetCols[colIdx] = {
                    ...targetCols[colIdx],
                    is_graded: !targetCols[colIdx].is_graded
                  }
                  targetTable.columns_config = targetCols
                  newTables[tIdx] = targetTable
                  setTables(newTables)
                }
              }

              const updateDataRow = (
                colName: string,
                rowIdx: number,
                newValue: string
              ) => {
                const newTables = [...tables]
                const targetTable = { ...newTables[tIdx] }
                const targetDataRows = [...dataRows]

                let parsedValue: string | number | null = newValue
                if (newValue === '') {
                  parsedValue = null
                } else if (!isNaN(Number(newValue)) && newValue.trim() !== '') {
                  parsedValue = Number(newValue)
                }

                targetDataRows[rowIdx] = {
                  ...targetDataRows[rowIdx],
                  [colName]: parsedValue
                }
                targetTable.expected_data = targetDataRows
                newTables[tIdx] = targetTable
                setTables(newTables)
              }

              const isExpanded = expandedTables[tIdx] ?? false

              return (
                <div
                  key={tIdx}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div
                    onClick={() => toggleTable(tIdx)}
                    className="w-full border-b border-border bg-muted/50 px-4 py-2.5 flex items-center justify-between hover:bg-muted transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <Table2 className="h-4 w-4 text-primary" />
                        {tableName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const newTables = [...tables]
                        newTables[tIdx] = {
                          ...newTables[tIdx],
                          row_grading_strategy:
                            table.row_grading_strategy === 'ALL_OR_NOTHING'
                              ? 'PARTIAL_BY_COLUMN'
                              : 'ALL_OR_NOTHING'
                        }
                        setTables(newTables)
                      }}
                      className="text-xs text-muted-foreground bg-background hover:bg-muted hover:text-foreground px-2 py-1 rounded-md border border-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      title="Nhấn để đổi chiến lược chấm cho bảng này"
                    >
                      Chiến lược:{' '}
                      <span className="font-medium">
                        {table.row_grading_strategy === 'ALL_OR_NOTHING'
                          ? 'Đúng tất cả các cột'
                          : 'Chấm từng cột'}
                      </span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-4 grid gap-6 md:grid-cols-2">
                      {/* Cột cấu hình */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Cấu hình cột
                        </h4>
                        <div className="rounded-md border border-border overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-xs text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 font-medium">
                                  Tên cột
                                </th>
                                <th className="px-3 py-2 font-medium text-center">
                                  Khóa chính
                                </th>
                                <th className="px-3 py-2 font-medium text-center w-24">
                                  Chấm điểm?
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                              {cols.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="px-3 py-6 text-center text-xs text-muted-foreground"
                                  >
                                    Chưa có cấu hình cột
                                  </td>
                                </tr>
                              )}
                              {cols.map((col, cIdx) => (
                                <tr
                                  key={cIdx}
                                  className="hover:bg-muted/30 transition-colors"
                                >
                                  <td className="px-3 py-2 font-medium text-foreground">
                                    {col.name}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {col.is_primary_key ? (
                                      <Key className="inline h-3 w-3 text-amber-500" />
                                    ) : (
                                      <span className="text-muted-foreground/50">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleColumnGraded(col.name)
                                      }
                                      className={`inline-flex items-center justify-center p-1 rounded-md transition-colors ${col.is_graded !== false ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200' : 'text-red-500 bg-red-100 hover:bg-red-200'}`}
                                      title={
                                        col.is_graded !== false
                                          ? 'Đang bật chấm điểm'
                                          : 'Đã tắt chấm điểm'
                                      }
                                    >
                                      {col.is_graded !== false ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <X className="h-3 w-3" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Dữ liệu kỳ vọng */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                          Dữ liệu mẫu
                          <Badge
                            variant="secondary"
                            className="rounded-full px-2 py-0 text-[10px]"
                          >
                            {dataRows.length} dòng
                          </Badge>
                        </h4>
                        <div className="rounded-md border border-border overflow-auto max-h-[300px]">
                          <table className="w-full text-xs text-left whitespace-nowrap">
                            <thead className="bg-muted text-muted-foreground sticky top-0 z-10 shadow-sm">
                              <tr>
                                {cols.map((c, i) => (
                                  <th key={i} className="px-3 py-2 font-medium">
                                    {c.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                              {dataRows.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={cols.length || 1}
                                    className="px-3 py-6 text-center text-muted-foreground"
                                  >
                                    Bảng rỗng
                                  </td>
                                </tr>
                              )}
                              {dataRows.map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  className="hover:bg-muted/30 transition-colors"
                                >
                                  {cols.map((c, i) => {
                                    const val = row[c.name]
                                    const strVal =
                                      val === null || val === undefined
                                        ? ''
                                        : String(val)
                                    return (
                                      <td
                                        key={i}
                                        className={`px-2 py-1 ${c.is_graded === false ? 'opacity-40 text-muted-foreground' : 'text-foreground'}`}
                                      >
                                        <input
                                          type="text"
                                          value={strVal}
                                          onChange={(e) =>
                                            updateDataRow(
                                              c.name,
                                              rIdx,
                                              e.target.value
                                            )
                                          }
                                          placeholder="NULL"
                                          className={`w-full bg-transparent px-2 py-1 border border-transparent hover:border-border focus:border-ring focus:outline-none rounded transition-colors text-xs ${c.is_graded === false ? 'line-through' : ''}`}
                                        />
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(!isWizardMode || wizardStep === 2) && (
        <div className="rounded-lg border border-border bg-card p-4">
          <button
            type="button"
            onClick={() => setShowAdvancedJson((prev) => !prev)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-sm font-medium text-foreground">
              Tùy chọn nâng cao (Cấu hình với json)
            </span>
            {showAdvancedJson ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showAdvancedJson && (
            <div className="mt-3 space-y-2">
              <textarea
                value={advancedJsonText}
                onChange={(event) => setAdvancedJsonText(event.target.value)}
                rows={14}
                spellCheck={false}
                className="w-full rounded-md border border-outline-variant/50 bg-surface-container-sub-low px-3 py-2 font-mono text-xs text-on-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetAdvancedJsonEditor}
                >
                  Khôi phục theo dữ liệu hiện tại
                </Button>
                <Button type="button" size="sm" onClick={applyAdvancedJson}>
                  Áp dụng JSON
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
