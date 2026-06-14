'use client'

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Trash2,
  X
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  generateGradingRubric,
  executeSelectTestCaseConfig
} from '@/lib/actions'
import {
  GradingRubric,
  InsertDataGradingRule,
  SelectQueryGradingPayload,
  SelectTestCase,
  WhiteboxRule,
  WhiteboxSettings
} from '@/lib/types'
import { GradingRulesEditor } from './grading-rules-editor'
import { WhiteboxRulesEditor } from './whitebox-rules-editor'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { TestCaseTabs } from './test-case-tabs'

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
      columns_config: [{ column_name: 'col1' }],
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
  // Result-set rules only. Legacy white-box rules (target === 'QUERY') are dropped here — the clean
  // cut moved white-box config to grading_payload.whitebox_rules; there is no bridge.
  const gradingRules = Array.isArray(payload.grading_rules)
    ? (payload.grading_rules as InsertDataGradingRule[]).filter(
        (rule) => rule.target !== 'QUERY'
      )
    : []
  const whiteboxRules = Array.isArray(payload.whitebox_rules)
    ? payload.whitebox_rules
    : []
  const whiteboxSettings = payload.whitebox_settings ?? {}
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
      whitebox_rules: whiteboxRules,
      whitebox_settings: whiteboxSettings,
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
  // grading_rules is result-set only after normalize; white-box lives in its own canonical keys.
  const resultRules = Array.isArray(payload.grading_rules)
    ? payload.grading_rules
    : []
  const whiteboxRules = Array.isArray(payload.whitebox_rules)
    ? payload.whitebox_rules
    : []
  const whiteboxSettings = payload.whitebox_settings ?? {}
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
        test_cases: cases
      }
    }))
  }

  const setWhitebox = (
    nextRules: WhiteboxRule[],
    nextSettings: WhiteboxSettings
  ) => {
    updateRubric((r) => ({
      ...r,
      grading_payload: {
        ...(r.grading_payload as SelectQueryGradingPayload),
        whitebox_rules: nextRules,
        whitebox_settings: nextSettings
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
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0)
  const [runningCases, setRunningCases] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (testCases.length === 0) {
      if (activeTestCaseIndex !== 0) setActiveTestCaseIndex(0)
      return
    }

    if (activeTestCaseIndex >= testCases.length) {
      setActiveTestCaseIndex(testCases.length - 1)
    }
  }, [activeTestCaseIndex, testCases.length])

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
      setActiveTestCaseIndex(0)

      const generatedCases =
        (normalized.grading_payload as SelectQueryGradingPayload).test_cases ||
        []
      if (generatedCases.length < MIN_SELECT_TEST_CASES) {
        toast.warning(
          `AI đã tạo rubric nhưng chưa đạt đủ ${MIN_SELECT_TEST_CASES} test case. Đã bổ sung case mặc định, vui lòng rà soát lại.`
        )
      }
    } catch {
      toast.error('Lỗi khi tạo rubric SELECT bằng AI')
    } finally {
      setIsGenerating(false)
    }
  }

  const isWizardMode = typeof wizardStep === 'number'

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

      {/* Step 3 (create wizard) = Black-box. In edit mode (no wizardStep) both zones stack. */}
      {(!isWizardMode || wizardStep === 3) && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 dark:border-sky-900/40 dark:bg-sky-950/10">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">
              Chấm theo kết quả (Black-box)
            </span>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            So sánh <strong>kết quả trả về</strong> của câu truy vấn với đáp án
            mẫu (cột, dòng, thứ tự). Không quan tâm cách viết câu lệnh.
          </p>
          <GradingRulesEditor
            questionType="SELECT_QUERY"
            totalPoints={totalPoints}
            rules={resultRules}
            onChange={(nextResultRules) => setGradingRules(nextResultRules)}
            correctQuery={correctQuery}
            questionContent={questionContent}
            contextSummary={testCaseContextSummary}
          />
        </div>
      )}

      {/* Step 4 (create wizard) = White-box. */}
      {(!isWizardMode || wizardStep === 4) && (
        <WhiteboxRulesEditor
          questionType="SELECT_QUERY"
          totalPoints={totalPoints}
          rules={whiteboxRules}
          settings={whiteboxSettings}
          onChange={setWhitebox}
          sqlForPreview={correctQuery}
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
              onClick={() => {
                setTestCases([
                  ...testCases,
                  createDefaultCase(testCases.length)
                ])
                setActiveTestCaseIndex(testCases.length)
              }}
            >
              <Plus className="h-4 w-4" />
              Thêm test case
            </Button>
          </div>

          {testCases.length > 0 && (
            <TestCaseTabs
              count={testCases.length}
              activeIndex={activeTestCaseIndex}
              onChange={(index) => {
                setActiveTestCaseIndex(index)
                setExpandedCases((prev) => ({ ...prev, [index]: true }))
              }}
              getKey={(index) =>
                `${testCases[index]?.case_id || 'tc'}-${index}`
              }
              getTitle={(index) =>
                testCases[index]?.case_name || `Test case ${index + 1}`
              }
            />
          )}

          {testCases.map((tc, idx) =>
            idx === activeTestCaseIndex ? (
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

                    <div className="space-y-4 pt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-on-surface border-l-4 border-primary pl-3">
                          Dữ liệu kết quả mong đợi
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-xs shadow-sm bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                            onClick={async () => {
                              if (!correctQuery?.trim()) {
                                toast.error(
                                  'Vui lòng nhập SQL đáp án trước khi chạy test case'
                                )
                                return
                              }
                              setRunningCases((prev) => ({
                                ...prev,
                                [idx]: true
                              }))
                              try {
                                const result =
                                  await executeSelectTestCaseConfig(examId, {
                                    setupCustomScript:
                                      tc.setup_custom_script || '',
                                    correctQuery: correctQuery.trim()
                                  })
                                if (!result.data) {
                                  toast.error(
                                    result.message || 'Không thể chạy test case'
                                  )
                                  return
                                }
                                const {
                                  columns_config: cols,
                                  rows: resultRows
                                } = result.data
                                const next = [...testCases]
                                next[idx] = {
                                  ...tc,
                                  expected_result: {
                                    columns_config: cols.map((c) => ({
                                      column_name: c.column_name
                                    })),
                                    rows: resultRows
                                  }
                                }
                                setTestCases(next)
                                toast.success(
                                  `Đã cập nhật kết quả mong đợi: ${cols.length} cột, ${resultRows.length} dòng`
                                )
                              } catch {
                                toast.error(
                                  'Lỗi khi chạy test case. Vui lòng kiểm tra script setup và đáp án.'
                                )
                              } finally {
                                setRunningCases((prev) => ({
                                  ...prev,
                                  [idx]: false
                                }))
                              }
                            }}
                            disabled={runningCases[idx]}
                          >
                            {runningCases[idx] ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Đang chạy...
                              </>
                            ) : (
                              <>
                                <Play className="h-3.5 w-3.5" />
                                Chạy test case
                              </>
                            )}
                          </Button>
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
                                        className="px-2 py-2 text-left group/col-header"
                                      >
                                        <div className="flex items-center gap-1">
                                          <input
                                            value={col.column_name || ''}
                                            onChange={(e) => {
                                              const next = [...testCases]
                                              const cols = [
                                                ...tc.expected_result
                                                  .columns_config
                                              ]
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
                                            placeholder={`Cột ${colIdx + 1}`}
                                            className="w-full min-w-[80px] bg-transparent px-2 py-1 text-sm font-semibold text-on-surface border border-transparent rounded-md hover:border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const next = [...testCases]
                                              const cols =
                                                tc.expected_result.columns_config.filter(
                                                  (_, ci) => ci !== colIdx
                                                )
                                              const rows =
                                                tc.expected_result.rows.map(
                                                  (row) =>
                                                    row.filter(
                                                      (_, ci) => ci !== colIdx
                                                    )
                                                )
                                              next[idx] = {
                                                ...tc,
                                                expected_result: {
                                                  columns_config: cols,
                                                  rows
                                                }
                                              }
                                              setTestCases(next)
                                            }}
                                            className="shrink-0 opacity-0 group-hover/col-header:opacity-100 inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                            title="Xóa cột"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </th>
                                    )
                                  )}
                                  <th className="px-2 py-2 w-14">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...testCases]
                                        const newColName = `col${tc.expected_result.columns_config.length + 1}`
                                        next[idx] = {
                                          ...tc,
                                          expected_result: {
                                            columns_config: [
                                              ...tc.expected_result
                                                .columns_config,
                                              { column_name: newColName }
                                            ],
                                            rows: tc.expected_result.rows.map(
                                              (row) => [...row, '']
                                            )
                                          }
                                        }
                                        setTestCases(next)
                                      }}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-outline-variant/40 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
                                      title="Thêm cột"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </th>
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
                                    <td />
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
            ) : null
          )}
        </div>
      )}

    </div>
  )
}
