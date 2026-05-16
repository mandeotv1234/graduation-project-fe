'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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
    trigger_sql: '',
    expected_result: '',
    setup_script: ''
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

        // Handle both trigger format and routine format (AI sometimes returns routine format)
        const triggerSql = String(
          testCase.trigger_sql || testCase.invocation_query || ''
        )
        const expectedResult = String(
          testCase.expected_result || testCase.validation_query || ''
        )

        normalizedTestCases.push({
          case_id: String(testCase.case_id || crypto.randomUUID()),
          case_name: String(testCase.case_name || ''),
          penalty_value: Number(
            testCase.penalty_value || testCase.score_weight || 0.5
          ),
          trigger_sql: triggerSql,
          expected_result: expectedResult,
          setup_script: String(testCase.setup_script || ''),
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
  const hasAutoTriggeredRef = useRef(false)

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
  }, [setTestCases])

  const handleRemoveTestCase = useCallback(
    (idx: number) => {
      setTestCases((prev) => prev.filter((_, i) => i !== idx))
    },
    [setTestCases]
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
        toast.success('Đã tạo rubric bằng AI thành công!')
      } else {
        toast.error(result.message || 'Tạo rubric thất bại')
      }
    } catch (error) {
      console.log('Error generating rubric:', error)
      toast.error('Có lỗi xảy ra khi tạo rubric')
    } finally {
      setIsGenerating(false)
    }
  }, [correctQuery, questionContent, totalPoints, onChange])

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
    if (
      isWizardMode &&
      wizardStep === 2 &&
      triggers.length === 0 &&
      correctQuery?.trim() &&
      !isGenerating &&
      !hasAutoTriggeredRef.current
    ) {
      hasAutoTriggeredRef.current = true
      handleGenerateRubric()
    }
  }, [
    wizardStep,
    isWizardMode,
    triggers.length,
    correctQuery,
    isGenerating,
    handleGenerateRubric
  ])

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
                ℹ️
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
                title="Khi BẬT: Tên trigger phải khớp chính xác (VD: 'TRG_Test' ≠ 'trg_test'). Khi TẮT: Không phân biệt hoa thường (VD: 'TRG_Test' = 'trg_test')."
              >
                ℹ️
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
                title="FAIL_ALL: Nếu SQL có lỗi cú pháp → 0 điểm toàn bộ. PARTIAL: Nếu SQL có lỗi cú pháp → vẫn chấm các phần đúng được (hiện tại chưa implement)."
              >
                <option value="FAIL_ALL">0 điểm toàn bộ</option>
                <option value="PARTIAL">Chấm từng phần (chưa hỗ trợ)</option>
              </select>
              <span
                className="ml-2 text-xs text-muted-foreground"
                title="FAIL_ALL: Nếu SQL có lỗi cú pháp → 0 điểm toàn bộ. PARTIAL: Nếu SQL có lỗi cú pháp → vẫn chấm các phần đúng được (hiện tại chưa implement)."
              >
                ℹ️
              </span>
            </div> */}
          </div>
        </div>
      )}

      {/* Step 2: Test Cases */}
      {isTestCasesStep && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Test Cases</h3>
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
                      TC {idx + 1}
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
                      <span className={styles.testCaseNumber}>
                        Test case {idx + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTestCase(idx)}
                      >
                        <Trash2 className={styles.iconSm} />
                      </Button>
                    </div>
                    <div className={styles.testCaseFields}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Tên test case
                        </label>
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
                          className={styles.fieldInput}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          SQL kích hoạt trigger
                        </label>
                        <div className="h-[100px] overflow-hidden rounded border border-border bg-sub-background">
                          <TeacherSqlEditor
                            value={tc.trigger_sql || ''}
                            onChange={(value) =>
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? { ...t, trigger_sql: value || '' }
                                    : t
                                )
                              )
                            }
                            height="100%"
                            showExpandButton={true}
                          />
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Expected result
                        </label>
                        <div className="h-[100px] overflow-hidden rounded border border-border bg-sub-background">
                          <TeacherSqlEditor
                            value={tc.expected_result || ''}
                            onChange={(value) =>
                              setTestCases((prev) =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? { ...t, expected_result: value || '' }
                                    : t
                                )
                              )
                            }
                            height="100%"
                            showExpandButton={true}
                          />
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Setup script
                        </label>
                        <div className="h-[120px] overflow-hidden rounded border border-border bg-sub-background">
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
                      <div className={styles.penaltyField}>
                        <label className={styles.penaltyLabel}>
                          Điểm trừ nếu fail:
                        </label>
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
                          className={styles.penaltyInput}
                        />
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
