'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Settings2,
  Sparkles,
  Equal,
  Loader2,
  Code2
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateGradingRubric } from '@/lib/actions'
import styles from '@/app/(main)/teacher/exams/[examId]/questions/components/routine-rubric-editor/routine-rubric-editor.module.scss'
import {
  GradingRubric,
  RoutineGradingSettings,
  RoutineRubricRoutine,
  RoutineType,
  SyntaxErrorAction,
  RoutineTestCase,
  VerificationType
} from '@/lib/types'
import { TeacherSqlEditor } from '@/app/(main)/teacher/exams/[examId]/questions/components/teacher-sql-editor'

function createDefaultRoutine(
  defaultType: RoutineType = 'FUNCTION'
): RoutineRubricRoutine {
  return {
    expected_name: '',
    expected_type: defaultType,
    existence_points: 0.2,
    type_points: 0.2,
    return_type_points: 0.2,
    expected_return_type: 'INT',
    missing_penalty_action: 'SKIP_ROUTINE',
    parameters: []
  }
}

function createDefaultTestCase(
  questionType: 'FUNCTION' | 'STORED_PROCEDURE' = 'STORED_PROCEDURE'
): RoutineTestCase {
  return {
    case_id: crypto.randomUUID(),
    case_name: '',
    score_weight: 0.5,
    match_type: 'EXACT',
    input_parameters: '{}',
    setup_script: '',
    invocation_query: '',
    validation_query: '',
    verification_type:
      questionType === 'FUNCTION' ? 'RETURN_VALUE' : 'SIDE_EFFECT',
    description: ''
  }
}

function toSyntaxErrorAction(value: unknown): SyntaxErrorAction {
  return value === 'PARTIAL' ? 'PARTIAL' : 'FAIL_ALL'
}

function toPrintOutputCompareMode(value: unknown): 'LENIENT' | 'STRICT' {
  return value === 'STRICT' ? 'STRICT' : 'LENIENT'
}

function toTextValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function normalizeRoutinePayload(
  payload: GradingRubric['grading_payload'] | undefined
): {
  grading_settings: RoutineGradingSettings
  routines: RoutineRubricRoutine[]
  test_cases: RoutineTestCase[]
} {
  const defaultSettings: RoutineGradingSettings = {
    syntax_error_action: 'FAIL_ALL',
    print_output_compare_mode: 'LENIENT'
  }

  if (!payload || typeof payload !== 'object') {
    return {
      grading_settings: defaultSettings,
      routines: [],
      test_cases: []
    }
  }

  const payloadRecord = payload as Record<string, unknown>
  const rawSettings =
    payloadRecord.grading_settings &&
    typeof payloadRecord.grading_settings === 'object'
      ? (payloadRecord.grading_settings as Record<string, unknown>)
      : {}

  const settings: RoutineGradingSettings = {
    syntax_error_action: toSyntaxErrorAction(rawSettings.syntax_error_action),
    print_output_compare_mode: toPrintOutputCompareMode(
      rawSettings.print_output_compare_mode
    )
  }

  return {
    grading_settings: settings,
    routines: Array.isArray(payloadRecord.routines)
      ? (payloadRecord.routines as RoutineRubricRoutine[])
      : [],
    test_cases: Array.isArray(payloadRecord.test_cases)
      ? (payloadRecord.test_cases as RoutineTestCase[])
      : []
  }
}

const ROUTINE_TYPES: { value: RoutineType; label: string }[] = [
  { value: 'FUNCTION', label: 'FUNCTION' },
  { value: 'PROCEDURE', label: 'PROCEDURE' },
  { value: 'STORED_PROCEDURE', label: 'STORED_PROCEDURE' }
]

interface RoutineRubricEditorProps {
  examId?: number
  questionType?: 'FUNCTION' | 'STORED_PROCEDURE'
  totalPoints: number
  rubric: GradingRubric | null
  onChange: (rubric: GradingRubric) => void
  correctQuery?: string
  questionContent?: string
  schemaContext?: string
  wizardStep?: number
}

export function RoutineRubricEditor({
  questionType = 'FUNCTION',
  totalPoints,
  rubric,
  onChange,
  correctQuery,
  questionContent,
  schemaContext,
  wizardStep
}: RoutineRubricEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0)
  const hasAutoTriggeredRef = useRef(false)

  const rubricCategory =
    questionType === 'STORED_PROCEDURE' ? 'STORED_PROCEDURE' : 'FUNCTION'
  const { grading_settings, routines, test_cases } = useMemo(
    () => normalizeRoutinePayload(rubric?.grading_payload),
    [rubric]
  )

  const syncRubric = useCallback(
    (
      nextSettings: RoutineGradingSettings,
      nextRoutines: RoutineRubricRoutine[],
      nextTestCases: RoutineTestCase[] = test_cases
    ) => {
      onChange({
        total_points: totalPoints,
        question_category: rubric?.question_category || rubricCategory,
        grading_payload: {
          grading_settings: nextSettings,
          routines: nextRoutines,
          test_cases: nextTestCases
        }
      })
    },
    [
      onChange,
      totalPoints,
      rubric?.question_category,
      rubricCategory,
      test_cases
    ]
  )

  const setSettings = useCallback(
    (updater: (prev: RoutineGradingSettings) => RoutineGradingSettings) => {
      const next = updater(grading_settings)
      syncRubric(next, routines)
    },
    [grading_settings, routines, syncRubric]
  )

  const setRoutines = useCallback(
    (updater: (prev: RoutineRubricRoutine[]) => RoutineRubricRoutine[]) => {
      const next = updater(routines)
      syncRubric(grading_settings, next)
    },
    [grading_settings, routines, syncRubric]
  )

  const setTestCases = useCallback(
    (
      updater:
        | RoutineTestCase[]
        | ((prev: RoutineTestCase[]) => RoutineTestCase[])
    ) => {
      const next = typeof updater === 'function' ? updater(test_cases) : updater
      syncRubric(grading_settings, routines, next)
    },
    [grading_settings, routines, test_cases, syncRubric]
  )
  useEffect(() => {
    if (test_cases.length === 0) {
      setActiveTestCaseIndex(0)
      return
    }
    if (activeTestCaseIndex > test_cases.length - 1) {
      setActiveTestCaseIndex(test_cases.length - 1)
    }
  }, [activeTestCaseIndex, test_cases.length])

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
        questionType: rubricCategory,
        schemaContext
      })

      if (result.data) {
        const parsedRubric: GradingRubric =
          typeof result.data === 'string'
            ? JSON.parse(result.data)
            : result.data
        onChange({
          ...parsedRubric,
          question_category: rubricCategory
        })
        toast.success('Đã tạo rubric bằng AI thành công!')
      } else {
        toast.error(result.message || 'Tạo rubric thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo rubric')
    } finally {
      setIsGenerating(false)
    }
  }, [
    correctQuery,
    questionContent,
    schemaContext,
    totalPoints,
    onChange,
    rubricCategory
  ])

  const isWizardMode = typeof wizardStep === 'number'
  const isTestCasesStep = !isWizardMode || wizardStep === 2
  const isRulesStep = !isWizardMode || wizardStep === 3

  useEffect(() => {
    if (
      isWizardMode &&
      wizardStep === 2 &&
      routines.length === 0 &&
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
    routines.length,
    correctQuery,
    isGenerating,
    handleGenerateRubric
  ])

  const rubricTotalPoints = useMemo(
    () =>
      (routines || []).reduce(
        (sum, r) =>
          sum +
          (r.existence_points || 0) +
          (r.type_points || 0) +
          (r.return_type_points || 0),
        0
      ),
    [routines]
  )
  return (
    <div className={styles.editor}>
      {/* Step 2: Test Cases */}
      {isTestCasesStep && (
        <div className={styles.testCasesSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Test Cases</h3>
            <div className={styles.headerActions}>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setTestCases((prev) => [
                    ...prev,
                    createDefaultTestCase(questionType)
                  ])
                }
                disabled={isGenerating}
              >
                <Plus className={styles.iconSm} />
                Thêm test case
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleGenerateRubric}
                disabled={isGenerating || !correctQuery?.trim()}
              >
                {isGenerating ? (
                  <Loader2 className={`${styles.iconSm} ${styles.spin}`} />
                ) : (
                  <Sparkles className={styles.iconSm} />
                )}
                AI Generate
              </Button>
            </div>
          </div>

          {test_cases.length === 0 ? (
            <div className={styles.emptyState}>
              <h4 className={styles.emptyTitle}>Chưa có test case</h4>
              <p className={styles.emptyDescription}>
                Nhấn "AI Generate" để tự động tạo từ đề bài, hoặc thêm thủ công
              </p>
            </div>
          ) : (
            <div className={styles.testCaseList}>
              <div className={styles.testCaseNav}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActiveTestCaseIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={activeTestCaseIndex === 0}
                >
                  <ChevronLeft className={styles.iconSm} />
                </Button>
                <div className={styles.testCaseTabs}>
                  {test_cases.map((tc, idx) => (
                    <Button
                      key={tc.case_id || idx}
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
                  type="button"
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
                        onClick={() =>
                          setTestCases((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        <Trash2 className={styles.iconSm} />
                      </Button>
                    </div>
                    <div className={styles.testCaseFields}>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Tên test case
                        </span>
                        <input
                          type="text"
                          value={tc.case_name}
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
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Kiểu kiểm tra
                        </span>
                        <select
                          value={tc.verification_type}
                          onChange={(e) =>
                            setTestCases((prev) =>
                              prev.map((t, i) =>
                                i === idx
                                  ? {
                                      ...t,
                                      verification_type: e.target
                                        .value as VerificationType
                                    }
                                  : t
                              )
                            )
                          }
                          className={styles.fieldSelect}
                        >
                          <option value="RETURN_VALUE">RETURN_VALUE</option>
                          <option value="OUT_PARAMETER">OUT_PARAMETER</option>
                          <option value="RESULT_SET">RESULT_SET</option>
                          <option value="SIDE_EFFECT">SIDE_EFFECT</option>
                          <option value="PRINT_OUTPUT">PRINT_OUTPUT</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Input parameters
                        </span>
                        <textarea
                          placeholder='VD: {"MaXe":"X001","MaTuyen":"T001"}'
                          value={toTextValue(tc.input_parameters)}
                          onChange={(e) =>
                            setTestCases((prev) =>
                              prev.map((t, i) =>
                                i === idx
                                  ? { ...t, input_parameters: e.target.value }
                                  : t
                              )
                            )
                          }
                          className={styles.fieldTextarea}
                          rows={2}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Invocation query
                        </span>
                        <div className={styles.sqlEditorBox}>
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
                            height="180px"
                          />
                        </div>
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Validation query
                        </span>
                        <div className={styles.sqlEditorBox}>
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
                            height="180px"
                          />
                        </div>
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Setup script
                        </span>
                        <textarea
                          placeholder="SQL để chuẩn bị data (DROP TABLE IF EXISTS, CREATE TABLE, INSERT)"
                          value={tc.setup_script}
                          onChange={(e) =>
                            setTestCases((prev) =>
                              prev.map((t, i) =>
                                i === idx
                                  ? { ...t, setup_script: e.target.value }
                                  : t
                              )
                            )
                          }
                          className={`${styles.fieldTextarea} hidden`}
                          rows={12}
                        />
                        <div className={styles.sqlEditorBoxLarge}>
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
                            height="260px"
                          />
                        </div>
                      </label>
                      <div className={styles.penaltyField}>
                        <label className={styles.penaltyLabel}>
                          Điểm trừ nếu fail:
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.05}
                          value={tc.score_weight ?? tc.penalty_value ?? 0}
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
                          className={styles.penaltyInput}
                        />
                        <label className={styles.penaltyLabel}>Match:</label>
                        <select
                          value={tc.match_type || 'EXACT'}
                          onChange={(e) =>
                            setTestCases((prev) =>
                              prev.map((t, i) =>
                                i === idx
                                  ? {
                                      ...t,
                                      match_type: e.target.value as
                                        | 'EXACT'
                                        | 'CONTAINS'
                                    }
                                  : t
                              )
                            )
                          }
                          className={styles.fieldSelect}
                        >
                          <option value="EXACT">EXACT</option>
                          <option value="CONTAINS">CONTAINS</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Grading Rules */}
      {isRulesStep && (
        <div className="space-y-4">
          <div className={styles.settingsCard}>
            <div className={styles.settingsHeader}>
              <Settings2 className={styles.settingsIcon} />
              <span className={styles.settingsTitle}>Cài đặt chấm điểm</span>
            </div>
            <div className={styles.settingsControls}>
              <div className={styles.syntaxGroup}>
                <span className={styles.mutedText}>So khớp thông báo:</span>
                <select
                  value={
                    grading_settings.print_output_compare_mode ?? 'LENIENT'
                  }
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      print_output_compare_mode: e.target.value as
                        | 'LENIENT'
                        | 'STRICT'
                    }))
                  }
                  className={styles.syntaxSelect}
                >
                  <option value="LENIENT">Linh hoạt</option>
                  <option value="STRICT">Theo mẫu</option>
                </select>
              </div>

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
                >
                  <option value="FAIL_ALL">0 điểm toàn bộ</option>
                  <option value="PARTIAL">Chấm từng phần</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cấu hình Routine đơn giản */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsHeader}>
              <Code2 className={styles.settingsIcon} />
              <span className={styles.settingsTitle}>
                Định nghĩa routine kỳ vọng
              </span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Tên routine
                  </span>
                  <input
                    type="text"
                    value={routines[0]?.expected_name || ''}
                    onChange={(e) =>
                      setRoutines((prev) => {
                        if (prev.length === 0) {
                          const newRoutine = createDefaultRoutine()
                          newRoutine.expected_name = e.target.value
                          return [newRoutine]
                        }
                        return prev.map((r, i) =>
                          i === 0 ? { ...r, expected_name: e.target.value } : r
                        )
                      })
                    }
                    placeholder="vd: sp_TinhTong"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">Loại</span>
                  <select
                    value={routines[0]?.expected_type || 'FUNCTION'}
                    onChange={(e) =>
                      setRoutines((prev) => {
                        if (prev.length === 0) {
                          const newRoutine = createDefaultRoutine(
                            e.target.value as RoutineType
                          )
                          return [newRoutine]
                        }
                        return prev.map((r, i) =>
                          i === 0
                            ? {
                                ...r,
                                expected_type: e.target.value as RoutineType
                              }
                            : r
                        )
                      })
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  >
                    {ROUTINE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Kiểu trả về
                  </span>
                  <input
                    type="text"
                    value={routines[0]?.expected_return_type || ''}
                    onChange={(e) =>
                      setRoutines((prev) => {
                        if (prev.length === 0) return prev
                        return prev.map((r, i) =>
                          i === 0
                            ? { ...r, expected_return_type: e.target.value }
                            : r
                        )
                      })
                    }
                    placeholder="vd: INT, VARCHAR(50)"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Điểm tên tồn tại
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={routines[0]?.existence_points ?? 0.2}
                    onChange={(e) =>
                      setRoutines((prev) => {
                        if (prev.length === 0) return prev
                        return prev.map((r, i) =>
                          i === 0
                            ? {
                                ...r,
                                existence_points:
                                  parseFloat(e.target.value) || 0
                              }
                            : r
                        )
                      })
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Điểm loại đúng
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={routines[0]?.type_points || 0.2}
                    onChange={(e) =>
                      setRoutines((prev) => {
                        if (prev.length === 0) return prev
                        return prev.map((r, i) =>
                          i === 0
                            ? {
                                ...r,
                                type_points: parseFloat(e.target.value) || 0
                              }
                            : r
                        )
                      })
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Điểm kiểu trả về
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={routines[0]?.return_type_points || 0.2}
                    onChange={(e) =>
                      setRoutines((prev) => {
                        if (prev.length === 0) return prev
                        return prev.map((r, i) =>
                          i === 0
                            ? {
                                ...r,
                                return_type_points:
                                  parseFloat(e.target.value) || 0
                              }
                            : r
                        )
                      })
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRulesStep && (
        <div className={styles.summary}>
          <div className={styles.summaryLeft}>
            <Equal className={styles.summaryIcon} />
            <span className={styles.summaryText}>Tổng điểm rubric:</span>
          </div>
          <span className={styles.summaryValue}>
            {rubricTotalPoints.toFixed(2)} / {totalPoints}
          </span>
        </div>
      )}
    </div>
  )
}
