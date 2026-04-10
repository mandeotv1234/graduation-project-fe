'use client'

import React, { useCallback, useMemo, useState } from 'react'
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Equal,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { TeacherSqlEditor } from './teacher-sql-editor'
import {
  generateGradingRubric,
  executeSelectTestCaseConfig
} from '@/lib/actions'
import {
  GradingRubric,
  InsertDataGradingRule,
  SelectGlobalGradingRules,
  SelectExpectedColumnConfig,
  SelectTestCase,
  SelectQueryGradingPayload
} from '@/lib/types'
import { GradingRulesEditor } from './grading-rules-editor'

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
}

function createDefaultRules(): SelectGlobalGradingRules {
  return {
    baseline_weight_ratio: 0,
    wrong_order_penalty: 0,
    wrong_column_order_penalty: 0.1,
    extra_row_penalty: 0.2
  }
}

function createDefaultCase(index: number): SelectTestCase {
  return {
    case_id: `TC_${String(index + 1).padStart(2, '0')}`,
    case_name: `Kich ban ${index + 1}`,
    is_hidden: false,
    weight_ratio: 1,
    setup_dependency_id: '',
    setup_custom_script: '',
    expected_result: {
      expected_row_count: 1,
      columns_config: [{ column_name: 'col1', data_type: 'NVARCHAR' }],
      rows: [['value1']]
    }
  }
}

function normalizeWeightRatios(
  cases: SelectTestCase[],
  targetTotal: number = 1
): SelectTestCase[] {
  if (cases.length === 0) {
    return cases
  }

  const safeTarget = Math.max(0, Math.min(1, targetTotal))

  const safe = cases.map((tc) => ({
    ...tc,
    weight_ratio:
      Number.isFinite(tc.weight_ratio) && tc.weight_ratio > 0
        ? tc.weight_ratio
        : 0
  }))

  const total = safe.reduce((sum, tc) => sum + tc.weight_ratio, 0)
  if (total <= 0) {
    const per = Math.round((safeTarget / safe.length) * 100) / 100
    const fallback = safe.map((tc) => ({ ...tc, weight_ratio: per }))
    const diff =
      Math.round(
        (safeTarget - fallback.reduce((s, x) => s + x.weight_ratio, 0)) * 100
      ) / 100
    fallback[fallback.length - 1] = {
      ...fallback[fallback.length - 1],
      weight_ratio: Math.max(
        0,
        Math.round((fallback[fallback.length - 1].weight_ratio + diff) * 100) /
          100
      )
    }
    return fallback
  }

  const normalized = safe.map((tc) => ({
    ...tc,
    weight_ratio: Math.round((tc.weight_ratio / total) * safeTarget * 100) / 100
  }))
  const diff =
    Math.round(
      (safeTarget - normalized.reduce((sum, tc) => sum + tc.weight_ratio, 0)) *
        100
    ) / 100
  normalized[normalized.length - 1] = {
    ...normalized[normalized.length - 1],
    weight_ratio: Math.max(
      0,
      Math.round(
        (normalized[normalized.length - 1].weight_ratio + diff) * 100
      ) / 100
    )
  }
  return normalized
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
    is_hidden: Boolean(tc.is_hidden),
    weight_ratio: typeof tc.weight_ratio === 'number' ? tc.weight_ratio : 0,
    setup_dependency_id: tc.setup_dependency_id || '',
    setup_custom_script: tc.setup_custom_script || '',
    expected_result: {
      expected_row_count:
        typeof tc.expected_result?.expected_row_count === 'number'
          ? tc.expected_result.expected_row_count
          : rows.length,
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
              : `Kịch bản ${idx + 1}`,
      is_hidden: idx >= 2
    })
  }
  return next
}

function createDefaultRubric(totalPoints: number): GradingRubric {
  return {
    total_points: totalPoints,
    question_category: 'SELECT_QUERY',
    grading_payload: {
      global_grading_rules: createDefaultRules(),
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
  const rules = payload.global_grading_rules || createDefaultRules()
  const gradingRules = Array.isArray(payload.grading_rules)
    ? (payload.grading_rules as InsertDataGradingRule[])
    : []
  const testCasesRaw = Array.isArray(payload.test_cases)
    ? payload.test_cases
    : []

  const baseCases = ensureMinimumCases(
    (testCasesRaw.length > 0 ? testCasesRaw : [createDefaultCase(0)]).map(
      normalizeCase
    )
  )
  const baselineWeightRatio =
    typeof rules.baseline_weight_ratio === 'number'
      ? Math.max(0, Math.min(1, rules.baseline_weight_ratio))
      : 0
  const remainingWeight = Math.max(
    0,
    Math.round((1 - baselineWeightRatio) * 100) / 100
  )
  const testCases = normalizeWeightRatios(baseCases, remainingWeight)

  return {
    ...rubric,
    total_points: totalPoints,
    question_category: 'SELECT_QUERY',
    grading_payload: {
      ...payload,
      global_grading_rules: {
        baseline_weight_ratio: baselineWeightRatio,
        wrong_order_penalty:
          typeof rules.wrong_order_penalty === 'number'
            ? rules.wrong_order_penalty
            : 0,
        wrong_column_order_penalty:
          typeof rules.wrong_column_order_penalty === 'number'
            ? rules.wrong_column_order_penalty
            : typeof rules.wrong_column_name_penalty === 'number'
              ? rules.wrong_column_name_penalty
              : 0.1,
        extra_row_penalty:
          typeof rules.extra_row_penalty === 'number'
            ? rules.extra_row_penalty
            : 0.2
      },
      grading_rules: gradingRules,
      test_cases: testCases
    }
  }
}

export function SelectQueryRubricEditor({
  examId,
  totalPoints,
  rubric,
  onChange,
  correctQuery,
  questionContent,
  dependencyOptions = [],
  contextQueries = []
}: SelectQueryRubricEditorProps) {
  const currentRubric = normalizeSelectRubric(
    rubric ?? createDefaultRubric(totalPoints),
    totalPoints
  )
  const payload = currentRubric.grading_payload as SelectQueryGradingPayload
  const rules = payload.global_grading_rules
  const gradingRules = Array.isArray(payload.grading_rules)
    ? payload.grading_rules
    : []
  const testCases = payload.test_cases

  const updateRubric = useCallback(
    (updater: (draft: GradingRubric) => GradingRubric) => {
      onChange(
        normalizeSelectRubric(updater({ ...currentRubric }), totalPoints)
      )
    },
    [currentRubric, onChange, totalPoints]
  )

  const updateRules = (partial: Partial<SelectGlobalGradingRules>) => {
    updateRubric((r) => ({
      ...r,
      grading_payload: {
        ...(r.grading_payload as SelectQueryGradingPayload),
        grading_rules: gradingRules,
        global_grading_rules: {
          ...(r.grading_payload as SelectQueryGradingPayload)
            .global_grading_rules,
          ...partial
        }
      }
    }))
  }

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
        global_grading_rules: {
          ...(r.grading_payload as SelectQueryGradingPayload)
            .global_grading_rules
        },
        test_cases: [...(r.grading_payload as SelectQueryGradingPayload).test_cases]
      }
    }))
  }

  const totalWeight = useMemo(
    () =>
      Math.round(
        testCases.reduce((sum, tc) => sum + (tc.weight_ratio || 0), 0) * 100
      ) / 100,
    [testCases]
  )

  const combinedWeight = useMemo(
    () =>
      Math.round((totalWeight + (rules.baseline_weight_ratio || 0)) * 100) /
      100,
    [rules.baseline_weight_ratio, totalWeight]
  )

  const coverageStatus = useMemo(() => {
    const hasBoundaryCase = testCases.some(
      (tc) =>
        tc.is_hidden ||
        Boolean(tc.setup_custom_script?.trim()) ||
        Boolean(tc.setup_dependency_id?.trim())
    )
    const hasEnoughCases = testCases.length >= MIN_SELECT_TEST_CASES
    const hasRowsEveryCase = testCases.every(
      (tc) => tc.expected_result.rows.length > 0
    )
    const hasColumnsEveryCase = testCases.every(
      (tc) => tc.expected_result.columns_config.length > 0
    )
    const weightOk = combinedWeight === 1

    const ready =
      hasEnoughCases && hasRowsEveryCase && hasColumnsEveryCase && weightOk
    return {
      ready,
      hasBoundaryCase,
      hasEnoughCases,
      hasRowsEveryCase,
      hasColumnsEveryCase,
      weightOk
    }
  }, [combinedWeight, testCases])

  const [isGenerating, setIsGenerating] = useState(false)
  const [enforceExactPoints, setEnforceExactPoints] = useState(true)
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
          `weight=${testCase.weight_ratio}`,
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
      const generatedWeight =
        Math.round(
          generatedCases.reduce((sum, tc) => sum + tc.weight_ratio, 0) * 100
        ) / 100
      const generatedRules = (
        normalized.grading_payload as SelectQueryGradingPayload
      ).global_grading_rules
      const generatedCombined =
        Math.round(
          (generatedWeight + (generatedRules.baseline_weight_ratio || 0)) * 100
        ) / 100
      if (
        generatedCases.length < MIN_SELECT_TEST_CASES ||
        generatedCombined !== 1
      ) {
        toast.warning(
          `AI đã tạo rubric nhưng chưa đạt đủ ${MIN_SELECT_TEST_CASES} test case hoặc sai tỉ trọng. Đã bổ sung case mặc định, vui lòng rà soát lại.`
        )
      } else {
        toast.success(
          `AI đã tạo rubric SELECT test case thành công${enforceExactPoints ? ' và cân đúng tỉ trọng' : ''}`
        )
      }
    } catch (error) {
      console.error('SELECT rubric generation failed:', error)
      toast.error('Lỗi khi tạo rubric SELECT bằng AI')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
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
              AI tạo Rubric SELECT (phủ 100%)
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="gap-2 h-9 border border-border bg-muted/50 hover:bg-muted"
          onClick={() => {
            const remaining = Math.max(
              0,
              Math.round((1 - (rules.baseline_weight_ratio || 0)) * 100) / 100
            )
            setTestCases(normalizeWeightRatios(testCases, remaining))
            toast.success(
              'Đã chuẩn hóa tỉ trọng test case theo phần điểm còn lại'
            )
          }}
        >
          <Equal className="h-4 w-4" />
          Chuẩn hóa tỉ trọng
        </Button>

        <div
          className={`flex-1 min-w-[300px] rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            combinedWeight === 1
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {combinedWeight === 1 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>
              Tỉ trọng baseline:{' '}
              <strong className="font-semibold">
                {rules.baseline_weight_ratio || 0}
              </strong>{' '}
              · test case:{' '}
              <strong className="font-semibold">{totalWeight}</strong> · tổng:{' '}
              <strong className="font-semibold">{combinedWeight}</strong> (yêu
              cầu = 1.00)
            </span>
          </div>
        </div>
      </div>

      <GradingRulesEditor
        questionType="SELECT_QUERY"
        totalPoints={totalPoints}
        rules={gradingRules}
        onChange={setGradingRules}
        correctQuery={correctQuery}
        questionContent={questionContent}
        contextSummary={testCaseContextSummary}
      />

      <div
        className={`rounded-md border px-4 py-3 text-sm transition-colors ${
          coverageStatus.ready
            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
            : 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400'
        }`}
      >
        <p className="font-semibold text-sm mb-2 flex items-center gap-2">
          {coverageStatus.ready
            ? 'Mức phủ test case: 100% (sẵn sàng sử dụng)'
            : 'Mức phủ test case chưa đạt 100%'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 opacity-90">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${coverageStatus.hasEnoughCases ? 'bg-emerald-500' : 'bg-destructive'}`}
            />
            {coverageStatus.hasEnoughCases ? 'OK' : 'Thiếu'} tối thiểu{' '}
            {MIN_SELECT_TEST_CASES} test case
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${coverageStatus.hasBoundaryCase ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            {coverageStatus.hasBoundaryCase ? 'OK' : 'Nên có'} test case biên/ẩn
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${coverageStatus.weightOk ? 'bg-emerald-500' : 'bg-destructive'}`}
            />
            {coverageStatus.weightOk ? 'OK' : 'Thiếu'} baseline + testcase =
            1.00
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${coverageStatus.hasColumnsEveryCase ? 'bg-emerald-500' : 'bg-destructive'}`}
            />
            {coverageStatus.hasColumnsEveryCase ? 'OK' : 'Thiếu'} cột kết quả
            mọi case
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${coverageStatus.hasRowsEveryCase ? 'bg-emerald-500' : 'bg-destructive'}`}
            />
            {coverageStatus.hasRowsEveryCase ? 'OK' : 'Thiếu'} dữ liệu dòng mọi
            case
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          Cấu hình chấm điểm chung
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Tỉ trọng baseline
              </label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={rules.baseline_weight_ratio || 0}
                onChange={(e) => {
                  const next = Math.max(0, Math.min(1, Number(e.target.value)))
                  updateRules({ baseline_weight_ratio: next })
                  const remaining = Math.max(
                    0,
                    Math.round((1 - next) * 100) / 100
                  )
                  setTestCases(normalizeWeightRatios(testCases, remaining))
                }}
                className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Phạt khi sai thứ tự dòng
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={rules.wrong_order_penalty}
                onChange={(e) =>
                  updateRules({ wrong_order_penalty: Number(e.target.value) })
                }
                className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Trừ điểm khi sai thứ tự cột (điểm tuyệt đối mỗi test case)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={rules.wrong_column_order_penalty}
                onChange={(e) =>
                  updateRules({
                    wrong_column_order_penalty: Number(e.target.value)
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Phạt khi dư dòng
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={rules.extra_row_penalty}
                onChange={(e) =>
                  updateRules({ extra_row_penalty: Number(e.target.value) })
                }
                className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h4 className="text-base font-semibold text-foreground">
            Danh sách test case ({testCases.length})
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              setTestCases([...testCases, createDefaultCase(testCases.length)])
            }
          >
            <Plus className="h-4 w-4" />
            Thêm test case
          </Button>
        </div>

        {testCases.map((tc, idx) => (
          <div
            key={`${tc.case_id}-${idx}`}
            className="overflow-hidden rounded-lg border border-border shadow-sm transition-all bg-card"
          >
            {/* Header / Accordion trigger */}
            <div
              className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/60 transition-colors ${
                expandedCases[idx] !== false
                  ? 'bg-muted/30 border-b border-border'
                  : 'bg-transparent'
              }`}
              onClick={() => toggleCase(idx)}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sub-primary/10 text-sm font-bold text-sub-primary">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {tc.case_name || `Test case ${idx + 1}`}
                </span>
                <span className="text-xs text-muted-foreground ml-2 px-2.5 py-0.5 rounded-full bg-sub-background border border-border">
                  Tỉ trọng: {tc.weight_ratio}
                </span>
                {tc.is_hidden && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    Ẩn
                  </span>
                )}
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
              <div className="p-5 space-y-6 bg-card/60">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">
                      Mã test case (VD: TC_01)
                    </label>
                    <input
                      value={tc.case_id}
                      onChange={(e) => {
                        const next = [...testCases]
                        next[idx] = { ...tc, case_id: e.target.value }
                        setTestCases(next)
                      }}
                      placeholder="Mã test case"
                      className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground block">
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
                      className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">
                      Tỉ trọng
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={tc.weight_ratio}
                      onChange={(e) => {
                        const next = [...testCases]
                        next[idx] = {
                          ...tc,
                          weight_ratio: Number(e.target.value)
                        }
                        setTestCases(next)
                      }}
                      placeholder="Tỉ trọng"
                      className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">
                      Câu phụ thuộc
                    </label>
                    <select
                      value={tc.setup_dependency_id || ''}
                      onChange={(e) => {
                        const next = [...testCases]
                        next[idx] = {
                          ...tc,
                          setup_dependency_id: e.target.value
                        }
                        setTestCases(next)
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Không dùng câu phụ thuộc</option>
                      {dependencyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center mt-6">
                    <label className="flex items-center gap-2 text-sm cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={tc.is_hidden}
                        onChange={(e) => {
                          const next = [...testCases]
                          next[idx] = { ...tc, is_hidden: e.target.checked }
                          setTestCases(next)
                        }}
                        className="w-4 h-4 rounded border-input bg-sub-background text-sub-primary focus:ring-1 focus:ring-ring focus:outline-none"
                      />
                      <span className="group-hover:text-sub-primary transition-colors">
                        Test case ẩn
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-sub-primary" />
                    Script setup test case (AI tạo, giáo viên có thể sửa)
                  </label>
                  <div className="h-[180px] overflow-hidden rounded-md border border-border bg-sub-background shadow-sm">
                    <TeacherSqlEditor
                      value={tc.setup_custom_script || ''}
                      onChange={(value) => {
                        const next = [...testCases]
                        next[idx] = { ...tc, setup_custom_script: value || '' }
                        setTestCases(next)
                      }}
                      height="100%"
                    />
                  </div>
                  <p className="text-[11.5px] text-muted-foreground mt-2 inline-block">
                    * Lưu ý: không viết CREATE/DROP/ALTER. Chỉ dùng
                    DELETE/TRUNCATE/INSERT/UPDATE để setup dữ liệu test, và nhớ
                    insert bảng cha trước khi insert bảng con.
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground border-l-2 border-sub-primary pl-2">
                        Cấu hình cột kết quả
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={isGenerating}
                        className="h-7 text-xs bg-muted/60 hover:bg-muted font-medium text-emerald-600 dark:text-emerald-400 gap-1.5"
                        onClick={async () => {
                          if (!correctQuery?.trim()) {
                            toast.error(
                              'Vui lòng nhập script đáp án đúng trước'
                            )
                            return
                          }
                          try {
                            const res = await executeSelectTestCaseConfig(
                              examId,
                              {
                                setupDependencyId: tc.setup_dependency_id,
                                setupCustomScript: tc.setup_custom_script,
                                correctQuery: correctQuery.trim()
                              }
                            )
                            if (res.data) {
                              const next = [...testCases]
                              next[idx] = {
                                ...tc,
                                expected_result: {
                                  ...tc.expected_result,
                                  columns_config: res.data.columns_config || [],
                                  rows: res.data.rows || [],
                                  expected_row_count: (res.data.rows || [])
                                    .length
                                }
                              }
                              setTestCases(next)
                              toast.success(
                                'Đã tự động lấy cột và dữ liệu thành công'
                              )
                            }
                          } catch (e) {
                            console.error(e)
                            toast.error('Lỗi khi tự động lấy dữ liệu')
                          }
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Tự động sinh dữ liệu kết quả
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs shadow-sm bg-sub-background hover:bg-muted"
                      onClick={() => {
                        const next = [...testCases]
                        const newColumns: SelectExpectedColumnConfig[] = [
                          ...tc.expected_result.columns_config,
                          {
                            column_name: `cot_${tc.expected_result.columns_config.length + 1}`,
                            data_type: 'NVARCHAR'
                          }
                        ]
                        const newRows = tc.expected_result.rows.map((row) => [
                          ...row,
                          ''
                        ])
                        next[idx] = {
                          ...tc,
                          expected_result: {
                            ...tc.expected_result,
                            columns_config: newColumns,
                            rows: newRows
                          }
                        }
                        setTestCases(next)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm cột
                    </Button>
                  </div>

                  {tc.expected_result.columns_config.length === 0 && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 py-2 px-3 rounded-md border border-amber-500/20">
                      Cần có ít nhất 1 cột kết quả cho kịch bản này.
                    </div>
                  )}

                  {tc.expected_result.columns_config.map((col, colIdx) => (
                    <div
                      key={`${tc.case_id}-col-${colIdx}`}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center group relative p-1"
                    >
                      <div className="md:col-span-6 space-y-1">
                        {colIdx === 0 && (
                          <label className="text-xs text-muted-foreground ml-1">
                            Tên cột
                          </label>
                        )}
                        <input
                          value={col.column_name}
                          onChange={(e) => {
                            const next = [...testCases]
                            const cols = [...tc.expected_result.columns_config]
                            cols[colIdx] = {
                              ...cols[colIdx],
                              column_name: e.target.value
                            }
                            next[idx] = {
                              ...tc,
                              expected_result: {
                                ...tc.expected_result,
                                columns_config: cols
                              }
                            }
                            setTestCases(next)
                          }}
                          placeholder="Tên cột"
                          className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="md:col-span-5 space-y-1">
                        {colIdx === 0 && (
                          <label className="text-xs text-muted-foreground ml-1">
                            Kiểu dữ liệu
                          </label>
                        )}
                        <input
                          value={col.data_type}
                          onChange={(e) => {
                            const next = [...testCases]
                            const cols = [...tc.expected_result.columns_config]
                            cols[colIdx] = {
                              ...cols[colIdx],
                              data_type: e.target.value
                            }
                            next[idx] = {
                              ...tc,
                              expected_result: {
                                ...tc.expected_result,
                                columns_config: cols
                              }
                            }
                            setTestCases(next)
                          }}
                          placeholder="Kiểu dữ liệu"
                          className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div
                        className={`md:col-span-1 flex justify-end ${colIdx === 0 ? 'mt-5' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...testCases]
                            const cols =
                              tc.expected_result.columns_config.filter(
                                (_, i) => i !== colIdx
                              )
                            const rows = tc.expected_result.rows.map((row) =>
                              row.filter((_, i) => i !== colIdx)
                            )
                            next[idx] = {
                              ...tc,
                              expected_result: {
                                ...tc.expected_result,
                                columns_config: cols,
                                rows
                              }
                            }
                            setTestCases(next)
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                          title="Xóa cột"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground border-l-2 border-sub-primary pl-2">
                      Dữ liệu kết quả mong đợi
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs shadow-sm bg-sub-background hover:bg-muted"
                      onClick={() => {
                        const next = [...testCases]
                        const colsLen = tc.expected_result.columns_config.length
                        const emptyRow = Array.from(
                          { length: colsLen },
                          () => ''
                        )
                        next[idx] = {
                          ...tc,
                          expected_result: {
                            ...tc.expected_result,
                            rows: [...tc.expected_result.rows, emptyRow],
                            expected_row_count:
                              tc.expected_result.rows.length + 1
                          }
                        }
                        setTestCases(next)
                      }}
                      disabled={tc.expected_result.columns_config.length === 0}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm dòng
                    </Button>
                  </div>

                  <div className="space-y-1.5 w-full md:w-1/3">
                    <label className="text-xs font-medium text-muted-foreground block">
                      Số dòng kỳ vọng
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={tc.expected_result.expected_row_count}
                      onChange={(e) => {
                        const next = [...testCases]
                        next[idx] = {
                          ...tc,
                          expected_result: {
                            ...tc.expected_result,
                            expected_row_count: Number(e.target.value)
                          }
                        }
                        setTestCases(next)
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-sub-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  {tc.expected_result.rows.length > 0 &&
                    tc.expected_result.columns_config.length > 0 && (
                      <div className="overflow-x-auto rounded-md border border-border shadow-sm bg-sub-background">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40 border-b border-border">
                            <tr>
                              <th className="px-4 py-2 font-medium text-muted-foreground w-12 text-center">
                                #
                              </th>
                              {tc.expected_result.columns_config.map(
                                (col, colIdx) => (
                                  <th
                                    key={`${tc.case_id}-head-${colIdx}`}
                                    className="px-4 py-2 font-medium text-foreground text-left"
                                  >
                                    {col.column_name || `Cột ${colIdx + 1}`}
                                  </th>
                                )
                              )}
                              <th className="px-3 py-2 w-12" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {tc.expected_result.rows.map((row, rowIdx) => (
                              <tr
                                key={`${tc.case_id}-row-${rowIdx}`}
                                className="hover:bg-muted/30 transition-colors group"
                              >
                                <td className="px-4 py-2 text-center text-muted-foreground font-medium text-xs">
                                  {rowIdx + 1}
                                </td>
                                {tc.expected_result.columns_config.map(
                                  (_, colIdx) => (
                                    <td
                                      key={`${tc.case_id}-cell-${rowIdx}-${colIdx}`}
                                      className="px-4 py-1"
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
                                            tc.expected_result.rows.map((r) => [
                                              ...r
                                            ])
                                          rows[rowIdx][colIdx] = e.target.value
                                          next[idx] = {
                                            ...tc,
                                            expected_result: {
                                              ...tc.expected_result,
                                              rows
                                            }
                                          }
                                          setTestCases(next)
                                        }}
                                        className="flex h-8 w-full rounded border border-transparent bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none hover:bg-muted/50 focus:bg-sub-background focus:border-input focus:shadow-sm"
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
                                          rows,
                                          expected_row_count: rows.length
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
    </div>
  )
}


