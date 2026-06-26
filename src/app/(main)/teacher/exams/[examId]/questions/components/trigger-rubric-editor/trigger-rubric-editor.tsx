'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Zap,
  Settings2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Equal,
  Loader2,
  MousePointerClick
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateGradingRubric } from '@/lib/actions'
import styles from '@/app/(main)/teacher/exams/[examId]/questions/components/trigger-rubric-editor/trigger-rubric-editor.module.scss'
import {
  GradingRubric,
  TriggerGradingSettings,
  TriggerRubricTrigger,
  TriggerTestCase,
  SyntaxErrorAction,
  MissingPenaltyAction
} from '@/lib/types'
import { TeacherSqlEditor } from '@/app/(main)/teacher/exams/[examId]/questions/components/teacher-sql-editor'
import { AiRubricRefinementPanel } from '@/app/(main)/teacher/exams/[examId]/questions/components/ai-rubric-refinement-panel'

function createDefaultTrigger(): TriggerRubricTrigger {
  return {
    expected_name: '',
    existence_points: 0.3,
    table_points: 0.2,
    event_points: 0.3,
    timing_points: 0.2,
    expected_table_name: '',
    is_insert: false,
    is_update: true,
    is_delete: false,
    is_after: true,
    missing_penalty_action: 'SKIP_TRIGGER'
  }
}

function createDefaultTestCase(): TriggerTestCase {
  return {
    case_id: crypto.randomUUID(),
    case_name: '',
    penalty_value: 0.5,
    setup_script: '',
    invocation_query: '',
    validation_query: ''
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

function normalizeTriggerPayload(
  payload: GradingRubric['grading_payload'] | undefined
): {
  grading_settings: TriggerGradingSettings
  triggers: TriggerRubricTrigger[]
  test_cases: TriggerTestCase[]
} {
  const defaultSettings: TriggerGradingSettings = {
    syntax_error_action: 'FAIL_ALL',
    case_sensitive_names: false,
    positive_only_scoring: false
  }

  if (!payload || typeof payload !== 'object') {
    return {
      grading_settings: defaultSettings,
      triggers: [],
      test_cases: []
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

  // Normalize triggers
  const normalizedTriggers: TriggerRubricTrigger[] = []
  if (Array.isArray(payloadRecord.triggers)) {
    for (const t of payloadRecord.triggers) {
      if (t && typeof t === 'object') {
        const trigger = t as Record<string, unknown>
        normalizedTriggers.push({
          expected_name: String(trigger.expected_name || ''),
          existence_points: Number(trigger.existence_points || 0),
          table_points: Number(trigger.table_points || 0),
          event_points: Number(trigger.event_points || 0),
          timing_points: Number(trigger.timing_points || 0),
          expected_table_name: String(trigger.expected_table_name || ''),
          is_insert: toBoolean(trigger.is_insert, false),
          is_update: toBoolean(trigger.is_update, false),
          is_delete: toBoolean(trigger.is_delete, false),
          is_after: toBoolean(trigger.is_after, true),
          missing_penalty_action:
            trigger.missing_penalty_action === 'SKIP_TRIGGER' ||
            trigger.missing_penalty_action === 'ZERO_POINTS' ||
            trigger.missing_penalty_action === 'SKIP_TABLE' ||
            trigger.missing_penalty_action === 'SKIP_ROUTINE'
              ? (trigger.missing_penalty_action as MissingPenaltyAction)
              : 'SKIP_TRIGGER'
        })
      }
    }
  }

  // Normalize test_cases
  const normalizedTestCases: TriggerTestCase[] = []
  if (Array.isArray(payloadRecord.test_cases)) {
    for (const tc of payloadRecord.test_cases) {
      if (tc && typeof tc === 'object') {
        const testCase = tc as Record<string, unknown>

        const invocationQuery = String(testCase.invocation_query || '')
        const validationQuery = String(testCase.validation_query || '')

        normalizedTestCases.push({
          case_id: String(testCase.case_id || crypto.randomUUID()),
          case_name: String(testCase.case_name || ''),
          penalty_value: Number(
            testCase.penalty_value || testCase.score_weight || 0.5
          ),
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
    triggers: normalizedTriggers,
    test_cases: normalizedTestCases
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
  const [expandedTriggers, setExpandedTriggers] = useState<Set<number>>(
    new Set([0])
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0)

  const { grading_settings, triggers, test_cases } = useMemo(
    () => normalizeTriggerPayload(rubric?.grading_payload),
    [rubric]
  )

  const syncRubric = useCallback(
    (
      nextSettings: TriggerGradingSettings,
      nextTriggers: TriggerRubricTrigger[],
      nextTestCases: TriggerTestCase[]
    ) => {
      onChange({
        total_points: totalPoints,
        question_category: rubric?.question_category || 'TRIGGER',
        grading_payload: {
          grading_settings: nextSettings,
          triggers: nextTriggers,
          test_cases: nextTestCases
        }
      })
    },
    [onChange, totalPoints, rubric?.question_category]
  )

  const setSettings = useCallback(
    (updater: (prev: TriggerGradingSettings) => TriggerGradingSettings) => {
      const next = updater(grading_settings)
      syncRubric(next, triggers, test_cases)
    },
    [grading_settings, triggers, test_cases, syncRubric]
  )

  const setTriggers = useCallback(
    (updater: (prev: TriggerRubricTrigger[]) => TriggerRubricTrigger[]) => {
      const next = updater(triggers)
      syncRubric(grading_settings, next, test_cases)
    },
    [grading_settings, triggers, test_cases, syncRubric]
  )

  const setTestCases = useCallback(
    (updater: (prev: TriggerTestCase[]) => TriggerTestCase[]) => {
      const next = updater(test_cases)
      syncRubric(grading_settings, triggers, next)
    },
    [grading_settings, triggers, test_cases, syncRubric]
  )

  const toggleTrigger = useCallback((idx: number) => {
    setExpandedTriggers((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }, [])

  const handleAddTrigger = useCallback(() => {
    setTriggers((prev) => [...prev, createDefaultTrigger()])
    setExpandedTriggers((prev) => new Set([...prev, triggers.length]))
  }, [setTriggers, triggers.length])

  const handleRemoveTrigger = useCallback(
    (idx: number) => {
      if (triggers.length === 1) {
        toast.error('Phải có ít nhất 1 trigger trong rubric')
        return
      }
      setTriggers((prev) => prev.filter((_, i) => i !== idx))
    },
    [setTriggers, triggers.length]
  )

  const handleAddTestCase = useCallback(() => {
    setTestCases((prev) => [...prev, createDefaultTestCase()])
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
            triggers: normalized.triggers,
            test_cases: normalized.test_cases
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
        triggers,
        test_cases
      }
    }),
    [
      grading_settings,
      rubric?.question_category,
      test_cases,
      totalPoints,
      triggers
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
          triggers: normalized.triggers,
          test_cases: normalized.test_cases
        }
      }
      const nextActiveIndex = activeCaseId
        ? normalized.test_cases.findIndex((tc) => tc.case_id === activeCaseId)
        : -1

      onChange(normalizedRubric)
      setActiveTestCaseIndex(nextActiveIndex >= 0 ? nextActiveIndex : 0)
    },
    [activeTestCaseIndex, onChange, test_cases, totalPoints]
  )

  const isWizardMode = typeof wizardStep === 'number'
  const isTestCasesStep = !isWizardMode || wizardStep === 2
  const isRulesStep = !isWizardMode || wizardStep === 3

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

    setTestCases(() => [createDefaultTestCase()])
    setActiveTestCaseIndex(0)
  }, [isWizardMode, wizardStep, test_cases.length, setTestCases])

  const isEmpty = triggers.length === 0

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
                title="Khi BẬT: Chỉ cộng điểm cho các tiêu chí đúng, không trừ điểm cho tiêu chí sai. Khi TẮT: Trừ điểm cho mỗi tiêu chí sai (bảng sai, event sai, timing sai, test case fail)."
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
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
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
                            Điểm
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={0.05}
                            value={tc.penalty_value ?? 0.5}
                            onChange={(e) =>
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? {
                                        ...t,
                                        penalty_value:
                                          parseFloat(e.target.value) || 0
                                      }
                                    : t
                                )
                              )
                            }
                            className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                          />
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

      {/* Empty state */}
      {isRulesStep && isEmpty && (
        <div className={styles.emptyState}>
          <Zap className={styles.emptyIcon} />
          <h4 className={styles.emptyTitle}>Chưa có cấu hình rubric TRIGGER</h4>
          <p className={styles.emptyDescription}>
            Thêm cấu hình chấm điểm cho từng trigger hoặc tạo tự động bằng AI
          </p>
          <div className={styles.emptyActions}>
            <Button variant="outline" size="sm" onClick={handleAddTrigger}>
              <Plus className={styles.iconSm} />
              Thêm trigger
            </Button>
          </div>
        </div>
      )}

      {/* Trigger list */}
      {isRulesStep && !isEmpty && (
        <div className={styles.triggerList}>
          {triggers.map((trigger, triggerIdx) => {
            const isExpanded = expandedTriggers.has(triggerIdx)

            return (
              <div key={triggerIdx} className={styles.triggerCard}>
                {/* Trigger header */}
                <div
                  className={styles.triggerHeader}
                  onClick={() => toggleTrigger(triggerIdx)}
                >
                  <div className={styles.triggerHeaderLeft}>
                    {isExpanded ? (
                      <ChevronDown className={styles.chevronIcon} />
                    ) : (
                      <ChevronRight className={styles.chevronIcon} />
                    )}
                    <Zap className={styles.triggerIcon} />
                    <span className={styles.triggerName}>
                      {trigger.expected_name || `Trigger ${triggerIdx + 1}`}
                    </span>
                    <span className={styles.triggerSubText}>
                      trên {trigger.expected_table_name || '...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTrigger(triggerIdx)
                    }}
                    className={styles.removeButton}
                  >
                    <Trash2 className={styles.removeIcon} />
                  </button>
                </div>

                {/* Trigger details */}
                {isExpanded && (
                  <div className={styles.triggerDetails}>
                    {/* Trigger name and table */}
                    <div className={styles.twoColumns}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Tên trigger</label>
                        <input
                          type="text"
                          value={trigger.expected_name || ''}
                          onChange={(e) =>
                            setTriggers((prev) => {
                              const next = [...prev]
                              next[triggerIdx] = {
                                ...next[triggerIdx],
                                expected_name: e.target.value
                              }
                              return next
                            })
                          }
                          placeholder="VD: trg_AuditEmployee"
                          className={styles.fieldInput}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Bảng gắn trigger
                        </label>
                        <input
                          type="text"
                          value={trigger.expected_table_name || ''}
                          onChange={(e) =>
                            setTriggers((prev) => {
                              const next = [...prev]
                              next[triggerIdx] = {
                                ...next[triggerIdx],
                                expected_table_name: e.target.value
                              }
                              return next
                            })
                          }
                          placeholder="VD: Employees"
                          className={styles.fieldInput}
                        />
                      </div>
                    </div>

                    {/* Events */}
                    <div className={styles.eventsSection}>
                      <label className={styles.eventsLabel}>
                        <MousePointerClick className={styles.eventsIcon} />
                        Sự kiện kích hoạt (Events)
                      </label>
                      <div className={styles.eventOptions}>
                        <label className={styles.eventOption}>
                          <input
                            type="checkbox"
                            checked={trigger.is_insert}
                            onChange={(e) =>
                              setTriggers((prev) => {
                                const next = [...prev]
                                next[triggerIdx] = {
                                  ...next[triggerIdx],
                                  is_insert: e.target.checked
                                }
                                return next
                              })
                            }
                            className={styles.eventCheckbox}
                          />
                          <span className={styles.eventText}>INSERT</span>
                        </label>
                        <label className={styles.eventOption}>
                          <input
                            type="checkbox"
                            checked={trigger.is_update}
                            onChange={(e) =>
                              setTriggers((prev) => {
                                const next = [...prev]
                                next[triggerIdx] = {
                                  ...next[triggerIdx],
                                  is_update: e.target.checked
                                }
                                return next
                              })
                            }
                            className={styles.eventCheckbox}
                          />
                          <span className={styles.eventText}>UPDATE</span>
                        </label>
                        <label className={styles.eventOption}>
                          <input
                            type="checkbox"
                            checked={trigger.is_delete}
                            onChange={(e) =>
                              setTriggers((prev) => {
                                const next = [...prev]
                                next[triggerIdx] = {
                                  ...next[triggerIdx],
                                  is_delete: e.target.checked
                                }
                                return next
                              })
                            }
                            className={styles.eventCheckbox}
                          />
                          <span className={styles.eventText}>DELETE</span>
                        </label>
                      </div>
                    </div>

                    {/* Timing */}
                    <div className={styles.timingSection}>
                      <label className={styles.timingLabel}>
                        Thời điểm kích hoạt (Timing)
                      </label>
                      <div className={styles.timingOptions}>
                        <label className={styles.timingOption}>
                          <input
                            type="radio"
                            name={`timing-${triggerIdx}`}
                            checked={trigger.is_after}
                            onChange={() =>
                              setTriggers((prev) => {
                                const next = [...prev]
                                next[triggerIdx] = {
                                  ...next[triggerIdx],
                                  is_after: true
                                }
                                return next
                              })
                            }
                            className={styles.timingRadio}
                          />
                          <span className={styles.eventText}>AFTER</span>
                        </label>
                        <label className={styles.timingOption}>
                          <input
                            type="radio"
                            name={`timing-${triggerIdx}`}
                            checked={!trigger.is_after}
                            onChange={() =>
                              setTriggers((prev) => {
                                const next = [...prev]
                                next[triggerIdx] = {
                                  ...next[triggerIdx],
                                  is_after: false
                                }
                                return next
                              })
                            }
                            className={styles.timingRadio}
                          />
                          <span className={styles.eventText}>INSTEAD OF</span>
                        </label>
                      </div>
                    </div>

                    {/* Points */}
                    <div className={styles.twoColumns}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Điểm tồn tại trigger
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.05}
                          value={trigger.existence_points ?? 0}
                          onChange={(e) =>
                            setTriggers((prev) => {
                              const next = [...prev]
                              next[triggerIdx] = {
                                ...next[triggerIdx],
                                existence_points:
                                  parseFloat(e.target.value) || 0
                              }
                              return next
                            })
                          }
                          className={styles.fieldInput}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Điểm đúng bảng
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.05}
                          value={trigger.table_points ?? 0}
                          onChange={(e) =>
                            setTriggers((prev) => {
                              const next = [...prev]
                              next[triggerIdx] = {
                                ...next[triggerIdx],
                                table_points: parseFloat(e.target.value) || 0
                              }
                              return next
                            })
                          }
                          className={styles.fieldInput}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Điểm đúng sự kiện
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.05}
                          value={trigger.event_points ?? 0}
                          onChange={(e) =>
                            setTriggers((prev) => {
                              const next = [...prev]
                              next[triggerIdx] = {
                                ...next[triggerIdx],
                                event_points: parseFloat(e.target.value) || 0
                              }
                              return next
                            })
                          }
                          className={styles.fieldInput}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Điểm đúng timing
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.05}
                          value={trigger.timing_points ?? 0}
                          onChange={(e) =>
                            setTriggers((prev) => {
                              const next = [...prev]
                              next[triggerIdx] = {
                                ...next[triggerIdx],
                                timing_points: parseFloat(e.target.value) || 0
                              }
                              return next
                            })
                          }
                          className={styles.fieldInput}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Points summary */}
      {isRulesStep && !isEmpty && (
        <div className={styles.summary}>
          <div className={styles.summaryLeft}>
            <Equal className={styles.summaryIcon} />
            <span className={styles.summaryText}>Tổng điểm rubric:</span>
          </div>
          <span className={styles.summaryValue}>
            {(triggers || [])
              .reduce(
                (sum, t) =>
                  sum +
                  (t.existence_points || 0) +
                  (t.table_points || 0) +
                  (t.event_points || 0) +
                  (t.timing_points || 0),
                0
              )
              .toFixed(2)}{' '}
            / {totalPoints}
          </span>
        </div>
      )}
    </div>
  )
}
