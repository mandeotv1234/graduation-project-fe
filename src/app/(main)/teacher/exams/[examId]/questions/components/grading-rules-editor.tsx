'use client'

import React, { useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateGradingRubric } from '@/lib/actions'
import {
  GradingRuleAction,
  GradingRuleCondition,
  GradingRuleModifier,
  GradingRuleTarget,
  GradingRubric,
  InsertDataGradingRule
} from '@/lib/types'

type RuleQuestionType = 'CREATE_TABLE' | 'SELECT_QUERY'

interface GradingRulesEditorProps {
  questionType: RuleQuestionType
  totalPoints: number
  rules: InsertDataGradingRule[]
  onChange: (rules: InsertDataGradingRule[]) => void
  correctQuery?: string
  questionContent?: string
  contextSummary?: string
}

const ALL_TARGET_OPTIONS: Array<{ value: GradingRuleTarget; label: string }> = [
  { value: 'TABLE', label: 'Bảng' },
  { value: 'COLUMN', label: 'Cột' },
  { value: 'DATA_TYPE', label: 'Kiểu dữ liệu' },
  { value: 'PRIMARY_KEY', label: 'Khóa chính' },
  { value: 'FOREIGN_KEY', label: 'Khóa ngoại' },
  { value: 'CONSTRAINT_LOCAL', label: 'Ràng buộc cục bộ' },
  { value: 'COLUMN_ORDER', label: 'Thứ tự cột' },
  { value: 'ROW', label: 'Dòng dữ liệu' },
  { value: 'CELL_VALUE', label: 'Giá trị trong ô' },
  { value: 'ROW_ORDER', label: 'Thứ tự dòng' }
]

const CREATE_TARGET_OPTIONS: Array<{ value: GradingRuleTarget; label: string }> =
  ALL_TARGET_OPTIONS.filter((option) =>
    [
      'TABLE',
      'COLUMN',
      'DATA_TYPE',
      'PRIMARY_KEY',
      'FOREIGN_KEY',
      'CONSTRAINT_LOCAL',
      'COLUMN_ORDER'
    ].includes(option.value)
  )

const SELECT_TARGET_OPTIONS = ALL_TARGET_OPTIONS

const SELECT_CONDITION_OPTIONS: Record<
  GradingRuleTarget,
  Array<{ value: GradingRuleCondition; label: string }>
> = {
  TABLE: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'NOT_EQUAL', label: 'Không khớp đáp án' }
  ],
  COLUMN: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'NOT_EQUAL', label: 'Không khớp đáp án' },
    { value: 'OUT_OF_ORDER', label: 'Sai thứ tự' }
  ],
  DATA_TYPE: [
    { value: 'TYPE_MISMATCH', label: 'Sai kiểu dữ liệu' },
    { value: 'LENGTH_MISMATCH', label: 'Sai độ dài' },
    { value: 'NOT_EQUAL', label: 'Không khớp đáp án' }
  ],
  PRIMARY_KEY: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'NOT_EQUAL', label: 'Không khớp đáp án' }
  ],
  FOREIGN_KEY: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'REFERENCE_ERROR', label: 'Sai tham chiếu' }
  ],
  CONSTRAINT_LOCAL: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'NOT_EQUAL', label: 'Không khớp đáp án' }
  ],
  COLUMN_ORDER: [{ value: 'OUT_OF_ORDER', label: 'Sai thứ tự' }],
  ROW: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' }
  ],
  CELL_VALUE: [
    { value: 'NOT_EQUAL', label: 'Sai giá trị' },
    { value: 'IS_NULL', label: 'Giá trị rỗng' },
    { value: 'TYPE_MISMATCH', label: 'Sai kiểu dữ liệu' },
    { value: 'LENGTH_MISMATCH', label: 'Sai độ dài' }
  ],
  ROW_ORDER: [{ value: 'OUT_OF_ORDER', label: 'Sai thứ tự' }]
}

const CREATE_CONDITION_OPTIONS: Partial<
  Record<GradingRuleTarget, Array<{ value: GradingRuleCondition; label: string }>>
> = {
  TABLE: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'NOT_EQUAL', label: 'Không khớp đáp án' }
  ],
  COLUMN: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'NOT_EQUAL', label: 'Không khớp đáp án' }
  ],
  DATA_TYPE: [
    { value: 'TYPE_MISMATCH', label: 'Sai kiểu dữ liệu' },
    { value: 'LENGTH_MISMATCH', label: 'Sai độ dài' }
  ],
  PRIMARY_KEY: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'NOT_EQUAL', label: 'Không khớp đáp án' }
  ],
  FOREIGN_KEY: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'REFERENCE_ERROR', label: 'Sai tham chiếu' }
  ],
  CONSTRAINT_LOCAL: [
    { value: 'IS_MISSING', label: 'Bị thiếu' },
    { value: 'IS_EXTRA', label: 'Bị dư thừa' },
    { value: 'NOT_EQUAL', label: 'Không khớp đáp án' }
  ],
  COLUMN_ORDER: [{ value: 'OUT_OF_ORDER', label: 'Sai thứ tự' }]
}

const SELECT_MODIFIER_OPTIONS: Record<
  GradingRuleTarget,
  Array<{ value: GradingRuleModifier; label: string }>
> = {
  TABLE: [],
  COLUMN: [],
  DATA_TYPE: [
    { value: 'MATCH_FAMILY_TYPE', label: 'Khớp theo họ kiểu dữ liệu' }
  ],
  PRIMARY_KEY: [],
  FOREIGN_KEY: [],
  CONSTRAINT_LOCAL: [],
  COLUMN_ORDER: [
    { value: 'SORT_ASC', label: 'Sắp xếp tăng dần trước khi so khớp' }
  ],
  ROW: [{ value: 'SORT_ASC', label: 'Sắp xếp tăng dần trước khi so khớp' }],
  CELL_VALUE: [
    { value: 'TO_LOWERCASE', label: 'Bỏ qua hoa/thường' },
    { value: 'TRIM_WHITESPACE', label: 'Xóa khoảng trắng đầu/cuối' },
    { value: 'REMOVE_ALL_WHITESPACE', label: 'Xóa toàn bộ khoảng trắng' },
    { value: 'REMOVE_DIACRITICS', label: 'Bỏ qua dấu tiếng Việt' },
    { value: 'REMOVE_SPECIAL_CHARS', label: 'Xóa ký tự đặc biệt' },
    { value: 'CAST_TO_STRING', label: 'Ép kiểu về chuỗi' },
    { value: 'CAST_TO_FLOAT', label: 'Ép kiểu về số thực' },
    { value: 'ROUND_TO_INT', label: 'Làm tròn về số nguyên' },
    { value: 'ROUND_2_DECIMALS', label: 'Làm tròn 2 chữ số thập phân' }
  ],
  ROW_ORDER: [
    { value: 'SORT_ASC', label: 'Sắp xếp tăng dần trước khi so khớp' }
  ]
}

const CREATE_MODIFIER_OPTIONS: Partial<
  Record<GradingRuleTarget, Array<{ value: GradingRuleModifier; label: string }>>
> = {
  TABLE: [{ value: 'IGNORE_CASE', label: 'Bỏ qua hoa/thường tên bảng' }],
  COLUMN: [{ value: 'IGNORE_CASE', label: 'Bỏ qua hoa/thường tên cột' }],
  DATA_TYPE: [
    { value: 'MATCH_FAMILY_TYPE', label: 'Khớp theo họ kiểu dữ liệu' },
    { value: 'IGNORE_LENGTH', label: 'Bỏ qua kích thước kiểu dữ liệu' }
  ],
  PRIMARY_KEY: [
    {
      value: 'IGNORE_CONSTRAINT_NAME',
      label: 'Bỏ qua tên ràng buộc do sinh viên tự đặt'
    }
  ],
  FOREIGN_KEY: [
    {
      value: 'IGNORE_CONSTRAINT_NAME',
      label: 'Bỏ qua tên ràng buộc do sinh viên tự đặt'
    }
  ],
  CONSTRAINT_LOCAL: [
    {
      value: 'IGNORE_CONSTRAINT_NAME',
      label: 'Bỏ qua tên ràng buộc do sinh viên tự đặt'
    }
  ]
}

const ACTION_OPTIONS: Array<{ value: GradingRuleAction; label: string }> = [
  { value: 'DEDUCT_POINTS', label: 'Trừ điểm cố định' },
  { value: 'DEDUCT_PERCENTAGE', label: 'Trừ theo phần trăm' },
  { value: 'FAIL_ITEM', label: '0 điểm đối tượng hiện tại' },
  { value: 'FAIL_ALL', label: '0 điểm toàn bộ câu hỏi' },
  { value: 'IGNORE', label: 'Bỏ qua, không trừ điểm' }
]

const VALID_ACTIONS = new Set(ACTION_OPTIONS.map((opt) => opt.value))
const FAIL_ACTIONS = new Set<GradingRuleAction>(['FAIL_ITEM', 'FAIL_ALL', 'IGNORE'])

function toNumber(value: unknown, defaultValue: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return defaultValue
}

function getTargetOptions(questionType: RuleQuestionType) {
  return questionType === 'CREATE_TABLE'
    ? CREATE_TARGET_OPTIONS
    : SELECT_TARGET_OPTIONS
}

function getDefaultTarget(questionType: RuleQuestionType): GradingRuleTarget {
  return questionType === 'CREATE_TABLE' ? 'TABLE' : 'ROW'
}

function getConditionOptions(
  target: GradingRuleTarget,
  questionType: RuleQuestionType
) {
  const scopedOptions =
    questionType === 'CREATE_TABLE'
      ? CREATE_CONDITION_OPTIONS
      : SELECT_CONDITION_OPTIONS
  const fallbackTarget = getDefaultTarget(questionType)
  return (
    scopedOptions[target] ||
    scopedOptions[fallbackTarget] ||
    SELECT_CONDITION_OPTIONS[fallbackTarget]
  )
}

function getDefaultCondition(
  target: GradingRuleTarget,
  questionType: RuleQuestionType
): GradingRuleCondition {
  const options = getConditionOptions(target, questionType)
  return options[0]?.value || 'IS_MISSING'
}

function getModifierOptions(
  target: GradingRuleTarget,
  questionType: RuleQuestionType
) {
  const scopedOptions =
    questionType === 'CREATE_TABLE'
      ? CREATE_MODIFIER_OPTIONS
      : SELECT_MODIFIER_OPTIONS
  return scopedOptions[target] || []
}

function getConditionLabel(
  target: GradingRuleTarget,
  condition: GradingRuleCondition,
  questionType: RuleQuestionType
) {
  return (
    getConditionOptions(target, questionType).find(
      (opt) => opt.value === condition
    )?.label ||
    condition
  )
}

function getTargetLabel(target: GradingRuleTarget) {
  return ALL_TARGET_OPTIONS.find((opt) => opt.value === target)?.label || target
}

function getModifierLabel(
  target: GradingRuleTarget,
  modifier: GradingRuleModifier,
  questionType: RuleQuestionType
) {
  return (
    getModifierOptions(target, questionType).find(
      (opt) => opt.value === modifier
    )?.label ||
    modifier
  )
}

function getActionLabel(action?: GradingRuleAction) {
  if (!action) return 'Chưa cấu hình hành động'
  return ACTION_OPTIONS.find((opt) => opt.value === action)?.label || action
}

function buildRuleName(index: number) {
  return `RULE_${String(index + 1).padStart(2, '0')}`
}

function hasVietnameseDiacritics(value: string) {
  return /[\u00C0-\u1EF9]/u.test(value)
}

function extractColumnHintFromText(value: string) {
  const matched = value.match(/(?:c[oộ]t|column)\s+([A-Za-z_][A-Za-z0-9_]*)/iu)
  return matched?.[1] || ''
}

function buildFriendlyRuleName(
  rule: InsertDataGradingRule,
  questionType: RuleQuestionType,
  contextText = ''
) {
  const target = rule.target || getDefaultTarget(questionType)
  const condition =
    rule.condition || getDefaultCondition(target, questionType)

  const columnHint = extractColumnHintFromText(contextText)
  if (columnHint && target === 'CELL_VALUE') {
    return `${getConditionLabel(target, condition, questionType)} cột ${columnHint}`
  }

  return `${getConditionLabel(target, condition, questionType)} - ${getTargetLabel(target)}`
}

function ensureFriendlyRuleName(
  rule: InsertDataGradingRule,
  questionType: RuleQuestionType,
  contextText = ''
) {
  const ruleName =
    typeof rule.rule_name === 'string' ? rule.rule_name.trim() : ''

  if (isDescriptionOnlySpecialRule(rule)) {
    return rule
  }

  if (ruleName && hasVietnameseDiacritics(ruleName)) {
    return rule
  }

  return {
    ...rule,
    rule_name: buildFriendlyRuleName(rule, questionType, contextText)
  }
}

function isDescriptionOnlySpecialRule(rule: Partial<InsertDataGradingRule>) {
  const description =
    typeof rule.description === 'string' ? rule.description.trim() : ''
  if (!description) return false

  const hasStructuredFields =
    Boolean(rule.target) ||
    Boolean(rule.condition) ||
    Boolean(rule.action) ||
    (Array.isArray(rule.modifiers) && rule.modifiers.length > 0) ||
    typeof rule.penalty_value === 'number'

  return !hasStructuredFields
}

function normalizeRule(
  input: Partial<InsertDataGradingRule>,
  index: number,
  questionType: RuleQuestionType
): InsertDataGradingRule {
  const description =
    typeof input.description === 'string' ? input.description.trim() : ''

  if (isDescriptionOnlySpecialRule(input)) {
    return { description }
  }

  const targetOptions = getTargetOptions(questionType)
  const validTargets = new Set(targetOptions.map((option) => option.value))
  const defaultTarget = getDefaultTarget(questionType)

  const target = validTargets.has(input.target as GradingRuleTarget)
    ? (input.target as GradingRuleTarget)
    : defaultTarget

  const conditionOptions = getConditionOptions(target, questionType)
  const condition = conditionOptions.some((opt) => opt.value === input.condition)
    ? (input.condition as GradingRuleCondition)
    : getDefaultCondition(target, questionType)

  const action = VALID_ACTIONS.has(input.action as GradingRuleAction)
    ? (input.action as GradingRuleAction)
    : 'DEDUCT_POINTS'

  const validModifiers = new Set(
    getModifierOptions(target, questionType).map((modifier) => modifier.value)
  )
  const modifiers = Array.isArray(input.modifiers)
    ? input.modifiers.filter(
        (item): item is GradingRuleModifier =>
          validModifiers.has(item as GradingRuleModifier)
      )
    : []

  const penaltyValue = FAIL_ACTIONS.has(action)
    ? 0
    : Math.max(0, toNumber(input.penalty_value, 0.1))

  return {
    rule_name:
      typeof input.rule_name === 'string' && input.rule_name.trim().length > 0
        ? input.rule_name.trim()
        : typeof input.rule_id === 'string' && input.rule_id.trim().length > 0
          ? input.rule_id.trim()
          : buildRuleName(index),
    target,
    condition,
    modifiers,
    action,
    penalty_value: penaltyValue,
    ...(description ? { description } : {})
  }
}

function buildRuleSummary(rule: InsertDataGradingRule, questionType: RuleQuestionType) {
  const specialDescription =
    typeof rule.description === 'string' ? rule.description.trim() : ''

  if (specialDescription.length > 0 && isDescriptionOnlySpecialRule(rule)) {
    return specialDescription
  }

  const target = rule.target || getDefaultTarget(questionType)
  const condition =
    rule.condition || getDefaultCondition(target, questionType)
  const action = rule.action || 'DEDUCT_POINTS'
  const penaltyValue = Math.max(0, toNumber(rule.penalty_value, 0))
  const modifiers = Array.isArray(rule.modifiers) ? rule.modifiers : []

  const modifierText =
    modifiers.length > 0
      ? `, áp dụng: ${modifiers
          .map((modifier) => getModifierLabel(target, modifier, questionType))
          .join(', ')}`
      : ''

  let actionText = ''
  if (action === 'DEDUCT_POINTS') {
    actionText = `trừ ${penaltyValue} điểm`
  } else if (action === 'DEDUCT_PERCENTAGE') {
    actionText = `trừ ${penaltyValue}%`
  } else if (action === 'FAIL_ITEM') {
    actionText = 'đưa đối tượng hiện tại về 0 điểm'
  } else if (action === 'FAIL_ALL') {
    actionText = 'đưa toàn bộ câu hỏi về 0 điểm'
  } else {
    actionText = 'không trừ điểm'
  }

  return `Nếu phát hiện "${getConditionLabel(target, condition, questionType)}" trên "${getTargetLabel(target)}"${modifierText} thì ${actionText}.`
}

function extractPromptKeywords(prompt: string) {
  return Array.from(
    new Set(
      prompt
        .toLowerCase()
        .split(/[^\p{L}0-9_]+/u)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3)
    )
  )
}

function selectBestGeneratedRule(
  generatedRules: InsertDataGradingRule[],
  prompt: string
) {
  if (generatedRules.length === 0) return null

  const keywords = extractPromptKeywords(prompt)
  let best = generatedRules[0]
  let bestScore = Number.NEGATIVE_INFINITY

  generatedRules.forEach((rule, index) => {
    const blob = [
      rule.rule_name || '',
      rule.target || '',
      rule.condition || '',
      rule.action || '',
      Array.isArray(rule.modifiers) ? rule.modifiers.join(' ') : '',
      rule.description || ''
    ]
      .join(' ')
      .toLowerCase()

    const score =
      keywords.reduce(
        (sum, keyword) => (blob.includes(keyword) ? sum + 1 : sum),
        0
      ) - index * 0.01

    if (score > bestScore) {
      bestScore = score
      best = rule
    }
  })

  return best
}

export function GradingRulesEditor({
  questionType,
  totalPoints,
  rules,
  onChange,
  correctQuery,
  questionContent,
  contextSummary
}: GradingRulesEditorProps) {
  const defaultTarget = getDefaultTarget(questionType)
  const targetOptions = getTargetOptions(questionType)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGeneratingByAi, setIsGeneratingByAi] = useState(false)
  const [isGeneratingMultipleByAi, setIsGeneratingMultipleByAi] =
    useState(false)
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)
  const [specialMode, setSpecialMode] = useState(false)
  const [modalTab, setModalTab] = useState<'single' | 'multiple'>('single')
  const [modalPrompt, setModalPrompt] = useState('')
  const [multiPrompt, setMultiPrompt] = useState('')
  const [multiRuleCount, setMultiRuleCount] = useState(3)
  const [ruleDraft, setRuleDraft] = useState<InsertDataGradingRule>(
    normalizeRule(
      {
        target: defaultTarget,
        condition: 'IS_MISSING',
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        modifiers: []
      },
      0,
      questionType
    )
  )

  const normalizedRules = useMemo(
    () => rules.map((rule, idx) => normalizeRule(rule, idx, questionType)),
    [questionType, rules]
  )

  const draftTarget = ruleDraft.target || defaultTarget
  const draftCondition =
    ruleDraft.condition || getDefaultCondition(draftTarget, questionType)
  const draftAction = ruleDraft.action || 'DEDUCT_POINTS'
  const draftConditionOptions = getConditionOptions(draftTarget, questionType)
  const draftModifierOptions = getModifierOptions(draftTarget, questionType)

  const updateDraft = (
    updater: (current: InsertDataGradingRule) => Partial<InsertDataGradingRule>
  ) => {
    const normalizeIndex = editingRuleIndex ?? normalizedRules.length
    setRuleDraft((current) => {
      const merged = { ...current, ...updater(current) }
      const normalized = normalizeRule(merged, normalizeIndex, questionType)
      if (typeof merged.description === 'string') {
        return {
          ...normalized,
          description: merged.description
        }
      }
      return normalized
    })
  }

  const openAddModal = () => {
    setEditingRuleIndex(null)
    setSpecialMode(false)
    setModalTab('single')
    setModalPrompt('')
    setMultiPrompt('')
    setMultiRuleCount(3)
    setRuleDraft(
      normalizeRule(
        {
          rule_name: buildRuleName(normalizedRules.length),
          target: defaultTarget,
          condition: getDefaultCondition(defaultTarget, questionType),
          action: 'DEDUCT_POINTS',
          penalty_value: 0.1,
          modifiers: []
        },
        normalizedRules.length,
        questionType
      )
    )
    setIsModalOpen(true)
  }

  const openEditModal = (ruleIndex: number) => {
    const nextRule = normalizeRule(
      normalizedRules[ruleIndex],
      ruleIndex,
      questionType
    )
    setEditingRuleIndex(ruleIndex)
    setRuleDraft(nextRule)
    setSpecialMode(isDescriptionOnlySpecialRule(nextRule))
    setModalTab('single')
    setModalPrompt('')
    setMultiPrompt('')
    setMultiRuleCount(3)
    setIsModalOpen(true)
  }

  const removeRuleAt = (ruleIndex: number) => {
    onChange(normalizedRules.filter((_, idx) => idx !== ruleIndex))
  }

  const saveRule = () => {
    if (specialMode) {
      const description =
        typeof ruleDraft.description === 'string' ? ruleDraft.description.trim() : ''
      if (!description) {
        toast.error('Rule đặc biệt bắt buộc có mô tả')
        return
      }

      const next = [...normalizedRules]
      const specialRule: InsertDataGradingRule = { description }
      if (editingRuleIndex === null) {
        next.push(specialRule)
      } else {
        next[editingRuleIndex] = specialRule
      }
      onChange(next)
      setIsModalOpen(false)
      return
    }

    if (!(ruleDraft.rule_name || '').trim()) {
      toast.error('Vui lòng nhập tên quy tắc')
      return
    }

    const normalizeIndex = editingRuleIndex ?? normalizedRules.length
    const normalized = normalizeRule(ruleDraft, normalizeIndex, questionType)
    const next = [...normalizedRules]
    if (editingRuleIndex === null) {
      next.push(normalized)
    } else {
      next[editingRuleIndex] = normalized
    }

    onChange(next)
    setIsModalOpen(false)
  }

  const toggleModifier = (modifier: GradingRuleModifier) => {
    updateDraft((current) => {
      const currentModifiers = Array.isArray(current.modifiers)
        ? current.modifiers
        : []
      const checked = currentModifiers.includes(modifier)
      return {
        modifiers: checked
          ? currentModifiers.filter((item) => item !== modifier)
          : [...currentModifiers, modifier]
      }
    })
  }

  const buildAiQuestionContent = (
    teacherPrompt: string,
    mode: 'single' | 'multiple',
    requestedRuleCount = 1
  ) => {
    const existingRulesContext =
      normalizedRules.length === 0
        ? '- Chưa có quy tắc nào.'
        : normalizedRules
            .map((rule, index) => {
              if (isDescriptionOnlySpecialRule(rule)) {
                return `${index + 1}. [SPECIAL] ${rule.description || ''}`
              }
              const rowTarget = rule.target || defaultTarget
              return `${index + 1}. ${rule.rule_name || buildRuleName(index)} | target=${rowTarget} | condition=${rule.condition || getDefaultCondition(rowTarget, questionType)} | action=${rule.action || 'DEDUCT_POINTS'} | penalty=${toNumber(rule.penalty_value, 0)}`
            })
            .join('\n')

    const questionTypeConstraint =
      questionType === 'CREATE_TABLE'
        ? [
            '## Giới hạn Rule Engine cho CREATE_TABLE',
            '- Chỉ dùng target: TABLE, COLUMN, DATA_TYPE, PRIMARY_KEY, FOREIGN_KEY, CONSTRAINT_LOCAL, COLUMN_ORDER.',
            '- Chỉ dùng condition theo metadata: IS_MISSING, IS_EXTRA, NOT_EQUAL, TYPE_MISMATCH, LENGTH_MISMATCH, REFERENCE_ERROR, OUT_OF_ORDER.',
            '- Không dùng target liên quan dữ liệu như ROW, CELL_VALUE, ROW_ORDER.',
            '- Modifiers ưu tiên cho CREATE: IGNORE_CASE, MATCH_FAMILY_TYPE, IGNORE_CONSTRAINT_NAME, IGNORE_LENGTH.'
          ].join('\n')
        : [
            '## Rule Engine cho SELECT_QUERY',
            '- Có thể dùng cả target liên quan dữ liệu: ROW, CELL_VALUE, ROW_ORDER.'
          ].join('\n')

    const outputInstruction =
      mode === 'single'
        ? '- Chỉ trả về DUY NHẤT 1 rule phù hợp nhất theo prompt.'
        : `- Trả về CHÍNH XÁC ${requestedRuleCount} rule trong grading_rules.`

    return [
      questionContent?.trim()
        ? `## Ngữ cảnh đề bài\n${questionContent.trim()}`
        : '',
      contextSummary?.trim()
        ? `## Ngữ cảnh dữ liệu hiện tại\n${contextSummary.trim()}`
        : '',
      `## Yêu cầu giáo viên\n${teacherPrompt.trim()}`,
      `## Quy tắc hiện có\n${existingRulesContext}`,
      questionTypeConstraint,
      '## Năng lực JSON được phép',
      '- Rule thường: { rule_name, target, condition, modifiers, action, penalty_value, description }.',
      '- Rule đặc biệt: chỉ có { description } nếu là ngoại lệ nghiệp vụ khó biểu diễn.',
      outputInstruction,
      '- Mỗi rule cần đại diện cho một lỗi/điều kiện khác nhau, không lặp nội dung.',
      '- Ưu tiên tên quy tắc thân thiện tiếng Việt, ngắn gọn, có dấu.',
      '- Chỉ trả về JSON hợp lệ, không kèm giải thích ngoài JSON.'
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  const generateRuleByAi = async () => {
    if (!correctQuery?.trim()) {
      toast.error('Vui lòng nhập SQL đáp án trước khi dùng AI')
      return
    }
    if (!modalPrompt.trim()) {
      toast.error('Vui lòng nhập prompt trong modal trước khi dùng AI')
      return
    }
    const composedQuestionContent = buildAiQuestionContent(
      modalPrompt,
      'single',
      1
    )

    const aiQuestionType =
      questionType === 'CREATE_TABLE' ? 'INSERT_DATA' : questionType

    setIsGeneratingByAi(true)
    try {
      const result = await generateGradingRubric({
        correctQuery: correctQuery.trim(),
        questionContent: composedQuestionContent,
        totalPoints,
        questionType: aiQuestionType,
        enforceExactTotalPoints: true
      })

      if (!result.data) {
        toast.error(result.message || 'AI không thể tạo gợi ý quy tắc')
        return
      }

      const parsed: GradingRubric =
        typeof result.data === 'string' ? JSON.parse(result.data) : result.data
      const root = parsed as unknown as Record<string, unknown>
      const payload =
        root.grading_payload &&
        typeof root.grading_payload === 'object' &&
        !Array.isArray(root.grading_payload)
          ? (root.grading_payload as Record<string, unknown>)
          : root

      const rawGenerated = Array.isArray(payload.grading_rules)
        ? payload.grading_rules
        : Array.isArray(root.grading_rules)
          ? root.grading_rules
          : []

      const generatedRules = (rawGenerated as Partial<InsertDataGradingRule>[]).map(
        (rule, idx) => normalizeRule(rule, idx, questionType)
      )

      if (generatedRules.length === 0) {
        toast.error('AI chưa tạo được quy tắc phù hợp từ prompt hiện tại')
        return
      }

      const best = selectBestGeneratedRule(generatedRules, modalPrompt)
      if (!best) {
        toast.error('AI chưa tạo được quy tắc để điền vào modal')
        return
      }

      const normalizeIndex = editingRuleIndex ?? normalizedRules.length
      const nextDraft = normalizeRule(best, normalizeIndex, questionType)
      const draftWithFriendlyName = ensureFriendlyRuleName(
        nextDraft,
        questionType,
        [modalPrompt, nextDraft.description || ''].join(' ')
      )

      setRuleDraft(draftWithFriendlyName)
      setSpecialMode(isDescriptionOnlySpecialRule(draftWithFriendlyName))
      toast.success('AI đã điền nháp 1 quy tắc, kiểm tra lại rồi bấm Lưu.')
    } catch (error) {
      console.error('AI generate rule draft failed:', error)
      toast.error('Lỗi khi gọi AI. Vui lòng thử lại.')
    } finally {
      setIsGeneratingByAi(false)
    }
  }

  const generateMultipleRulesByAi = async () => {
    if (editingRuleIndex !== null) {
      toast.error('Tab tạo nhiều quy tắc chỉ dùng khi thêm mới.')
      return
    }

    if (!correctQuery?.trim()) {
      toast.error('Vui lòng nhập SQL đáp án trước khi dùng AI')
      return
    }

    if (!multiPrompt.trim()) {
      toast.error('Vui lòng nhập prompt cho tab tạo nhiều quy tắc')
      return
    }

    const requestedRuleCount = Math.min(10, Math.max(2, multiRuleCount))
    const composedQuestionContent = buildAiQuestionContent(
      multiPrompt,
      'multiple',
      requestedRuleCount
    )
    const aiQuestionType =
      questionType === 'CREATE_TABLE' ? 'INSERT_DATA' : questionType

    setIsGeneratingMultipleByAi(true)
    try {
      const result = await generateGradingRubric({
        correctQuery: correctQuery.trim(),
        questionContent: composedQuestionContent,
        totalPoints,
        questionType: aiQuestionType,
        enforceExactTotalPoints: true
      })

      if (!result.data) {
        toast.error(result.message || 'AI không thể tạo nhiều quy tắc')
        return
      }

      const parsed: GradingRubric =
        typeof result.data === 'string' ? JSON.parse(result.data) : result.data
      const root = parsed as unknown as Record<string, unknown>
      const payload =
        root.grading_payload &&
        typeof root.grading_payload === 'object' &&
        !Array.isArray(root.grading_payload)
          ? (root.grading_payload as Record<string, unknown>)
          : root

      const rawGenerated = Array.isArray(payload.grading_rules)
        ? payload.grading_rules
        : Array.isArray(root.grading_rules)
          ? root.grading_rules
          : []

      const nextStartIndex = normalizedRules.length
      const nextRules = (rawGenerated as Partial<InsertDataGradingRule>[])
        .slice(0, requestedRuleCount)
        .map((rule, idx) => {
          const normalized = normalizeRule(rule, nextStartIndex + idx, questionType)
          return ensureFriendlyRuleName(
            normalized,
            questionType,
            [multiPrompt, normalized.description || ''].join(' ')
          )
        })

      if (nextRules.length === 0) {
        toast.error('AI chưa tạo được quy tắc phù hợp từ prompt hiện tại')
        return
      }

      onChange([...normalizedRules, ...nextRules])
      setIsModalOpen(false)
      toast.success(`AI đã thêm ${nextRules.length} quy tắc vào danh sách.`)
    } catch (error) {
      console.error('AI generate multiple rules failed:', error)
      toast.error('Lỗi khi gọi AI. Vui lòng thử lại.')
    } finally {
      setIsGeneratingMultipleByAi(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-foreground">
          Quy tắc chấm điểm nâng cao ({normalizedRules.length})
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openAddModal}
          className="h-9 px-4 text-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Thêm quy tắc
        </Button>
      </div>

      {normalizedRules.length === 0 && (
        <div className="rounded-md border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
          Chưa có quy tắc nâng cao. Bạn có thể thêm thủ công hoặc dùng AI trong modal.
        </div>
      )}

      <div className="space-y-3">
        {normalizedRules.map((rule, idx) => {
          const title = isDescriptionOnlySpecialRule(rule)
            ? `Rule đặc biệt #${idx + 1}`
            : (rule.rule_name || buildRuleName(idx))

          return (
            <div
              key={`${rule.rule_name || 'special'}-${idx}`}
              className="rounded-md border border-border bg-sub-background p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-sub-primary">{title}</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {buildRuleSummary(rule, questionType)}
                  </p>
                  {!isDescriptionOnlySpecialRule(rule) && (
                    <p className="text-xs text-muted-foreground">
                      Hành động: {getActionLabel(rule.action)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5"
                    onClick={() => openEditModal(idx)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Sửa
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-destructive hover:text-destructive"
                    onClick={() => removeRuleAt(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[calc(100dvh-2rem)] overflow-hidden p-0 gap-0 flex flex-col">
          <Tabs
            value={modalTab}
            onValueChange={(value) =>
              setModalTab(value as 'single' | 'multiple')
            }
            className="flex-1 min-h-0 gap-0"
          >
            <DialogHeader className="space-y-2 px-4 pt-4 pb-2">
              <DialogTitle className="mb-0">
                {editingRuleIndex === null
                  ? 'Thêm quy tắc chấm điểm'
                  : 'Sửa quy tắc chấm điểm'}
              </DialogTitle>
              <DialogDescription>
                Dùng AI để điền nháp nhanh hoặc tự nhập tay để tinh chỉnh rule.
              </DialogDescription>

              <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger
                  value="single"
                  className="h-9 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 text-xs font-semibold data-[state=active]:border-sub-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Tạo 1 quy tắc
                </TabsTrigger>
                <TabsTrigger
                  value="multiple"
                  className="h-9 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 text-xs font-semibold data-[state=active]:border-sub-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Tạo nhiều quy tắc
                </TabsTrigger>
              </TabsList>
            </DialogHeader>

            <TabsContent
              value="single"
              className="mt-0 flex-1 min-h-0 space-y-3 overflow-y-auto px-4 py-3"
            >
              <div className="rounded-md border border-border bg-surface p-2.5 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Prompt cho AI
                </label>
                <textarea
                  value={modalPrompt}
                  onChange={(event) => setModalPrompt(event.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Thiếu bảng thì trừ 1 điểm, sai kiểu dữ liệu thì trừ 0.25 điểm."
                  className="w-full rounded-md border border-border bg-sub-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRuleByAi}
                    disabled={isGeneratingByAi}
                    className="gap-2"
                  >
                    {isGeneratingByAi ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        AI đang tạo quy tắc...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        AI điền nháp 1 quy tắc
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={specialMode}
                  onChange={(e) => setSpecialMode(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-sub-primary"
                />
                Rule đặc biệt
              </label>

              {!specialMode && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Tên quy tắc
                  </label>
                  <input
                    type="text"
                    value={ruleDraft.rule_name || ''}
                    onChange={(event) =>
                      updateDraft(() => ({ rule_name: event.target.value }))
                    }
                    placeholder="Ví dụ: Sai kiểu dữ liệu - Cột"
                    className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Mô tả / ghi chú
                </label>
                <textarea
                  value={ruleDraft.description || ''}
                  onChange={(event) =>
                    updateDraft(() => ({ description: event.target.value }))
                  }
                  rows={2}
                  placeholder="Mô tả quy tắc để giáo viên đọc nhanh"
                  className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                />
              </div>

              {!specialMode && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Đối tượng chấm
                      </label>
                      <select
                        value={draftTarget}
                        onChange={(event) => {
                          const nextTarget = event.target.value as GradingRuleTarget
                          updateDraft((current) => {
                            const nextConditionOptions = getConditionOptions(
                              nextTarget,
                              questionType
                            )
                            const nextCondition = nextConditionOptions.some(
                              (opt) => opt.value === current.condition
                            )
                              ? current.condition
                              : getDefaultCondition(nextTarget, questionType)

                            return {
                              target: nextTarget,
                              condition: nextCondition,
                              modifiers: []
                            }
                          })
                        }}
                        className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                      >
                        {targetOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Lỗi vi phạm
                      </label>
                      <select
                        value={draftCondition}
                        onChange={(event) =>
                          updateDraft(() => ({
                            condition: event.target.value as GradingRuleCondition
                          }))
                        }
                        className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                      >
                        {draftConditionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Hình thức xử lý
                      </label>
                      <select
                        value={draftAction}
                        onChange={(event) => {
                          const nextAction = event.target.value as GradingRuleAction
                          updateDraft((current) => {
                            const currentAction = current.action || 'DEDUCT_POINTS'
                            if (FAIL_ACTIONS.has(nextAction)) {
                              return { action: nextAction, penalty_value: 0 }
                            }
                            if (FAIL_ACTIONS.has(currentAction)) {
                              return {
                                action: nextAction,
                                penalty_value:
                                  nextAction === 'DEDUCT_PERCENTAGE' ? 50 : 0.1
                              }
                            }
                            return { action: nextAction }
                          })
                        }}
                        className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                      >
                        {ACTION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        {draftAction === 'DEDUCT_PERCENTAGE'
                          ? 'Tỷ lệ trừ (%)'
                          : 'Điểm trừ'}
                      </label>
                      <input
                        type="number"
                        value={Math.max(0, toNumber(ruleDraft.penalty_value, 0))}
                        onChange={(event) =>
                          updateDraft(() => ({
                            penalty_value: Math.max(0, Number(event.target.value))
                          }))
                        }
                        min={0}
                        max={draftAction === 'DEDUCT_PERCENTAGE' ? 100 : undefined}
                        step={draftAction === 'DEDUCT_PERCENTAGE' ? 1 : 0.01}
                        disabled={FAIL_ACTIONS.has(draftAction)}
                        className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Bộ tiền xử lý / châm chước
                    </p>
                    {draftModifierOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {draftModifierOptions.map((opt) => {
                          const checked =
                            Array.isArray(ruleDraft.modifiers) &&
                            ruleDraft.modifiers.includes(opt.value)

                          return (
                            <label
                              key={opt.value}
                              className="inline-flex items-center gap-2 rounded border border-border bg-card px-2.5 py-1.5 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleModifier(opt.value)}
                                className="h-3.5 w-3.5 rounded border-border accent-sub-primary"
                              />
                              {opt.label}
                            </label>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Đối tượng này không có modifier riêng.
                      </p>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent
              value="multiple"
              className="mt-0 flex-1 min-h-0 space-y-3 overflow-y-auto px-4 py-3"
            >
              {editingRuleIndex !== null ? (
                <div className="rounded-md border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                  Chế độ tạo nhiều quy tắc chỉ dùng khi thêm mới. Hãy đóng modal sửa
                  hiện tại và bấm Thêm quy tắc để dùng tab này.
                </div>
              ) : (
                <div className="rounded-md border border-border bg-surface p-2.5 space-y-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Prompt cho AI tạo nhiều quy tắc
                    </label>
                    <textarea
                      value={multiPrompt}
                      onChange={(event) => setMultiPrompt(event.target.value)}
                      rows={3}
                      placeholder="Ví dụ: Tạo bộ quy tắc cho lỗi thiếu bảng, thiếu cột, sai kiểu dữ liệu, sai khóa chính và sai khóa ngoại."
                      className="w-full rounded-md border border-border bg-sub-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateMultipleRulesByAi}
                        disabled={isGeneratingMultipleByAi}
                        className="gap-2"
                      >
                        {isGeneratingMultipleByAi ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            AI đang tạo nhiều quy tắc...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            AI tạo nhiều quy tắc
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t border-border bg-background px-4 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              {modalTab === 'multiple' ? 'Đóng' : 'Hủy'}
            </Button>
            {modalTab === 'single' && (
              <Button type="button" onClick={saveRule}>
                Lưu quy tắc
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
