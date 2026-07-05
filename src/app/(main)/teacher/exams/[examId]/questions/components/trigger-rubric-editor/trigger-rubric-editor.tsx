'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Zap,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateGradingRubric } from '@/lib/actions'
import styles from '@/app/(main)/teacher/exams/[examId]/questions/components/trigger-rubric-editor/trigger-rubric-editor.module.scss'
import {
  GradingRubric,
  TriggerGradingSettings,
  TriggerTestCase,
  SyntaxErrorAction,
  VerificationType,
  WhiteboxRule,
  WhiteboxSettings
} from '@/lib/types'
import { TeacherSqlEditor } from '@/app/(main)/teacher/exams/[examId]/questions/components/teacher-sql-editor'
import { AiRubricRefinementPanel } from '@/app/(main)/teacher/exams/[examId]/questions/components/ai-rubric-refinement-panel'
import { WhiteboxRulesEditor } from '@/app/(main)/teacher/exams/[examId]/questions/components/whitebox-rules-editor'

function createDefaultTestCase(index: number = 0): TriggerTestCase {
  const paddedIdx = String(index + 1).padStart(2, '0')
  return {
    case_id: `TC_${paddedIdx}`,
    case_name: `Test case ${index + 1}`,
    score_weight: 1,
    setup_script: '-- Setup dữ liệu trước khi kích hoạt trigger\n',
    invocation_query:
      '-- Câu lệnh kích hoạt trigger (INSERT / UPDATE / DELETE)\n',
    validation_query: '-- Câu lệnh kiểm tra kết quả sau khi trigger chạy\n',
    verification_type: 'SIDE_EFFECT'
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

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function triggerTestCaseWeight(
  testCase: Pick<TriggerTestCase, 'score_weight' | 'penalty_value'>
): number {
  return testCase.score_weight ?? testCase.penalty_value ?? 1
}

function normalizeTriggerPayload(
  payload: GradingRubric['grading_payload'] | undefined
): {
  grading_settings: TriggerGradingSettings
  test_cases: TriggerTestCase[]
  whitebox_rules: WhiteboxRule[]
  whitebox_settings: WhiteboxSettings
} {
  const defaultSettings: TriggerGradingSettings = {
    syntax_error_action: 'FAIL_ALL',
    case_sensitive_names: false,
    positive_only_scoring: false
  }

  if (!payload || typeof payload !== 'object') {
    return {
      grading_settings: defaultSettings,
      test_cases: [],
      whitebox_rules: [],
      whitebox_settings: {}
    }
  }

  const payloadRecord = payload as Record<string, unknown>
  const rawSettings =
    payloadRecord.grading_settings &&
    typeof payloadRecord.grading_settings === 'object'
      ? (payloadRecord.grading_settings as Record<string, unknown>)
      : {}

  const settings: TriggerGradingSettings = {
    syntax_error_action: toSyntaxErrorAction(rawSettings.syntax_error_action),
    case_sensitive_names: toBoolean(rawSettings.case_sensitive_names, false),
    positive_only_scoring: toBoolean(rawSettings.positive_only_scoring, false)
  }

  // Normalize test_cases
  const normalizedTestCases: TriggerTestCase[] = []
  if (Array.isArray(payloadRecord.test_cases)) {
    for (const tc of payloadRecord.test_cases) {
      if (tc && typeof tc === 'object') {
        const testCase = tc as Record<string, unknown>

        const invocationQuery = String(testCase.invocation_query || '')
        const validationQuery = String(testCase.validation_query || '')
        const scoreWeight =
          toOptionalNumber(testCase.score_weight) ??
          toOptionalNumber(testCase.penalty_value) ??
          1

        normalizedTestCases.push({
          case_id: String(testCase.case_id || crypto.randomUUID()),
          case_name: String(testCase.case_name || ''),
          score_weight: scoreWeight,
          verification_type: String(
            testCase.verification_type || 'SIDE_EFFECT'
          ) as VerificationType,
          setup_script: String(testCase.setup_script || ''),
          invocation_query: invocationQuery,
          validation_query: validationQuery,
          description: testCase.description
            ? String(testCase.description)
            : undefined
        })
      }
    }
  }

  return {
    grading_settings: settings,
    test_cases: normalizedTestCases,
    whitebox_rules: Array.isArray(payloadRecord.whitebox_rules)
      ? (payloadRecord.whitebox_rules as WhiteboxRule[])
      : [],
    whitebox_settings:
      payloadRecord.whitebox_settings &&
      typeof payloadRecord.whitebox_settings === 'object'
        ? (payloadRecord.whitebox_settings as WhiteboxSettings)
        : {}
  }
}

interface TriggerRubricEditorProps {
  totalPoints: number
  rubric: GradingRubric | null
  onChange: (rubric: GradingRubric) => void
  correctQuery?: string
  questionContent?: string
  schemaContext?: string
  wizardStep?: number
}

export function TriggerRubricEditor({
  totalPoints,
  rubric,
  onChange,
  correctQuery,
  questionContent,
  schemaContext,
  wizardStep
}: TriggerRubricEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0)

  const { grading_settings, test_cases, whitebox_rules, whitebox_settings } =
    useMemo(() => normalizeTriggerPayload(rubric?.grading_payload), [rubric])

  const syncRubric = useCallback(
    (
      nextSettings: TriggerGradingSettings,
      nextTestCases: TriggerTestCase[] = test_cases,
      nextWhiteboxRules: WhiteboxRule[] = whitebox_rules,
      nextWhiteboxSettings: WhiteboxSettings = whitebox_settings
    ) => {
      onChange({
        total_points: totalPoints,
        question_category: rubric?.question_category || 'TRIGGER',
        grading_payload: {
          grading_settings: nextSettings,
          test_cases: nextTestCases,
          whitebox_rules: nextWhiteboxRules,
          whitebox_settings: nextWhiteboxSettings
        }
      })
    },
    [
      onChange,
      totalPoints,
      rubric?.question_category,
      test_cases,
      whitebox_rules,
      whitebox_settings
    ]
  )

  const setSettings = useCallback(
    (updater: (prev: TriggerGradingSettings) => TriggerGradingSettings) => {
      const next = updater(grading_settings)
      syncRubric(next, test_cases, whitebox_rules, whitebox_settings)
    },
    [
      grading_settings,
      test_cases,
      whitebox_rules,
      whitebox_settings,
      syncRubric
    ]
  )

  const setTestCases = useCallback(
    (updater: (prev: TriggerTestCase[]) => TriggerTestCase[]) => {
      const next = updater(test_cases)
      syncRubric(grading_settings, next, whitebox_rules, whitebox_settings)
    },
    [
      grading_settings,
      test_cases,
      whitebox_rules,
      whitebox_settings,
      syncRubric
    ]
  )

  const setWhitebox = useCallback(
    (nextRules: WhiteboxRule[], nextSettings: WhiteboxSettings) => {
      syncRubric(grading_settings, test_cases, nextRules, nextSettings)
    },
    [grading_settings, test_cases, syncRubric]
  )

  const handleAddTestCase = useCallback(() => {
    setTestCases((prev) => [...prev, createDefaultTestCase(prev.length)])
    setActiveTestCaseIndex(test_cases.length)
  }, [setTestCases, test_cases.length])

  const handleRemoveTestCase = useCallback(
    (idx: number) => {
      setTestCases((prev) => prev.filter((_, i) => i !== idx))
      setActiveTestCaseIndex((prev) =>
        Math.max(0, Math.min(prev, test_cases.length - 2))
      )
    },
    [setTestCases, test_cases.length]
  )

  const handleGenerateRubric = useCallback(async () => {
    if (!correctQuery || correctQuery.trim().length === 0) {
      toast.error(
        'Vui lòng nhập đáp án chuẩn (Correct Query) trước khi tạo rubric AI'
      )
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateGradingRubric({
        correctQuery,
        questionContent: questionContent || '',
        totalPoints,
        questionType: 'TRIGGER',
        schemaContext: schemaContext || ''
      })

      if (result.data) {
        const parsedRubric: GradingRubric =
          typeof result.data === 'string'
            ? JSON.parse(result.data)
            : result.data

        // Normalize the parsed rubric to ensure all fields are properly set
        const normalized = normalizeTriggerPayload(parsedRubric.grading_payload)
        const normalizedRubric: GradingRubric = {
          ...parsedRubric,
          grading_payload: {
            grading_settings: normalized.grading_settings,
            test_cases: normalized.test_cases,
            whitebox_rules: normalized.whitebox_rules,
            whitebox_settings: normalized.whitebox_settings
          }
        }

        onChange(normalizedRubric)
        setActiveTestCaseIndex(0)
        toast.success('Đã tạo rubric bằng AI thành công!')
      } else {
        toast.error(result.message || 'Tạo rubric thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo rubric')
    } finally {
      setIsGenerating(false)
    }
  }, [correctQuery, questionContent, schemaContext, totalPoints, onChange])

  const currentRubricForAi = useMemo<GradingRubric>(
    () => ({
      total_points: totalPoints,
      question_category: rubric?.question_category || 'TRIGGER',
      grading_payload: {
        grading_settings,
        test_cases,
        whitebox_rules,
        whitebox_settings
      }
    }),
    [
      grading_settings,
      rubric?.question_category,
      test_cases,
      totalPoints,
      whitebox_rules,
      whitebox_settings
    ]
  )

  const handleApplyAiRefinement = useCallback(
    (nextRubric: GradingRubric) => {
      const activeCaseId = test_cases[activeTestCaseIndex]?.case_id
      const normalized = normalizeTriggerPayload(nextRubric.grading_payload)
      const normalizedRubric: GradingRubric = {
        ...nextRubric,
        total_points: totalPoints,
        question_category: 'TRIGGER',
        grading_payload: {
          grading_settings: normalized.grading_settings,
          test_cases: normalized.test_cases,
          whitebox_rules:
            normalized.whitebox_rules.length > 0
              ? normalized.whitebox_rules
              : whitebox_rules,
          whitebox_settings:
            Object.keys(normalized.whitebox_settings).length > 0
              ? normalized.whitebox_settings
              : whitebox_settings
        }
      }
      const nextActiveIndex = activeCaseId
        ? normalized.test_cases.findIndex((tc) => tc.case_id === activeCaseId)
        : -1

      onChange(normalizedRubric)
      setActiveTestCaseIndex(nextActiveIndex >= 0 ? nextActiveIndex : 0)
    },
    [
      activeTestCaseIndex,
      onChange,
      test_cases,
      totalPoints,
      whitebox_rules,
      whitebox_settings
    ]
  )

  const isWizardMode = typeof wizardStep === 'number'
  const isTestCasesStep = !isWizardMode || wizardStep === 2
  const isRulesStep = !isWizardMode || wizardStep === 3
  // White-box step (step 3 in the 4-step trigger wizard, or always in edit mode)
  const isWhiteboxStep = !isWizardMode || wizardStep === 3

  useEffect(() => {
    if (test_cases.length === 0) {
      setActiveTestCaseIndex(0)
      return
    }
    if (activeTestCaseIndex > test_cases.length - 1) {
      setActiveTestCaseIndex(test_cases.length - 1)
    }
  }, [activeTestCaseIndex, test_cases.length])

  useEffect(() => {
    if (!isWizardMode || wizardStep !== 2) return
    if (test_cases.length > 0) return

    setTestCases(() => [createDefaultTestCase(0)])
    setActiveTestCaseIndex(0)
  }, [isWizardMode, wizardStep, test_cases.length, setTestCases])

  return (
    <div className={styles.editor}>
      {isRulesStep && (
        <div className={styles.settingsCard}>
          <div className={styles.settingsHeader}>
            <Settings2 className={styles.settingsIcon} />
            <span className={styles.settingsTitle}>Cài đặt chấm điểm</span>
          </div>
          <div className={styles.settingsControls}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={grading_settings.positive_only_scoring ?? false}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    positive_only_scoring: e.target.checked
                  }))
                }
                className={styles.checkboxInput}
              />
              <span className={styles.labelText}>Chỉ cộng điểm, không trừ</span>
              <span
                className="text-xs text-muted-foreground"
                title="Khi BẬT: Chỉ cộng điểm cho tiêu chí đúng, không trừ điểm. Khi TẮT: Trừ điểm cho mỗi test case fail và mỗi vi phạm quy tắc white-box."
              >
                i
              </span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={grading_settings.case_sensitive_names ?? false}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    case_sensitive_names: e.target.checked
                  }))
                }
                className={styles.checkboxInput}
              />
              <span className={styles.labelText}>Phân biệt hoa/thường</span>
              <span
                className=" text-xs text-muted-foreground"
                title="Khi BẬT: Tên trigger phải khớp chính xác (VD: 'TRG_Test' != 'trg_test'). Khi TẮT: Không phân biệt hoa thường (VD: 'TRG_Test' = 'trg_test')."
              >
                i
              </span>
            </label>
            {/* 
            <div className={styles.syntaxGroup}>
              <span className={styles.mutedText}>Khi lỗi cú pháp:</span>
              <select
                value={grading_settings.syntax_error_action ?? 'FAIL_ALL'}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    syntax_error_action: e.target.value as SyntaxErrorAction
                  }))
                }
                className={styles.syntaxSelect}
                title="FAIL_ALL: Nếu SQL có lỗi cú pháp -> 0 điểm toàn bộ. PARTIAL: Nếu SQL có lỗi cú pháp -> vẫn chấm các phần đúng được (hiện tại chưa implement)."
              >
                <option value="FAIL_ALL">0 điểm toàn bộ</option>
                <option value="PARTIAL">Chấm từng phần (chưa hỗ trợ)</option>
              </select>
              <span
                className="ml-2 text-xs text-muted-foreground"
                title="FAIL_ALL: Nếu SQL có lỗi cú pháp -> 0 điểm toàn bộ. PARTIAL: Nếu SQL có lỗi cú pháp -> vẫn chấm các phần đúng được (hiện tại chưa implement)."
              >
                i
              </span>
            </div> */}
          </div>
        </div>
      )}

      {/* Step 2: Test Cases */}
      {isTestCasesStep && (
        <div className={styles.testCasesSection}>
          <div className="rounded-md border border-dashed border-outline-variant/50 bg-surface-container-highest/20 px-4 py-3 text-sm text-on-surface-variant">
            Mỗi test case có <strong>trọng số tương đối</strong>. Hệ thống sẽ
            chuẩn hóa tổng trọng số về 1.0 rồi nhân với điểm của câu hỏi. Quy
            tắc white-box (nếu có) trừ thêm trên phần điểm đạt được sau test
            case.
          </div>

          <div className="flex flex-wrap items-center gap-3 pb-2">
            <Button
              type="button"
              onClick={handleGenerateRubric}
              disabled={isGenerating || !correctQuery?.trim()}
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
                  AI tạo test case
                </>
              )}
            </Button>
          </div>

          <AiRubricRefinementPanel
            questionType="TRIGGER"
            totalPoints={totalPoints}
            currentRubric={currentRubricForAi}
            onApply={handleApplyAiRefinement}
            correctQuery={correctQuery}
            questionContent={questionContent}
            schemaContext={schemaContext}
            activeTargetId={test_cases[activeTestCaseIndex]?.case_id}
            activeTargetLabel={
              test_cases[activeTestCaseIndex]?.case_name ||
              test_cases[activeTestCaseIndex]?.case_id
            }
            disabled={isGenerating}
          />

          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              Danh sách test case
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs"
              >
                {test_cases.length}
              </Badge>
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAddTestCase}>
                <Plus className={styles.iconSm} />
                Thêm test case
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleGenerateRubric}
                disabled={isGenerating}
                className="hidden"
              >
                {isGenerating ? (
                  <Loader2 className={`${styles.iconSm} ${styles.spin}`} />
                ) : (
                  <Sparkles className={styles.iconSm} />
                )}
                Tạo bằng AI
              </Button>
            </div>
          </div>
          {test_cases.length === 0 && (
            <div className={styles.emptyState}>
              <Zap className={styles.emptyIcon} />
              <h4 className={styles.emptyTitle}>Chưa có test case</h4>
              <p className={styles.emptyDescription}>
                Thêm test case để kiểm tra trigger
              </p>
            </div>
          )}

          {test_cases.length > 0 && (
            <>
              {/* Test case tabs */}
              <div className={styles.testCaseTabs}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActiveTestCaseIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={activeTestCaseIndex === 0}
                >
                  <ChevronLeft className={styles.iconSm} />
                </Button>
                <div className={styles.tabsContainer}>
                  {test_cases.map((tc, idx) => (
                    <Button
                      key={tc.case_id}
                      type="button"
                      variant={
                        idx === activeTestCaseIndex ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setActiveTestCaseIndex(idx)}
                      className={styles.testCaseTab}
                    >
                      TC{idx + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActiveTestCaseIndex((prev) =>
                      Math.min(test_cases.length - 1, prev + 1)
                    )
                  }
                  disabled={activeTestCaseIndex === test_cases.length - 1}
                >
                  <ChevronRight className={styles.iconSm} />
                </Button>
              </div>

              {/* Active test case */}
              {test_cases.map((tc, idx) =>
                idx === activeTestCaseIndex ? (
                  <div key={tc.case_id} className={styles.testCaseCard}>
                    <div className={styles.testCaseHeader}>
                      <div className="flex min-w-0 flex-1 items-center gap-3.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container shadow-sm">
                          {idx + 1}
                        </span>
                        <span className="truncate text-sm font-semibold text-on-surface">
                          {tc.case_name || `Test case ${idx + 1}`}
                        </span>
                        <span className="text-[11px] ml-3 shrink-0 px-2.5 py-0.5 rounded-full bg-error-container/10 text-error border border-error/20 font-medium">
                          Trọng số: {triggerTestCaseWeight(tc)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTestCase(idx)}
                        title="Xóa test case"
                      >
                        <Trash2 className={styles.iconSm} />
                      </Button>
                    </div>
                    <div className={styles.testCaseFields}>
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                        <label className="space-y-1.5">
                          <span className="block text-xs font-semibold text-on-surface-variant">
                            Mã test case
                          </span>
                          <input
                            type="text"
                            value={tc.case_id || ''}
                            onChange={(e) =>
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? { ...t, case_id: e.target.value }
                                    : t
                                )
                              )
                            }
                            className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="block text-xs font-semibold text-on-surface-variant">
                            Tên kịch bản
                          </span>
                          <input
                            type="text"
                            value={tc.case_name || ''}
                            onChange={(e) =>
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? { ...t, case_name: e.target.value }
                                    : t
                                )
                              )
                            }
                            className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="block text-xs font-semibold text-on-surface-variant">
                            Trọng số
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={0.05}
                            value={triggerTestCaseWeight(tc)}
                            onChange={(e) =>
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? {
                                        ...t,
                                        score_weight:
                                          parseFloat(e.target.value) || 0
                                      }
                                    : t
                                )
                              )
                            }
                            className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="block text-xs font-semibold text-on-surface-variant">
                            Kiểu kiểm tra
                          </span>
                          <select
                            value={tc.verification_type || 'SIDE_EFFECT'}
                            onChange={(e) => {
                              const nextType = e.target
                                .value as VerificationType
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? {
                                        ...t,
                                        verification_type: nextType,
                                        ...(nextType === 'EXECUTION_STATUS'
                                          ? { validation_query: '' }
                                          : {})
                                      }
                                    : t
                                )
                              )
                            }}
                            className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                          >
                            <option value="SIDE_EFFECT">SIDE_EFFECT</option>
                            <option value="EXECUTION_STATUS">
                              EXECUTION_STATUS
                            </option>
                            <option value="PRINT_OUTPUT">PRINT_OUTPUT</option>
                          </select>
                        </label>
                      </div>
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-semibold text-primary flex items-center gap-2 mb-2">
                          <Sparkles className="h-3.5 w-3.5" />
                          Setup script
                        </label>
                        <div className="h-[180px] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container shadow-inner">
                          <TeacherSqlEditor
                            value={tc.setup_script || ''}
                            onChange={(value) =>
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? { ...t, setup_script: value || '' }
                                    : t
                                )
                              )
                            }
                            height="100%"
                            showExpandButton={true}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-semibold text-primary flex items-center gap-2 mb-2">
                          <Sparkles className="h-3.5 w-3.5" />
                          Triggering query
                        </label>
                        <div className="h-[220px] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container shadow-inner">
                          <TeacherSqlEditor
                            value={tc.invocation_query || ''}
                            onChange={(value) =>
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? { ...t, invocation_query: value || '' }
                                    : t
                                )
                              )
                            }
                            height="100%"
                            showExpandButton={true}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-semibold text-primary flex items-center gap-2 mb-2">
                          <Sparkles className="h-3.5 w-3.5" />
                          Validation query
                        </label>
                        <div className="h-[220px] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container shadow-inner">
                          <TeacherSqlEditor
                            value={tc.validation_query || ''}
                            onChange={(value) =>
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? { ...t, validation_query: value || '' }
                                    : t
                                )
                              )
                            }
                            height="100%"
                            showExpandButton={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </>
          )}
        </div>
      )}

      {/* Step 4: White-box rules — chấm phương pháp */}
      {isWhiteboxStep && (
        <WhiteboxRulesEditor
          questionType="TRIGGER"
          totalPoints={totalPoints}
          rules={whitebox_rules}
          settings={whitebox_settings}
          onChange={setWhitebox}
          sqlForPreview={correctQuery}
        />
      )}
    </div>
  )
}
