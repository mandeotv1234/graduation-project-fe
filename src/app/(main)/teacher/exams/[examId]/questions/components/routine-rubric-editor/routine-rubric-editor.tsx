'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Equal,
  Loader2,
  Code2
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
  VerificationType,
  WhiteboxRule,
  WhiteboxSettings
} from '@/lib/types'
import { TeacherSqlEditor } from '@/app/(main)/teacher/exams/[examId]/questions/components/teacher-sql-editor'
import { TestCaseTabs } from '@/app/(main)/teacher/exams/[examId]/questions/components/test-case-tabs'
import { WhiteboxRulesEditor } from '@/app/(main)/teacher/exams/[examId]/questions/components/whitebox-rules-editor'

function createDefaultRoutine(
  defaultType: RoutineType = 'FUNCTION'
): RoutineRubricRoutine {
  return {
    expected_name: '',
    expected_type: defaultType,
    existence_points: 0.2,
    type_points: 0.2,
    return_type_points: 0.2,
    expected_return_type: defaultType === 'FUNCTION' ? 'INT' : '',
    missing_penalty_action: 'SKIP_ROUTINE',
    parameters: []
  }
}

function createDefaultTestCase(
  questionType: 'FUNCTION' | 'STORED_PROCEDURE' = 'STORED_PROCEDURE',
  index = 0
): RoutineTestCase {
  return {
    case_id: `TC_${String(index + 1).padStart(2, '0')}`,
    case_name: `Kịch bản ${index + 1}`,
    score_weight: 0.2,
    match_type: 'EXACT',
    setup_script: '',
    invocation_query: '',
    validation_query: '',
    verification_type:
      questionType === 'FUNCTION' ? 'RETURN_VALUE' : 'SIDE_EFFECT',
    description: `Kịch bản ${index + 1}`
  }
}

function toSyntaxErrorAction(value: unknown): SyntaxErrorAction {
  return value === 'PARTIAL' ? 'PARTIAL' : 'FAIL_ALL'
}

function toPrintOutputCompareMode(value: unknown): 'LENIENT' | 'STRICT' {
  return value === 'STRICT' ? 'STRICT' : 'LENIENT'
}

function normalizeRoutineTestCase(
  tc: RoutineTestCase,
  index: number,
  questionType: 'FUNCTION' | 'STORED_PROCEDURE'
): RoutineTestCase {
  const defaults = createDefaultTestCase(questionType, index)
  return {
    ...defaults,
    ...tc,
    case_id: tc.case_id || defaults.case_id,
    case_name: tc.case_name || defaults.case_name,
    description: tc.description ?? tc.case_name ?? defaults.description,
    setup_script: tc.setup_script ?? '',
    invocation_query: tc.invocation_query ?? '',
    validation_query: tc.validation_query ?? '',
    score_weight:
      typeof tc.score_weight === 'number'
        ? tc.score_weight
        : typeof tc.penalty_value === 'number'
          ? tc.penalty_value
          : defaults.score_weight,
    match_type: tc.match_type || defaults.match_type,
    verification_type: tc.verification_type || defaults.verification_type
  }
}

function normalizeRoutinePayload(
  payload: GradingRubric['grading_payload'] | undefined,
  questionType: 'FUNCTION' | 'STORED_PROCEDURE' = 'STORED_PROCEDURE'
): {
  grading_settings: RoutineGradingSettings
  routines: RoutineRubricRoutine[]
  test_cases: RoutineTestCase[]
  whitebox_rules: WhiteboxRule[]
  whitebox_settings: WhiteboxSettings
} {
  const defaultSettings: RoutineGradingSettings = {
    syntax_error_action: 'FAIL_ALL',
    print_output_compare_mode: 'LENIENT'
  }

  if (!payload || typeof payload !== 'object') {
    return {
      grading_settings: defaultSettings,
      routines: [],
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
      ? (payloadRecord.test_cases as RoutineTestCase[]).map((tc, index) =>
          normalizeRoutineTestCase(tc, index, questionType)
        )
      : [],
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

function normalizeIssueKey(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function collectIssueKeys(issues: unknown): Set<string> {
  const keys = new Set<string>()
  if (!Array.isArray(issues)) return keys

  const addKey = (value: unknown) => {
    const normalized = normalizeIssueKey(value)
    if (!normalized || normalized === 'rubric') return

    keys.add(normalized)
    const match = normalized.match(/^tc0*(\d+)$/)
    if (match) {
      const index = Number(match[1]) - 1
      if (Number.isInteger(index) && index >= 0) {
        keys.add(`index:${index}`)
      }
    }
  }

  for (const issue of issues) {
    if (issue && typeof issue === 'object') {
      const record = issue as Record<string, unknown>
      addKey(record.caseId)

      const message = String(record.message || '')
      const messageMatch = message.match(/\bTC\s*0*(\d+)\b/i)
      if (messageMatch) {
        addKey(`TC_${messageMatch[1]}`)
      }
    } else {
      addKey(issue)
    }
  }

  return keys
}

type GeneratedRubricIssue = {
  caseId: string
  phase: string
  errorCode: string
  message: string
}

function collectIssueDetails(issues: unknown): GeneratedRubricIssue[] {
  if (!Array.isArray(issues)) return []

  return issues
    .map((issue) => {
      if (!issue || typeof issue !== 'object') {
        return {
          caseId: '',
          phase: '',
          errorCode: '',
          message: String(issue || '')
        }
      }

      const record = issue as Record<string, unknown>
      return {
        caseId: String(record.caseId || ''),
        phase: String(record.phase || ''),
        errorCode: String(record.errorCode || ''),
        message: String(record.message || '')
      }
    })
    .filter((issue) => issue.message.trim().length > 0)
}

function issueMatchesTestCase(
  issue: GeneratedRubricIssue,
  testCase: RoutineTestCase,
  index: number
): boolean {
  const issueCaseKey = normalizeIssueKey(issue.caseId)
  if (
    issueCaseKey &&
    issueCaseKey !== 'rubric' &&
    issueCaseKey === normalizeIssueKey(testCase.case_id)
  ) {
    return true
  }

  const messageMatch = issue.message.match(/\bTC\s*0*(\d+)\b/i)
  if (messageMatch) {
    return Number(messageMatch[1]) === index + 1
  }

  return false
}

function unwrapGeneratedRubricResponse(value: unknown): {
  rubric: GradingRubric | null
  needsReview: boolean
  issueCount: number
  issueKeys: Set<string>
  issues: GeneratedRubricIssue[]
} {
  if (!value || typeof value !== 'object') {
    return {
      rubric: null,
      needsReview: false,
      issueCount: 0,
      issueKeys: new Set(),
      issues: []
    }
  }

  const record = value as Record<string, unknown>
  if (record.status === 'NEEDS_REVIEW') {
    const issues = Array.isArray(record.issues) ? record.issues : []
    return {
      rubric:
        record.rubric && typeof record.rubric === 'object'
          ? (record.rubric as GradingRubric)
          : null,
      needsReview: true,
      issueCount: issues.length,
      issueKeys: collectIssueKeys(issues),
      issues: collectIssueDetails(issues)
    }
  }

  return {
    rubric: value as GradingRubric,
    needsReview: false,
    issueCount: 0,
    issueKeys: new Set(),
    issues: []
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
  const [issueCaseKeys, setIssueCaseKeys] = useState<Set<string>>(new Set())
  const [issueDetails, setIssueDetails] = useState<GeneratedRubricIssue[]>([])
  const hasInitializedDefaultCaseRef = useRef(false)
  const editorRootRef = useRef<HTMLDivElement | null>(null)

  const rubricCategory =
    questionType === 'STORED_PROCEDURE' ? 'STORED_PROCEDURE' : 'FUNCTION'
  const {
    grading_settings,
    routines,
    test_cases,
    whitebox_rules,
    whitebox_settings
  } = useMemo(
    () => normalizeRoutinePayload(rubric?.grading_payload, questionType),
    [rubric, questionType]
  )

  const syncRubric = useCallback(
    (
      nextSettings: RoutineGradingSettings,
      nextRoutines: RoutineRubricRoutine[],
      nextTestCases: RoutineTestCase[] = test_cases,
      nextWhiteboxRules: WhiteboxRule[] = whitebox_rules,
      nextWhiteboxSettings: WhiteboxSettings = whitebox_settings
    ) => {
      onChange({
        total_points: totalPoints,
        question_category: rubric?.question_category || rubricCategory,
        grading_payload: {
          grading_settings: nextSettings,
          routines: nextRoutines,
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
      rubricCategory,
      test_cases,
      whitebox_rules,
      whitebox_settings
    ]
  )

  const setRoutines = useCallback(
    (updater: (prev: RoutineRubricRoutine[]) => RoutineRubricRoutine[]) => {
      const next = updater(routines)
      syncRubric(
        grading_settings,
        next,
        test_cases,
        whitebox_rules,
        whitebox_settings
      )
    },
    [
      grading_settings,
      routines,
      test_cases,
      whitebox_rules,
      whitebox_settings,
      syncRubric
    ]
  )

  const setTestCases = useCallback(
    (
      updater:
        | RoutineTestCase[]
        | ((prev: RoutineTestCase[]) => RoutineTestCase[])
    ) => {
      const next = typeof updater === 'function' ? updater(test_cases) : updater
      syncRubric(
        grading_settings,
        routines,
        next,
        whitebox_rules,
        whitebox_settings
      )
    },
    [
      grading_settings,
      routines,
      test_cases,
      whitebox_rules,
      whitebox_settings,
      syncRubric
    ]
  )

  const setWhitebox = useCallback(
    (nextRules: WhiteboxRule[], nextSettings: WhiteboxSettings) => {
      syncRubric(
        grading_settings,
        routines,
        test_cases,
        nextRules,
        nextSettings
      )
    },
    [grading_settings, routines, test_cases, syncRubric]
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
        questionType: rubricCategory,
        schemaContext
      })

      if (result.data) {
        const parsedResponse =
          typeof result.data === 'string'
            ? JSON.parse(result.data)
            : result.data
        const {
          rubric: parsedRubric,
          needsReview,
          issueCount,
          issueKeys,
          issues
        } = unwrapGeneratedRubricResponse(parsedResponse)

        if (!parsedRubric) {
          toast.error('AI trả về phản hồi thiếu rubric')
          return
        }

        onChange({
          ...parsedRubric,
          question_category: rubricCategory
        })
        setIssueCaseKeys(issueKeys)
        setIssueDetails(issues)
        if (issueKeys.size > 0) {
          const generatedTestCases =
            parsedRubric.grading_payload &&
            typeof parsedRubric.grading_payload === 'object' &&
            Array.isArray(
              (parsedRubric.grading_payload as Record<string, unknown>)
                .test_cases
            )
              ? ((parsedRubric.grading_payload as Record<string, unknown>)
                  .test_cases as RoutineTestCase[])
              : []
          const firstIssueIndex = generatedTestCases.findIndex((tc, idx) => {
            return (
              issueKeys.has(normalizeIssueKey(tc.case_id)) ||
              issueKeys.has(`index:${idx}`)
            )
          })
          if (firstIssueIndex >= 0) {
            setActiveTestCaseIndex(firstIssueIndex)
          }
        }
        if (needsReview) {
          toast.warning(
            `AI đã tạo rubric nhưng cần giáo viên kiểm tra lại (${issueCount} vấn đề)`
          )
        } else {
          setIssueCaseKeys(new Set())
          setIssueDetails([])
          toast.success('Đã tạo rubric bằng AI thành công!')
        }
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
    if (!isWizardMode) return
    editorRootRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }, [isWizardMode, wizardStep])

  useEffect(() => {
    if (!isWizardMode || wizardStep !== 2) return
    if (test_cases.length > 0) return
    if (hasInitializedDefaultCaseRef.current) return

    hasInitializedDefaultCaseRef.current = true
    setTestCases([createDefaultTestCase(questionType, 0)])
    setActiveTestCaseIndex(0)
  }, [isWizardMode, wizardStep, questionType, test_cases.length, setTestCases])

  useEffect(() => {
    if (test_cases.length === 0) {
      if (activeTestCaseIndex !== 0) setActiveTestCaseIndex(0)
      return
    }

    if (activeTestCaseIndex >= test_cases.length) {
      setActiveTestCaseIndex(test_cases.length - 1)
    }
  }, [activeTestCaseIndex, test_cases.length])

  const testCaseWeightTotal = useMemo(
    () =>
      (test_cases || []).reduce(
        (sum, tc) => sum + (Number(tc.score_weight) || 0),
        0
      ),
    [test_cases]
  )
  const selectedTestCaseIndex =
    test_cases.length > 0
      ? Math.min(activeTestCaseIndex, test_cases.length - 1)
      : 0
  const routineParameters = routines[0]?.parameters || []

  return (
    <div ref={editorRootRef} className={styles.editor}>
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

          <div className="flex items-center justify-between pb-2">
            <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
              Danh sách test case
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs"
              >
                {test_cases.length}
              </Badge>
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Tổng trọng số: {testCaseWeightTotal.toFixed(2)} / 1.00
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setTestCases((prev) => [
                    ...prev,
                    createDefaultTestCase(questionType, prev.length)
                  ])
                  setActiveTestCaseIndex(test_cases.length)
                }}
                disabled={isGenerating}
              >
                <Plus className="h-4 w-4" />
                Thêm test case
              </Button>
            </div>
          </div>

          {test_cases.length === 0 ? (
            <div className={styles.emptyState}>
              <h4 className={styles.emptyTitle}>Chưa có test case</h4>
              <p className={styles.emptyDescription}>
                Thêm test case thủ công hoặc bấm &quot;AI tạo test case&quot;
                khi cần.
              </p>
            </div>
          ) : (
            <div className={styles.testCaseList}>
              <TestCaseTabs
                count={test_cases.length}
                activeIndex={selectedTestCaseIndex}
                onChange={setActiveTestCaseIndex}
                getKey={(index) => test_cases[index]?.case_id || index}
                getTitle={(index) =>
                  issueCaseKeys.has(
                    normalizeIssueKey(test_cases[index]?.case_id)
                  ) || issueCaseKeys.has(`index:${index}`)
                    ? 'Test case này cần kiểm tra'
                    : ''
                }
                hasIssue={(index) =>
                  issueCaseKeys.has(
                    normalizeIssueKey(test_cases[index]?.case_id)
                  ) || issueCaseKeys.has(`index:${index}`)
                }
              />
              {test_cases.map((tc, idx) => {
                if (idx !== selectedTestCaseIndex) return null

                const isExpanded = true
                const hasIssue =
                  issueCaseKeys.has(normalizeIssueKey(tc.case_id)) ||
                  issueCaseKeys.has(`index:${idx}`)
                const currentIssues = issueDetails.filter((issue) =>
                  issueMatchesTestCase(issue, tc, idx)
                )

                return (
                  <div
                    key={`${tc.case_id}-${idx}`}
                    className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                      isExpanded
                        ? 'bg-surface shadow-md border-outline-variant/50 relative z-10 scale-[1.01]'
                        : 'bg-surface-container-lowest shadow-sm border-outline-variant/30 hover:border-outline-variant/60 hover:shadow-md'
                    } ${hasIssue ? 'border-destructive/60' : ''}`}
                  >
                    <div
                      className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${
                        isExpanded
                          ? 'bg-surface-container-sub-low border-b border-outline-variant/30'
                          : 'bg-transparent hover:bg-surface-container-sub-low/50'
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container shadow-sm">
                          {idx + 1}
                        </span>
                        <span className="truncate text-sm font-semibold text-on-surface">
                          {tc.description ||
                            tc.case_name ||
                            `Test case ${idx + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTestCases((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                            setActiveTestCaseIndex((prev) =>
                              Math.max(0, Math.min(prev, test_cases.length - 2))
                            )
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Xóa test case"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 space-y-6 bg-surface-container-lowest">
                        {currentIssues.length > 0 && (
                          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            <div className="mb-2 flex items-center gap-2 font-semibold">
                              <AlertTriangle className="h-4 w-4" />
                              Test case này cần kiểm tra ({
                                currentIssues.length
                              }{' '}
                              vấn đề)
                            </div>
                            <div className="space-y-1">
                              {currentIssues.map((issue, issueIndex) => (
                                <div
                                  key={`${issue.errorCode || 'issue'}-${issueIndex}`}
                                >
                                  <span className="font-mono text-xs">
                                    {issue.errorCode || issue.phase || 'ISSUE'}
                                  </span>
                                  : {issue.message}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                          <label className="space-y-1.5">
                            <span className="text-xs font-semibold text-on-surface-variant block">
                              Mã test case
                            </span>
                            <input
                              type="text"
                              value={tc.case_id}
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
                            <span className="text-xs font-semibold text-on-surface-variant block">
                              Tên kịch bản
                            </span>
                            <input
                              type="text"
                              value={tc.description || ''}
                              onChange={(e) =>
                                setTestCases((prev) =>
                                  prev.map((t, i) =>
                                    i === idx
                                      ? { ...t, description: e.target.value }
                                      : t
                                  )
                                )
                              }
                              className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-xs font-semibold text-on-surface-variant block">
                              Điểm (trọng số)
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={1}
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
                              className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-xs font-semibold text-on-surface-variant block">
                              Kiểu kiểm tra
                            </span>
                            <select
                              value={tc.verification_type}
                              onChange={(e) => {
                                const nextType = e.target
                                  .value as VerificationType
                                setTestCases((prev) =>
                                  prev.map((t, i) =>
                                    i === idx
                                      ? {
                                          ...t,
                                          verification_type: nextType,
                                          ...(nextType === 'PRINT_OUTPUT'
                                            ? {
                                                match_type:
                                                  t.match_type || 'EXACT'
                                              }
                                            : {})
                                        }
                                      : t
                                  )
                                )
                              }}
                              className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                            >
                              <option value="RETURN_VALUE">RETURN_VALUE</option>
                              <option value="OUT_PARAMETER">
                                OUT_PARAMETER
                              </option>
                              <option value="RESULT_SET">RESULT_SET</option>
                              <option value="SIDE_EFFECT">SIDE_EFFECT</option>
                              <option value="PRINT_OUTPUT">PRINT_OUTPUT</option>
                            </select>
                          </label>
                        </div>

                        {tc.verification_type === 'PRINT_OUTPUT' && (
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                            <label className="space-y-1.5">
                              <span className="text-xs font-semibold text-on-surface-variant block">
                                Kiểu so khớp PRINT
                              </span>
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
                                className="flex h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-highest/20 px-3 py-1 text-sm transition-all focus-visible:outline-none hover:border-outline focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-on-surface font-medium"
                              >
                                <option value="EXACT">EXACT</option>
                                <option value="CONTAINS">CONTAINS</option>
                              </select>
                            </label>
                          </div>
                        )}

                        <label className="space-y-1.5 flex flex-col">
                          <span className="text-xs font-semibold text-primary flex items-center gap-2 mb-2">
                            <Sparkles className="h-3.5 w-3.5" />
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
                          <div className="h-[260px] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container shadow-inner">
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
                            />
                          </div>
                        </label>

                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-xs font-semibold text-primary flex items-center gap-2 mb-2">
                            <Sparkles className="h-3.5 w-3.5" />
                            Invocation query
                          </label>
                          <div className="h-[180px] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container shadow-inner">
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
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-xs font-semibold text-primary flex items-center gap-2 mb-2">
                            <Sparkles className="h-3.5 w-3.5" />
                            Validation query
                            {tc.verification_type === 'PRINT_OUTPUT' && (
                              <span className="font-normal text-muted-foreground">
                                (có thể để trống)
                              </span>
                            )}
                          </label>
                          <div className="h-[180px] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container shadow-inner">
                            <TeacherSqlEditor
                              value={tc.validation_query ?? ''}
                              onChange={(value) =>
                                setTestCases((prev) =>
                                  prev.map((t, i) =>
                                    i === idx
                                      ? {
                                          ...t,
                                          validation_query: value || ''
                                        }
                                      : t
                                  )
                                )
                              }
                              height="100%"
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
        </div>
      )}

      {/* Step 3: Grading Rules */}
      {isRulesStep && (
        <div className="space-y-4">
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
              {questionType === 'FUNCTION' && (
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
              )}
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-foreground">
                    Tham số kỳ vọng
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {routineParameters.length} tham số
                  </span>
                </div>
                {routineParameters.length > 0 ? (
                  <div className="space-y-1">
                    {routineParameters.map((param, index) => (
                      <div
                        key={`${param.name || 'param'}-${index}`}
                        className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded bg-background px-2 py-1 text-xs"
                      >
                        <span className="font-mono">
                          {param.name || `@param${index + 1}`}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {param.expected_type || 'UNKNOWN'}
                        </span>
                        <span className="text-muted-foreground">
                          {param.expected_mode || 'IN'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chưa có tham số nào trong rubric.
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {questionType === 'STORED_PROCEDURE'
                  ? 'Backend dùng metadata routine từ rubric để kiểm tra tên, loại và số lượng tham số. Với stored procedure có test case, metadata chỉ là kiểm tra cấu trúc; điểm chấm lấy từ trọng số các test case.'
                  : 'Backend dùng metadata routine từ rubric để kiểm tra tên, loại và số lượng tham số. Với function, metadata vẫn tham gia điểm theo logic chấm routine hiện tại.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isRulesStep && (
        <div className="space-y-4">
          <WhiteboxRulesEditor
            questionType={questionType}
            totalPoints={totalPoints}
            rules={whitebox_rules}
            settings={whitebox_settings}
            onChange={setWhitebox}
            sqlForPreview={correctQuery}
          />

          <div className={styles.summary}>
            <div className={styles.summaryLeft}>
              <Equal className={styles.summaryIcon} />
              <span className={styles.summaryText}>
                Tổng trọng số test case:
              </span>
            </div>
            <span className={styles.summaryValue}>
              {testCaseWeightTotal.toFixed(2)} / 1.00
            </span>
          </div>

          {test_cases.length > 0 && (
            <div className="space-y-1 rounded-md border border-border/70 bg-muted/20 p-2">
              {test_cases.map((tc, index) => (
                <div
                  key={tc.case_id || index}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-background px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      TC {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 truncate text-foreground">
                      {tc.description ||
                        tc.case_name ||
                        `Test case ${index + 1}`}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={tc.score_weight ?? 0}
                    onChange={(e) =>
                      setTestCases((prev) =>
                        prev.map((t, i) =>
                          i === index
                            ? {
                                ...t,
                                score_weight: parseFloat(e.target.value) || 0
                              }
                            : t
                        )
                      )
                    }
                    className="w-24 rounded-md border border-border bg-background px-2 py-1 text-right font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
