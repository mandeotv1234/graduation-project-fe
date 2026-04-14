'use client'

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Sparkles,
  Trash2
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateGradingRubric } from '@/lib/actions'
import {
  GradingRubric,
  InsertDataGradingRule,
  SelectQueryGradingPayload,
  SelectTestCase
} from '@/lib/types'
import { GradingRulesEditor } from './grading-rules-editor'
import { TeacherSqlEditor } from './teacher-sql-editor'

const MIN_SELECT_TEST_CASES = 1

interface SelectQueryRubricEditorProps {
  examId: number
  totalPoints: number
  rubric: GradingRubric | null
  onChange: (rubric: GradingRubric) => void
  correctQuery?: string
  questionContent?: string
  dependencyOptions?: Array<{ value: string; label: string }>
  contextQueries?: Array<{
    questionType?: string
    content?: string
    correctQuery: string
  }>
  wizardStep?: number
}

function createDefaultCase(index: number): SelectTestCase {
  return {
    case_id: `TC_${String(index + 1).padStart(2, '0')}`,
    case_name: `Kich ban ${index + 1}`,
    penalty_value: 1,
    setup_custom_script: '',
    expected_result: {
      columns_config: [{ column_name: 'col1', data_type: 'NVARCHAR' }],
      rows: [['value1']]
    }
  }
}

function normalizeCase(tc: SelectTestCase, idx: number): SelectTestCase {
  const columns = Array.isArray(tc.expected_result?.columns_config)
    ? tc.expected_result.columns_config.filter((col) =>
        Boolean(col.column_name?.trim())
      )
    : []

  const rowsRaw = Array.isArray(tc.expected_result?.rows)
    ? tc.expected_result.rows
    : []
  const rows = rowsRaw.map((row) => {
    const normalizedRow = Array.isArray(row) ? [...row] : []
    while (normalizedRow.length < columns.length) {
      normalizedRow.push('')
    }
    return normalizedRow.slice(0, columns.length)
  })

  return {
    case_id: tc.case_id || `TC_${String(idx + 1).padStart(2, '0')}`,
    case_name: tc.case_name || `Kich ban ${idx + 1}`,
    penalty_value:
      typeof tc.penalty_value === 'number' ? tc.penalty_value : 1.0,
    setup_custom_script: tc.setup_custom_script || '',
    expected_result: {
      columns_config: columns,
      rows
    }
  }
}

function ensureMinimumCases(cases: SelectTestCase[]): SelectTestCase[] {
  const next = [...cases]
  while (next.length < MIN_SELECT_TEST_CASES) {
    const idx = next.length
    next.push({
      ...createDefaultCase(idx),
      case_name:
        idx === 1
          ? 'Biên dữ liệu'
          : idx === 2
            ? 'Không có kết quả'
            : idx === 3
              ? 'Ràng buộc FK/Dữ liệu phụ thuộc'
              : `Kịch bản ${idx + 1}`
    })
  }
  return next
}

function createDefaultRubric(totalPoints: number): GradingRubric {
  return {
    total_points: totalPoints,
    question_category: 'SELECT_QUERY',
    grading_payload: {
      test_cases: [createDefaultCase(0)]
    }
  }
}

function normalizeSelectRubric(
  rubric: GradingRubric,
  totalPoints: number
): GradingRubric {
  const payload = (rubric.grading_payload ||
    {}) as Partial<SelectQueryGradingPayload>
  const gradingRules = Array.isArray(payload.grading_rules)
    ? (payload.grading_rules as InsertDataGradingRule[])
    : []
  const testCasesRaw = Array.isArray(payload.test_cases)
    ? payload.test_cases
    : []

  const testCases = ensureMinimumCases(
    (testCasesRaw.length > 0 ? testCasesRaw : [createDefaultCase(0)]).map(
      normalizeCase
    )
  )

  return {
    ...rubric,
    total_points: totalPoints,
    question_category: 'SELECT_QUERY',
    grading_payload: {
      ...payload,
      grading_rules: gradingRules,
      test_cases: testCases
    }
  }
}

export function SelectQueryRubricEditor({
  totalPoints,
  rubric,
  onChange,
  correctQuery,
  questionContent,
  contextQueries = [],
  wizardStep
}: SelectQueryRubricEditorProps) {
  const currentRubric = normalizeSelectRubric(
    rubric ?? createDefaultRubric(totalPoints),
    totalPoints
  )
  const rubricRef = useRef<GradingRubric>(currentRubric)

  useEffect(() => {
    rubricRef.current = currentRubric
  }, [currentRubric])

  const payload = currentRubric.grading_payload as SelectQueryGradingPayload
  const gradingRules = Array.isArray(payload.grading_rules)
    ? payload.grading_rules
    : []
  const testCases = payload.test_cases

  const updateRubric = useCallback(
    (updater: (draft: GradingRubric) => GradingRubric) => {
      const next = updater({ ...rubricRef.current })
      rubricRef.current = next
      onChange(normalizeSelectRubric(next, totalPoints))
    },
    [onChange, totalPoints]
  )

  const setTestCases = (cases: SelectTestCase[]) => {
    updateRubric((r) => ({
      ...r,
      grading_payload: {
        ...(r.grading_payload as SelectQueryGradingPayload),
        grading_rules: gradingRules,
        test_cases: cases
      }
    }))
  }

  const setGradingRules = (nextRules: InsertDataGradingRule[]) => {
    updateRubric((r) => ({
      ...r,
      grading_payload: {
        ...(r.grading_payload as SelectQueryGradingPayload),
        grading_rules: nextRules,
        test_cases: [
          ...(r.grading_payload as SelectQueryGradingPayload).test_cases
        ]
      }
    }))
  }

  const [isGenerating, setIsGenerating] = useState(false)
  const [enforceExactPoints] = useState(true)
  const [expandedCases, setExpandedCases] = useState<Record<number, boolean>>(
    {}
  )

  const testCaseContextSummary = useMemo(() => {
    if (testCases.length === 0) {
      return '- Chưa có test case nào trong rubric SELECT.'
    }

    return testCases
      .map((testCase, index) => {
        const columns = testCase.expected_result.columns_config
          .map((column) => column.column_name)
          .filter(Boolean)

        return [
          `- ${testCase.case_id || `TC_${index + 1}`}`,
          `name=${testCase.case_name || 'Unnamed case'}`,
          `penalty_value=${testCase.penalty_value}`,
          `columns=[${columns.join(', ') || 'none'}]`,
          `rows=${testCase.expected_result.rows.length}`
        ].join(' | ')
      })
      .join('\n')
  }, [testCases])

  const toggleCase = (idx: number) => {
    setExpandedCases((prev) => ({
      ...prev,
      [idx]: prev[idx] === false ? true : false
    }))
  }

  const handleAiGenerate = async () => {
    if (!correctQuery?.trim()) {
      toast.error('Vui lòng nhập SQL đáp án SELECT trước khi tạo rubric AI')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateGradingRubric({
        correctQuery: correctQuery.trim(),
        questionContent: questionContent || '',
        totalPoints,
        questionType: 'SELECT_QUERY',
        contextQueries,
        enforceExactTotalPoints: enforceExactPoints
      })

      if (!result.data) {
        toast.error(result.message || 'AI không thể tạo rubric SELECT')
        return
      }

      const parsed: GradingRubric =
        typeof result.data === 'string' ? JSON.parse(result.data) : result.data
      const normalized = normalizeSelectRubric(parsed, totalPoints)
      onChange(normalized)

      const generatedCases =
        (normalized.grading_payload as SelectQueryGradingPayload).test_cases ||
        []
      if (generatedCases.length < MIN_SELECT_TEST_CASES) {
        toast.warning(
          `AI đã tạo rubric nhưng chưa đạt đủ ${MIN_SELECT_TEST_CASES} test case. Đã bổ sung case mặc định, vui lòng rà soát lại.`
        )
      }
    } catch (error) {
      console.error('SELECT rubric generation failed:', error)
      toast.error('Lỗi khi tạo rubric SELECT bằng AI')
    } finally {
      setIsGenerating(false)
    }
  }

  const isWizardMode = typeof wizardStep === 'number'

  // Auto-trigger AI generation when entering Step 2 with default placeholder data
  const hasAutoTriggeredRef = useRef(false)
  useEffect(() => {
    if (
      isWizardMode &&
      wizardStep === 2 &&
      correctQuery?.trim() &&
      !isGenerating &&
      !hasAutoTriggeredRef.current
    ) {
      hasAutoTriggeredRef.current = true
      handleAiGenerate()
    }
  }, [wizardStep, isWizardMode, correctQuery, isGenerating])

  return (
    <div className="space-y-4">
      {(!isWizardMode || wizardStep === 2) && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleAiGenerate}
            disabled={isGenerating}
            className="gap-2 h-9 px-4"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo test case...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                AI tạo Rubric
              </>
            )}
          </Button>
        </div>
      )}

      {(!isWizardMode || wizardStep === 3) && (
        <GradingRulesEditor
          questionType="SELECT_QUERY"
          totalPoints={totalPoints}
          rules={gradingRules}
          onChange={setGradingRules}
          correctQuery={correctQuery}
          questionContent={questionContent}
          contextSummary={testCaseContextSummary}
        />
      )}

      {(!isWizardMode || wizardStep === 2) && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
              Danh sách test case
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs"
              >
                {testCases.length}
              </Badge>
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                setTestCases([
                  ...testCases,
                  createDefaultCase(testCases.length)
                ])
              }
            >
              <Plus className="h-4 w-4" />
              Thêm test case
            </Button>
          </div>

          {testCases.map((tc, idx) => (
            <div
              key={`${tc.case_id}-${idx}`}
              className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                expandedCases[idx] !== false
                  ? 'bg-surface shadow-md border-outline-variant/50 relative z-10 scale-[1.01]'
                  : 'bg-surface-container-lowest shadow-sm border-outline-variant/30 hover:border-outline-variant/60 hover:shadow-md'
              }`}
            >
              {/* Header / Accordion trigger */}
              <div
                className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${
                  expandedCases[idx] !== false
                    ? 'bg-surface-container-sub-low border-b border-outline-variant/30'
                    : 'bg-transparent hover:bg-surface-container-sub-low/50'
                }`}
                onClick={() => toggleCase(idx)}
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container shadow-sm">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-on-surface">
                    {tc.case_name || `Test case ${idx + 1}`}
                  </span>
                  <span className="text-[11px] ml-3 px-2.5 py-0.5 rounded-full bg-error-container/10 text-error border border-error/20 font-medium">
                    Điểm trừ: -{tc.penalty_value}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTestCases(testCases.filter((_, i) => i !== idx))
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Xóa test case"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="text-muted-foreground">
                    {expandedCases[idx] !== false ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Accordion body */}
              {expandedCases[idx] !== false && (
                <div className="p-6 space-y-6 bg-surface-container-lowest">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant block">
                        Mã test case
                      </label>
                      <input
                        value={tc.case_id}
                        onChange={(e) => {
                          const next = [...testCases]
                          next[idx] = { ...tc, case_id: e.target.value }
                          setTestCases(next)
                        }}
                        placeholder="Mã test case"
                        className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-on-surface-variant block">
                        Tên kịch bản
                      </label>
                      <input
                        value={tc.case_name}
                        onChange={(e) => {
                          const next = [...testCases]
                          next[idx] = { ...tc, case_name: e.target.value }
                          setTestCases(next)
                        }}
                        placeholder="Tên kịch bản"
                        className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant block">
                        Điểm trừ
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={tc.penalty_value}
                        onChange={(e) => {
                          const next = [...testCases]
                          next[idx] = {
                            ...tc,
                            penalty_value: Number(e.target.value)
                          }
                          setTestCases(next)
                        }}
                        placeholder="Điểm trừ"
                        className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-error focus-visible:ring-1 focus-visible:ring-error text-error font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-semibold text-primary flex items-center gap-2 mb-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      Script setup test case
                    </label>
                    <div className="h-[180px] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container shadow-inner">
                      <TeacherSqlEditor
                        value={tc.setup_custom_script || ''}
                        onChange={(value) => {
                          const next = [...testCases]
                          next[idx] = {
                            ...tc,
                            setup_custom_script: value || ''
                          }
                          setTestCases(next)
                        }}
                        height="100%"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-outline-variant/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-on-surface border-l-4 border-primary pl-3">
                        Dữ liệu kết quả mong đợi
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs shadow-sm bg-surface-container hover:bg-surface-container-highest border-outline-variant/30"
                        onClick={() => {
                          const next = [...testCases]
                          const colsLen =
                            tc.expected_result.columns_config.length
                          const emptyRow = Array.from(
                            { length: colsLen },
                            () => ''
                          )
                          next[idx] = {
                            ...tc,
                            expected_result: {
                              ...tc.expected_result,
                              rows: [...tc.expected_result.rows, emptyRow]
                            }
                          }
                          setTestCases(next)
                        }}
                        disabled={
                          tc.expected_result.columns_config.length === 0
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm dòng
                      </Button>
                    </div>

                    {tc.expected_result.rows.length > 0 &&
                      tc.expected_result.columns_config.length > 0 && (
                        <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
                          <table className="w-full text-sm">
                            <thead className="bg-surface-container-sub-low border-b border-outline-variant/30">
                              <tr>
                                <th className="px-4 py-2 font-medium text-on-surface-variant w-12 text-center text-xs uppercase">
                                  #
                                </th>
                                {tc.expected_result.columns_config.map(
                                  (col, colIdx) => (
                                    <th
                                      key={`${tc.case_id}-head-${colIdx}`}
                                      className="px-4 py-3 font-semibold text-on-surface text-left"
                                    >
                                      {col.column_name || `Cột ${colIdx + 1}`}
                                    </th>
                                  )
                                )}
                                <th className="px-3 py-2 w-12" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                              {tc.expected_result.rows.map((row, rowIdx) => (
                                <tr
                                  key={`${tc.case_id}-row-${rowIdx}`}
                                  className="hover:bg-surface-container-highest/20 transition-colors group"
                                >
                                  <td className="px-4 py-2 text-center text-on-surface-variant font-medium text-xs">
                                    {rowIdx + 1}
                                  </td>
                                  {tc.expected_result.columns_config.map(
                                    (_, colIdx) => (
                                      <td
                                        key={`${tc.case_id}-cell-${rowIdx}-${colIdx}`}
                                        className="px-4 py-1.5"
                                      >
                                        <input
                                          value={
                                            row[colIdx] == null
                                              ? ''
                                              : String(row[colIdx])
                                          }
                                          onChange={(e) => {
                                            const next = [...testCases]
                                            const rows =
                                              tc.expected_result.rows.map(
                                                (r) => [...r]
                                              )
                                            rows[rowIdx][colIdx] =
                                              e.target.value
                                            next[idx] = {
                                              ...tc,
                                              expected_result: {
                                                ...tc.expected_result,
                                                rows
                                              }
                                            }
                                            setTestCases(next)
                                          }}
                                          className="flex h-9 w-full rounded-md border border-transparent bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none hover:bg-surface-container-high focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-sm"
                                          placeholder="..."
                                        />
                                      </td>
                                    )
                                  )}
                                  <td className="px-3 py-1 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...testCases]
                                        const rows =
                                          tc.expected_result.rows.filter(
                                            (_, i) => i !== rowIdx
                                          )
                                        next[idx] = {
                                          ...tc,
                                          expected_result: {
                                            ...tc.expected_result,
                                            rows
                                          }
                                        }
                                        setTestCases(next)
                                      }}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                      title="Xóa dòng"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                    {tc.expected_result.rows.length === 0 && (
                      <div className="text-[13px] text-muted-foreground text-center py-6 border border-dashed border-border/80 rounded-md">
                        Chưa có dòng dữ liệu nào. Bấm "Thêm dòng" để bổ sung.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
