'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Trash2,
  Settings2,
  Sparkles,
  Loader2,
  Pencil,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
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
import { buildInsertTablesFromAnswer, generateGradingRubric } from '@/lib/actions'
import {
  GradingRubric,
  InsertDataGradingRule,
  InsertDataExpectedDataset,
  GradingRuleTarget,
  GradingRuleCondition,
  GradingRuleModifier,
  GradingRuleAction
} from '@/lib/types'

const INSERT_RULE_TARGET_OPTIONS: Array<{
  value: GradingRuleTarget
  label: string
}> = [
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

const INSERT_RULE_CONDITION_OPTIONS: Record<
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

const INSERT_RULE_MODIFIER_OPTIONS: Record<
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

const INSERT_RULE_ACTION_OPTIONS: Array<{
  value: GradingRuleAction
  label: string
}> = [
  { value: 'DEDUCT_POINTS', label: 'Trừ điểm cố định' },
  { value: 'DEDUCT_PERCENTAGE', label: 'Trừ theo phần trăm' },
  { value: 'FAIL_ITEM', label: '0 điểm đối tượng hiện tại' },
  { value: 'FAIL_ALL', label: '0 điểm toàn bộ câu hỏi' },
  { value: 'IGNORE', label: 'Bỏ qua, không trừ điểm' }
]

const VALID_TARGETS = new Set(
  INSERT_RULE_TARGET_OPTIONS.map((option) => option.value)
)

const VALID_ACTIONS = new Set(
  INSERT_RULE_ACTION_OPTIONS.map((option) => option.value)
)

const FAIL_ACTIONS = new Set<GradingRuleAction>([
  'FAIL_ITEM',
  'FAIL_ALL',
  'IGNORE'
])

function toNumber(value: unknown, defaultValue: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return defaultValue
}

function getInsertRuleConditionOptions(target: GradingRuleTarget) {
  return INSERT_RULE_CONDITION_OPTIONS[target] || INSERT_RULE_CONDITION_OPTIONS.ROW
}

function getInsertRuleModifierOptions(target: GradingRuleTarget) {
  return INSERT_RULE_MODIFIER_OPTIONS[target] || []
}

function getTargetLabel(target: GradingRuleTarget) {
  return (
    INSERT_RULE_TARGET_OPTIONS.find((option) => option.value === target)?.label ||
    target
  )
}

function getConditionLabel(
  target: GradingRuleTarget,
  condition: GradingRuleCondition
) {
  return (
    getInsertRuleConditionOptions(target).find(
      (option) => option.value === condition
    )?.label || condition
  )
}

function getActionLabel(action?: GradingRuleAction) {
  if (!action) {
    return 'Chưa cấu hình hành động'
  }

  return (
    INSERT_RULE_ACTION_OPTIONS.find((option) => option.value === action)?.label ||
    action
  )
}

function getModifierLabel(target: GradingRuleTarget, modifier: GradingRuleModifier) {
  return (
    getInsertRuleModifierOptions(target).find(
      (option) => option.value === modifier
    )?.label || modifier
  )
}

function formatPenaltyValue(value: number) {
  const rounded = Number(value.toFixed(4))
  return `${rounded}`
}

function buildInsertRuleName(index: number) {
  return `RULE_${String(index + 1).padStart(2, '0')}`
}

function isTechnicalRuleName(ruleName: string) {
  return /^RULE_[A-Z0-9_]+$/.test(ruleName.trim().toUpperCase())
}

function hasVietnameseDiacritics(value: string) {
  return /[\u00C0-\u1EF9]/u.test(value)
}

function isLikelyUnfriendlyRuleName(ruleName: string) {
  const normalized = normalizeForPromptMatching(ruleName)
  const looksLikeAsciiVietnamese =
    normalized.includes('sai gia tri') ||
    normalized.includes('khong khop') ||
    normalized.includes('tru diem') ||
    normalized.includes('thieu') ||
    normalized.includes('du')

  return (
    isTechnicalRuleName(ruleName) ||
    (looksLikeAsciiVietnamese && !hasVietnameseDiacritics(ruleName))
  )
}

function extractColumnHintFromText(value: string) {
  const matched = value.match(/(?:c[oộ]t|column)\s+([A-Za-z_][A-Za-z0-9_]*)/iu)
  return matched?.[1] || ''
}

function inferAllowedModifiersFromPrompt(prompt: string) {
  const normalized = normalizeForPromptMatching(prompt)
  const allowed = new Set<GradingRuleModifier>()

  const hasLenientIntent =
    normalized.includes('sai nhieu qua') ||
    normalized.includes('sai nhieu') ||
    normalized.includes('cham chuoc') ||
    normalized.includes('linh hoat') ||
    normalized.includes('de tinh') ||
    normalized.includes('khong qua nghiem') ||
    normalized.includes('gan dung')

  if (hasLenientIntent) {
    allowed.add('TO_LOWERCASE')
    allowed.add('REMOVE_DIACRITICS')
    allowed.add('TRIM_WHITESPACE')
  }

  if (
    normalized.includes('hoa thuong') ||
    normalized.includes('khong phan biet hoa') ||
    normalized.includes('chu hoa') ||
    normalized.includes('chu thuong')
  ) {
    allowed.add('TO_LOWERCASE')
  }

  if (
    normalized.includes('khoang trang dau') ||
    normalized.includes('khoang trang cuoi') ||
    normalized.includes('trim')
  ) {
    allowed.add('TRIM_WHITESPACE')
  }

  if (
    normalized.includes('toan bo khoang trang') ||
    normalized.includes('xoa het khoang trang') ||
    normalized.includes('bo het khoang trang')
  ) {
    allowed.add('REMOVE_ALL_WHITESPACE')
  }

  if (
    normalized.includes('bo dau') ||
    normalized.includes('khong dau') ||
    normalized.includes('dau tieng viet') ||
    normalized.includes('chinh ta')
  ) {
    allowed.add('REMOVE_DIACRITICS')
  }

  if (
    normalized.includes('ky tu dac biet') ||
    normalized.includes('special char')
  ) {
    allowed.add('REMOVE_SPECIAL_CHARS')
  }

  if (
    (normalized.includes('ep kieu') || normalized.includes('cast')) &&
    (normalized.includes('chuoi') || normalized.includes('string'))
  ) {
    allowed.add('CAST_TO_STRING')
  }

  if (
    (normalized.includes('ep kieu') || normalized.includes('cast')) &&
    (normalized.includes('so thuc') || normalized.includes('float'))
  ) {
    allowed.add('CAST_TO_FLOAT')
  }

  if (normalized.includes('lam tron') && normalized.includes('so nguyen')) {
    allowed.add('ROUND_TO_INT')
  }

  if (
    normalized.includes('lam tron') &&
    normalized.includes('2') &&
    (normalized.includes('thap phan') || normalized.includes('chu so'))
  ) {
    allowed.add('ROUND_2_DECIMALS')
  }

  if (normalized.includes('sap xep') || normalized.includes('thu tu')) {
    allowed.add('SORT_ASC')
  }

  if (
    normalized.includes('ho kieu du lieu') ||
    normalized.includes('family type')
  ) {
    allowed.add('MATCH_FAMILY_TYPE')
  }

  return allowed
}

function buildFriendlyRuleName(
  rule: Partial<InsertDataGradingRule>,
  contextText = ''
) {
  if (isDescriptionOnlySpecialRule(rule)) {
    return 'Ghi chú đặc biệt'
  }

  const target = VALID_TARGETS.has(rule.target as GradingRuleTarget)
    ? (rule.target as GradingRuleTarget)
    : 'ROW'
  const conditionOptions = getInsertRuleConditionOptions(target)
  const condition = conditionOptions.some(
    (option) => option.value === rule.condition
  )
    ? (rule.condition as GradingRuleCondition)
    : conditionOptions[0].value

  const columnHint = extractColumnHintFromText(contextText)
  if (columnHint && target === 'CELL_VALUE') {
    return `${getConditionLabel(target, condition)} cột ${columnHint}`
  }

  return `${getConditionLabel(target, condition)} - ${getTargetLabel(target)}`
}

function isDescriptionOnlySpecialRule(rule: Partial<InsertDataGradingRule>) {
  const description =
    typeof rule.description === 'string' ? rule.description.trim() : ''
  if (!description) {
    return false
  }

  const hasStructuredFields =
    Boolean(rule.target) ||
    Boolean(rule.condition) ||
    Boolean(rule.action) ||
    (Array.isArray(rule.modifiers) && rule.modifiers.length > 0) ||
    typeof rule.penalty_value === 'number'

  return !hasStructuredFields
}

const PROMPT_STOP_WORDS = new Set([
  'va',
  'voi',
  'cho',
  'cua',
  'la',
  'thi',
  'mot',
  'nhung',
  'khong',
  'can',
  'quan',
  'tam',
  'cham',
  'diem',
  'phan',
  'cot',
  'truong',
  'du',
  'lieu',
  'theo',
  'de',
  'tu',
  'do'
])

function normalizeForPromptMatching(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
}

function extractPromptKeywords(prompt: string) {
  const normalizedPrompt = normalizeForPromptMatching(prompt)

  return Array.from(
    new Set(
      normalizedPrompt
        .split(/[^a-z0-9_]+/)
        .map((token) => token.trim())
        .filter(
          (token) => token.length >= 3 && !PROMPT_STOP_WORDS.has(token)
        )
    )
  )
}

function selectBestGeneratedRule(
  generatedRules: InsertDataGradingRule[],
  modalPrompt: string,
  preferredRuleName: string
): InsertDataGradingRule | null {
  if (generatedRules.length === 0) {
    return null
  }

  const preferredName = preferredRuleName.trim()
  if (preferredName) {
    const matchedByName = generatedRules.find(
      (rule) => (rule.rule_name || '').trim() === preferredName
    )
    if (matchedByName) {
      return matchedByName
    }
  }

  const normalizedPrompt = normalizeForPromptMatching(modalPrompt)
  const promptKeywords = extractPromptKeywords(modalPrompt)
  const wantsExceptionRule =
    normalizedPrompt.includes('bo qua') ||
    normalizedPrompt.includes('khong quan tam') ||
    normalizedPrompt.includes('khong cham') ||
    normalizedPrompt.includes('ignore')

  let bestRule = generatedRules[0]
  let bestScore = Number.NEGATIVE_INFINITY

  generatedRules.forEach((rule, index) => {
    const searchBlob = normalizeForPromptMatching(
      [
        rule.rule_name || '',
        rule.target || '',
        rule.condition || '',
        rule.action || '',
        Array.isArray(rule.modifiers) ? rule.modifiers.join(' ') : '',
        rule.description || ''
      ].join(' ')
    )

    let score = 0

    for (const keyword of promptKeywords) {
      if (searchBlob.includes(keyword)) {
        score += 2
      }
    }

    if (wantsExceptionRule) {
      if (isDescriptionOnlySpecialRule(rule)) {
        score += 8
      }
      if (rule.action === 'IGNORE') {
        score += 6
      }
      if (rule.action === 'DEDUCT_POINTS' || rule.action === 'DEDUCT_PERCENTAGE') {
        score -= 1
      }
    }

    if (!isDescriptionOnlySpecialRule(rule)) {
      score += 1
    }

    score -= index * 0.01

    if (score > bestScore) {
      bestScore = score
      bestRule = rule
    }
  })

  return bestRule
}

function normalizeInsertRule(
  rule: Partial<InsertDataGradingRule>,
  index: number
): InsertDataGradingRule {
  const description =
    typeof rule.description === 'string' ? rule.description.trim() : ''

  if (isDescriptionOnlySpecialRule(rule)) {
    return {
      description
    }
  }

  const target = VALID_TARGETS.has(rule.target as GradingRuleTarget)
    ? (rule.target as GradingRuleTarget)
    : 'ROW'

  const conditionOptions = getInsertRuleConditionOptions(target)
  const condition = conditionOptions.some(
    (option) => option.value === rule.condition
  )
    ? (rule.condition as GradingRuleCondition)
    : conditionOptions[0].value

  const action = VALID_ACTIONS.has(rule.action as GradingRuleAction)
    ? (rule.action as GradingRuleAction)
    : 'DEDUCT_POINTS'

  const modifierOptions = getInsertRuleModifierOptions(target)
  const validModifierSet = new Set(modifierOptions.map((option) => option.value))

  const modifiers = Array.isArray(rule.modifiers)
    ? rule.modifiers.filter(
        (modifier): modifier is GradingRuleModifier =>
          validModifierSet.has(modifier as GradingRuleModifier)
      )
    : []

  const penaltyValue = FAIL_ACTIONS.has(action)
    ? 0
    : Math.max(0, toNumber(rule.penalty_value, 0.1))

  const normalizedRuleName =
    typeof rule.rule_name === 'string' && rule.rule_name.trim().length > 0
      ? rule.rule_name.trim()
      : typeof rule.rule_id === 'string' && rule.rule_id.trim().length > 0
        ? rule.rule_id.trim()
        : buildInsertRuleName(index)

  return {
    rule_name: normalizedRuleName,
    target,
    condition,
    modifiers,
    action,
    penalty_value: penaltyValue,
    ...(description ? { description } : {})
  }
}

function createDefaultInsertRule(index: number): InsertDataGradingRule {
  return normalizeInsertRule(
    {
      rule_name: buildInsertRuleName(index),
      target: 'ROW',
      condition: 'IS_MISSING',
      modifiers: [],
      action: 'DEDUCT_POINTS',
      penalty_value: 0.1
    },
    index
  )
}

function createDefaultInsertRules(): InsertDataGradingRule[] {
  return [
    normalizeInsertRule(
      {
        rule_name: 'RULE_MISSING_ROW',
        target: 'ROW',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.25
      },
      0
    ),
    normalizeInsertRule(
      {
        rule_name: 'RULE_CELL_VALUE_TOLERANT',
        target: 'CELL_VALUE',
        condition: 'NOT_EQUAL',
        modifiers: ['TO_LOWERCASE', 'REMOVE_DIACRITICS'],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1
      },
      1
    )
  ]
}

function deriveTables(
  payload: Record<string, unknown>,
  root: Record<string, unknown>
): InsertDataExpectedDataset[] {
  if (Array.isArray(payload.tables)) {
    return payload.tables as InsertDataExpectedDataset[]
  }

  if (Array.isArray(root.tables)) {
    return root.tables as InsertDataExpectedDataset[]
  }

  const legacyDatasets = Array.isArray(payload.expected_datasets)
    ? payload.expected_datasets
    : Array.isArray(root.expected_datasets)
      ? root.expected_datasets
      : null

  if (!Array.isArray(legacyDatasets)) {
    return []
  }

  return legacyDatasets.map((rawDataset) => {
    const dataset = rawDataset as Record<string, unknown>
    const rows = Array.isArray(dataset.rows) ? dataset.rows : []
    const columnsToGrade = Array.isArray(dataset.columns_to_grade)
      ? dataset.columns_to_grade
      : []
    const primaryKeys = new Set(
      Array.isArray(dataset.primary_keys) ? dataset.primary_keys : []
    )

    return {
      table_name: String(dataset.table_name || ''),
      table_points: toNumber(dataset.table_points, 0),
      row_grading_strategy: 'PARTIAL_BY_COLUMN',
      missing_row_penalty: Math.max(0, toNumber(dataset.points_per_row, 0)),
      columns_config: columnsToGrade.map((columnName) => {
        const safeName = String(columnName || '').trim()
        return {
          name: safeName,
          is_primary_key: primaryKeys.has(safeName),
          is_graded: true,
          points: 0,
          match_type: 'EXACT'
        }
      }),
      expected_data: rows as InsertDataExpectedDataset['expected_data']
    }
  })
}

function createDefaultRubric(totalPoints: number): GradingRubric {
  return {
    total_points: totalPoints,
    question_category: 'INSERT_DATA',
    grading_payload: {
      grading_rules: createDefaultInsertRules(),
      tables: []
    }
  }
}

function normalizeInsertRubric(
  rubric: GradingRubric,
  totalPoints: number
): GradingRubric {
  const root = rubric as unknown as Record<string, unknown>
  const payload = (rubric.grading_payload || {}) as Record<string, unknown>

  const tables = deriveTables(payload, root)

  const rawRules = Array.isArray(payload.grading_rules)
    ? payload.grading_rules
    : Array.isArray(root.grading_rules)
      ? root.grading_rules
      : createDefaultInsertRules()

  const gradingRules = (rawRules as Partial<InsertDataGradingRule>[]).map(
    (rule, index) => normalizeInsertRule(rule, index)
  )

  return {
    ...rubric,
    total_points: totalPoints,
    question_category: 'INSERT_DATA',
    grading_payload: {
      grading_rules: gradingRules,
      tables
    }
  }
}

function buildRuleSummarySentence(rule: InsertDataGradingRule) {
  const specialDescription =
    typeof rule.description === 'string' ? rule.description.trim() : ''

  if (specialDescription.length > 0) {
    return specialDescription
  }

  const target = rule.target || 'ROW'
  const condition =
    rule.condition || getInsertRuleConditionOptions(target)[0].value
  const action = rule.action || 'DEDUCT_POINTS'
  const penaltyValue = Math.max(0, toNumber(rule.penalty_value, 0))
  const modifiers = Array.isArray(rule.modifiers) ? rule.modifiers : []

  const targetLabel = getTargetLabel(target)
  const conditionLabel = getConditionLabel(target, condition)

  const modifierText =
    modifiers.length > 0
      ? `, áp dụng: ${modifiers
          .map((modifier) => getModifierLabel(target, modifier))
          .join(', ')}`
      : ''

  let actionText = ''
  if (action === 'DEDUCT_POINTS') {
    actionText = `trừ ${formatPenaltyValue(penaltyValue)} điểm`
  } else if (action === 'DEDUCT_PERCENTAGE') {
    actionText = `trừ ${formatPenaltyValue(penaltyValue)}%`
  } else if (action === 'FAIL_ITEM') {
    actionText = 'đưa đối tượng hiện tại về 0 điểm'
  } else if (action === 'FAIL_ALL') {
    actionText = 'đưa toàn bộ câu hỏi về 0 điểm'
  } else {
    actionText = 'không trừ điểm'
  }

  const summary = `Nếu phát hiện "${conditionLabel}" trên "${targetLabel}"${modifierText} thì ${actionText}.`

  return summary
}

function normalizeAiGeneratedRuleForEditor(
  aiRuleSource: InsertDataGradingRule,
  index: number,
  modalPrompt: string
): InsertDataGradingRule {
  const normalizedRule = normalizeInsertRule(aiRuleSource, index)

  const allowedModifiers = inferAllowedModifiersFromPrompt(modalPrompt)
  const currentModifiers = Array.isArray(normalizedRule.modifiers)
    ? normalizedRule.modifiers
    : []

  let promptConstrainedModifiers: GradingRuleModifier[] = []
  if (allowedModifiers.size > 0) {
    promptConstrainedModifiers = currentModifiers.filter((modifier) =>
      allowedModifiers.has(modifier)
    )

    if (promptConstrainedModifiers.length === 0) {
      const target = normalizedRule.target || 'ROW'
      const availableTargetModifiers = getInsertRuleModifierOptions(target).map(
        (option) => option.value
      )

      promptConstrainedModifiers = availableTargetModifiers.filter((modifier) =>
        allowedModifiers.has(modifier)
      )
    }
  }

  const promptConstrainedRule = normalizeInsertRule(
    {
      ...normalizedRule,
      modifiers: promptConstrainedModifiers
    },
    index
  )

  if (isDescriptionOnlySpecialRule(promptConstrainedRule)) {
    const specialDescription =
      typeof promptConstrainedRule.description === 'string'
        ? promptConstrainedRule.description.trim()
        : ''

    return {
      description:
        specialDescription || 'Quy tắc đặc biệt theo yêu cầu giáo viên.'
    }
  }

  const currentRuleName =
    typeof promptConstrainedRule.rule_name === 'string'
      ? promptConstrainedRule.rule_name.trim()
      : ''

  const namingContext = [
    modalPrompt,
    currentRuleName,
    promptConstrainedRule.description || ''
  ].join(' ')

  const friendlyRuleName =
    !currentRuleName || isLikelyUnfriendlyRuleName(currentRuleName)
      ? buildFriendlyRuleName(promptConstrainedRule, namingContext)
      : currentRuleName

  const currentDescription =
    typeof promptConstrainedRule.description === 'string'
      ? promptConstrainedRule.description.trim()
      : ''

  return {
    ...promptConstrainedRule,
    rule_name: friendlyRuleName,
    description:
      currentDescription ||
      buildRuleSummarySentence({
        ...promptConstrainedRule,
        rule_name: friendlyRuleName
      })
  }
}

interface InsertDataRubricEditorProps {
  examId: number
  totalPoints: number
  rubric: GradingRubric | null
  onChange: (rubric: GradingRubric) => void
  correctQuery?: string
  questionContent?: string
}

export function InsertDataRubricEditor({
  examId,
  totalPoints,
  rubric,
  onChange,
  correctQuery,
  questionContent
}: InsertDataRubricEditorProps) {
  const currentRubric = normalizeInsertRubric(
    rubric ?? createDefaultRubric(totalPoints),
    totalPoints
  )

  const payload = (currentRubric.grading_payload || {}) as Record<string, unknown>
  const gradingRules = Array.isArray(payload.grading_rules)
    ? (payload.grading_rules as InsertDataGradingRule[])
    : []
  const tables = Array.isArray(payload.tables)
    ? (payload.tables as InsertDataExpectedDataset[])
    : []

  const updateRubric = useCallback(
    (updater: (draft: GradingRubric) => GradingRubric) => {
      const next = updater({ ...currentRubric })
      onChange(normalizeInsertRubric(next, totalPoints))
    },
    [currentRubric, onChange, totalPoints]
  )

  const setGradingRules = (newRules: InsertDataGradingRule[]) => {
    updateRubric((r) => ({
      ...r,
      total_points: totalPoints,
      grading_payload: (() => {
        const currentPayload =
          (r.grading_payload as Record<string, unknown>) || {}
        const currentTables = Array.isArray(currentPayload.tables)
          ? (currentPayload.tables as InsertDataExpectedDataset[])
          : []

        return {
          grading_rules: newRules.map((rule, idx) => normalizeInsertRule(rule, idx)),
          tables: currentTables
        }
      })()
    }))
  }

  const setTables = (newTables: InsertDataExpectedDataset[]) => {
    updateRubric((r) => ({
      ...r,
      total_points: totalPoints,
      grading_payload: (() => {
        const currentPayload =
          (r.grading_payload as Record<string, unknown>) || {}
        const currentRules = Array.isArray(currentPayload.grading_rules)
          ? (currentPayload.grading_rules as InsertDataGradingRule[])
          : []

        return {
          grading_rules: currentRules.map((rule, idx) => normalizeInsertRule(rule, idx)),
          tables: newTables
        }
      })()
    }))
  }

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)
  const [ruleDraft, setRuleDraft] = useState<InsertDataGradingRule>(
    createDefaultInsertRule(0)
  )
  const [modalPrompt, setModalPrompt] = useState('')
  const [isGeneratingByAi, setIsGeneratingByAi] = useState(false)
  const [isBuildingTables, setIsBuildingTables] = useState(false)
  const [showAdvancedJson, setShowAdvancedJson] = useState(false)
  const [advancedJsonText, setAdvancedJsonText] = useState('')

  const draftTarget = ruleDraft.target || 'ROW'
  const draftAction = ruleDraft.action || 'DEDUCT_POINTS'
  const isSpecialRuleDraft = isDescriptionOnlySpecialRule(ruleDraft)
  const draftCondition =
    ruleDraft.condition || getInsertRuleConditionOptions(draftTarget)[0].value
  const draftConditionOptions = getInsertRuleConditionOptions(draftTarget)
  const draftModifierOptions = getInsertRuleModifierOptions(draftTarget)

  const expectedJsonPreview = useMemo(
    () => ({
      question_category: 'INSERT_DATA',
      total_points: totalPoints,
      grading_rules: gradingRules.map((rule) => {
        const specialDescription =
          typeof rule.description === 'string' ? rule.description.trim() : ''

        if (isDescriptionOnlySpecialRule(rule) && specialDescription.length > 0) {
          return {
            description: specialDescription
          }
        }

        const previewRule: Record<string, unknown> = {
          rule_name: rule.rule_name
        }

        if (rule.target) previewRule.target = rule.target
        if (rule.condition) previewRule.condition = rule.condition
        if (Array.isArray(rule.modifiers)) previewRule.modifiers = rule.modifiers
        if (rule.action) previewRule.action = rule.action
        if (typeof rule.penalty_value === 'number') {
          previewRule.penalty_value = rule.penalty_value
        }
        if (typeof rule.description === 'string' && rule.description.trim()) {
          previewRule.description = rule.description.trim()
        }

        return previewRule
      }),
      tables
    }),
    [totalPoints, gradingRules, tables]
  )

  useEffect(() => {
    setAdvancedJsonText(JSON.stringify(expectedJsonPreview, null, 2))
  }, [expectedJsonPreview])

  const openAddRuleModal = () => {
    setEditingRuleIndex(null)
    setRuleDraft(createDefaultInsertRule(gradingRules.length))
    setModalPrompt('')
    setIsRuleModalOpen(true)
  }

  const openEditRuleModal = (ruleIndex: number) => {
    setEditingRuleIndex(ruleIndex)
    setRuleDraft(normalizeInsertRule(gradingRules[ruleIndex], ruleIndex))
    setModalPrompt('')
    setIsRuleModalOpen(true)
  }

  const removeGradingRuleAt = (ruleIndex: number) => {
    setGradingRules(gradingRules.filter((_, idx) => idx !== ruleIndex))
  }

  const updateRuleDraft = (
    updater: (current: InsertDataGradingRule) => Partial<InsertDataGradingRule>
  ) => {
    const normalizeIndex = editingRuleIndex ?? gradingRules.length
    setRuleDraft((current) => {
      const mergedDraft = { ...current, ...updater(current) }
      const normalizedDraft = normalizeInsertRule(mergedDraft, normalizeIndex)

      // Keep raw description while typing so spaces are not stripped in the textarea.
      if (typeof mergedDraft.description === 'string') {
        return {
          ...normalizedDraft,
          description: mergedDraft.description
        }
      }

      return normalizedDraft
    })
  }

  const handleDraftTargetChange = (target: GradingRuleTarget) => {
    updateRuleDraft((current) => {
      const nextConditionOptions = getInsertRuleConditionOptions(target)
      const nextCondition = nextConditionOptions.some(
        (option) => option.value === current.condition
      )
        ? current.condition
        : nextConditionOptions[0].value

      return {
        target,
        condition: nextCondition,
        modifiers: []
      }
    })
  }

  const handleDraftActionChange = (action: GradingRuleAction) => {
    updateRuleDraft((current) => {
      const currentAction = current.action || 'DEDUCT_POINTS'

      if (FAIL_ACTIONS.has(action)) {
        return { action, penalty_value: 0 }
      }

      if (FAIL_ACTIONS.has(currentAction)) {
        return {
          action,
          penalty_value: action === 'DEDUCT_PERCENTAGE' ? 50 : 0.1
        }
      }

      return { action }
    })
  }

  const toggleDraftModifier = (modifier: GradingRuleModifier) => {
    updateRuleDraft((current) => {
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

  const handleGenerateRuleByAi = async () => {
    if (!correctQuery?.trim()) {
      toast.error('Vui lòng nhập SQL đáp án trước khi dùng AI')
      return
    }

    if (!modalPrompt.trim()) {
      toast.error('Vui lòng nhập prompt trong modal trước khi dùng AI')
      return
    }

    const existingRulesContext =
      gradingRules.length === 0
        ? '- Chưa có quy tắc nào.'
        : gradingRules
            .map((rule, index) => {
              const specialDescription =
                typeof rule.description === 'string' ? rule.description.trim() : ''
              if (isDescriptionOnlySpecialRule(rule) && specialDescription.length > 0) {
                return `${index + 1}. [SPECIAL] description="${specialDescription}"`
              }

              return `${index + 1}. ${rule.rule_name || `RULE_${index + 1}`} | target=${rule.target || 'ROW'} | condition=${rule.condition || 'IS_MISSING'} | action=${rule.action || 'DEDUCT_POINTS'} | penalty=${Math.max(0, toNumber(rule.penalty_value, 0))}`
            })
            .join('\n')

    const tableContext =
      tables.length === 0
        ? '- Chưa có cấu hình bảng nào.'
        : tables
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

    const composedQuestionContent = [
      questionContent?.trim()
        ? `## Ngữ cảnh đề bài\n${questionContent.trim()}`
        : '',
      `## Yêu cầu giáo viên\n${modalPrompt.trim()}`,
      `## Quy tắc hiện có\n${existingRulesContext}`,
      `## Cấu hình bảng hiện có\n${tableContext}`,
      '## Năng lực JSON bạn được phép tận dụng',
      '- Rule thường: { rule_name, target, condition, modifiers, action, penalty_value }.',
      '- Rule đặc biệt: chỉ có { description } cho các ràng buộc nghiệp vụ khó biểu diễn bằng rule thường.',
      '- Với rule thường: luôn điền thêm description bằng tiếng Việt dễ hiểu cho giáo viên.',
      '- rule_name phải thân thiện, ngắn gọn (ưu tiên tiếng Việt có dấu), KHÔNG dùng mẫu RULE_... dài và khó đọc. VD: Sai giá trị - Giá trị trong ô',
      '- modifiers chỉ được thêm khi prompt nêu rõ. Nếu prompt không yêu cầu, để modifiers = [].',
      '- target hỗ trợ: TABLE, COLUMN, DATA_TYPE, PRIMARY_KEY, FOREIGN_KEY, CONSTRAINT_LOCAL, COLUMN_ORDER, ROW, CELL_VALUE, ROW_ORDER.',
      '- condition hỗ trợ: IS_MISSING, IS_EXTRA, IS_NULL, NOT_EQUAL, OUT_OF_ORDER, TYPE_MISMATCH, LENGTH_MISMATCH, REFERENCE_ERROR.',
      '- action hỗ trợ: DEDUCT_POINTS, DEDUCT_PERCENTAGE, FAIL_ITEM, FAIL_ALL, IGNORE.',
      '## Decision framework bắt buộc',
      '1) Ưu tiên rule thường nếu biểu diễn được chính xác yêu cầu.',
      '2) Nếu yêu cầu là ngoại lệ nghiệp vụ khó map bằng target/condition/action/modifiers thì dùng rule đặc biệt description-only.',
      '3) Không tạo nhiều rule. Chỉ trả về DUY NHẤT 1 rule phù hợp nhất với yêu cầu giáo viên.',
      '4) Không chỉnh sửa tables trong lần generate này.'
    ]
      .filter(Boolean)
      .join('\n\n')

    setIsGeneratingByAi(true)
    try {
      const result = await generateGradingRubric({
        correctQuery: correctQuery.trim(),
        questionContent: composedQuestionContent,
        totalPoints,
        questionType: 'INSERT_DATA',
        enforceExactTotalPoints: true
      })

      if (!result.data) {
        toast.error(result.message || 'AI không thể tạo gợi ý quy tắc')
        return
      }

      const parsed: GradingRubric =
        typeof result.data === 'string' ? JSON.parse(result.data) : result.data
      const normalizeIndex = editingRuleIndex ?? gradingRules.length

      const parsedRoot = parsed as unknown as Record<string, unknown>
      const parsedPayload =
        (parsedRoot.grading_payload || {}) as Record<string, unknown>

      const rawGeneratedRules = Array.isArray(parsedPayload.grading_rules)
        ? parsedPayload.grading_rules
        : Array.isArray(parsedRoot.grading_rules)
          ? parsedRoot.grading_rules
          : []

      const generatedRules = (rawGeneratedRules as Partial<InsertDataGradingRule>[])
        .map((rule, idx) => normalizeInsertRule(rule, idx))

      if (generatedRules.length === 0) {
        toast.error('AI chưa tạo được quy tắc phù hợp từ prompt hiện tại')
        return
      }

      const currentRuleName = (ruleDraft.rule_name || '').trim()
      const aiRuleSource = selectBestGeneratedRule(
        generatedRules,
        modalPrompt,
        currentRuleName
      )

      if (!aiRuleSource) {
        toast.error('AI chưa tạo được quy tắc hiển thị trong modal')
        return
      }

      const aiRule = normalizeAiGeneratedRuleForEditor(
        aiRuleSource,
        normalizeIndex,
        modalPrompt
      )
      const aiRuleName = (aiRule.rule_name || '').trim()
      const aiRuleDescription =
        typeof aiRule.description === 'string' ? aiRule.description : undefined

      setRuleDraft((current) => {
        const next = normalizeInsertRule(
          {
            ...current,
            ...aiRule,
            rule_name: aiRuleName.length > 0 ? aiRuleName : current.rule_name,
            ...(aiRuleDescription ? { description: aiRuleDescription } : {})
          },
          normalizeIndex
        )

        return aiRuleDescription
          ? {
              ...next,
              description: aiRuleDescription
            }
          : next
      })

      toast.success('AI đã điền nháp 1 quy tắc. Kiểm tra lại rồi bấm Lưu thẻ quy tắc.')
    } catch (error) {
      console.error('AI generate rule draft failed:', error)
      toast.error('Lỗi khi gọi AI. Vui lòng thử lại.')
    } finally {
      setIsGeneratingByAi(false)
    }
  }

  const saveRuleFromModal = () => {
    if (!isSpecialRuleDraft && !(ruleDraft.rule_name || '').trim()) {
      toast.error('Vui lòng nhập tên quy tắc')
      return
    }

    if (editingRuleIndex === null) {
      setGradingRules([...gradingRules, normalizeInsertRule(ruleDraft, gradingRules.length)])
      toast.success('Đã thêm thẻ quy tắc mới')
    } else {
      const nextRules = gradingRules.map((rule, idx) =>
        idx === editingRuleIndex ? normalizeInsertRule(ruleDraft, idx) : rule
      )
      setGradingRules(nextRules)
      toast.success('Đã cập nhật thẻ quy tắc')
    }

    setIsRuleModalOpen(false)
  }

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
        toast.error('Không tạo được tables/expected_data từ SQL đáp án.')
        return
      }

      setTables(generatedTables)
      toast.success(`Đã dựng dữ liệu cho ${generatedTables.length} bảng để chấm thử`) 
    } catch (error) {
      console.error('Build INSERT tables from answer failed:', error)
      toast.error('Lỗi khi dựng dữ liệu bảng từ đáp án. Vui lòng thử lại.')
    } finally {
      setIsBuildingTables(false)
    }
  }

  const resetAdvancedJsonEditor = () => {
    setAdvancedJsonText(JSON.stringify(expectedJsonPreview, null, 2))
  }

  const applyAdvancedJson = () => {
    try {
      const parsed = JSON.parse(advancedJsonText) as unknown

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        toast.error('JSON nâng cao phải là một object hợp lệ')
        return
      }

      const parsedRoot = parsed as Record<string, unknown>
      const parsedPayload =
        parsedRoot.grading_payload &&
        typeof parsedRoot.grading_payload === 'object' &&
        !Array.isArray(parsedRoot.grading_payload)
          ? (parsedRoot.grading_payload as Record<string, unknown>)
          : parsedRoot

      const nextRubric = normalizeInsertRubric(
        {
          total_points: totalPoints,
          question_category: 'INSERT_DATA',
          grading_payload: parsedPayload
        },
        totalPoints
      )

      onChange(nextRubric)
      toast.success('Đã áp dụng JSON nâng cao')
    } catch (error) {
      console.error('Failed to parse advanced JSON for INSERT_DATA rubric:', error)
      toast.error('JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Settings2 className="h-4 w-4 text-sub-primary" />
            Quy tắc chấm điểm chung ({gradingRules.length})
          </h4>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBuildTablesFromAnswer}
              disabled={isBuildingTables}
              className="h-10 px-4 text-sm font-semibold"
            >
              {isBuildingTables ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Đang dựng bảng...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />Dựng dữ liệu bảng từ đáp án
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={openAddRuleModal}
              className="h-10 px-5 text-sm font-semibold"
            >
              <Plus className="mr-1.5 h-4 w-4" />Thêm quy tắc chấm điểm
            </Button>
          </div>
        </div>

        {gradingRules.length === 0 && (
          <div className="rounded-md border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
            Chưa có quy tắc nào. Nhấn "Thêm quy tắc chấm điểm" để bắt đầu.
          </div>
        )}

        <div className="space-y-3">
          {gradingRules.map((rule, ruleIndex) => {
            const specialDescription =
              typeof rule.description === 'string' ? rule.description.trim() : ''
            const isSpecialRule = isDescriptionOnlySpecialRule(rule)
            const normalizedRuleName =
              typeof rule.rule_name === 'string' ? rule.rule_name.trim() : ''
            const ruleTitle = isSpecialRule
              ? `Rule đặc biệt #${ruleIndex + 1}`
              : normalizedRuleName && !isLikelyUnfriendlyRuleName(normalizedRuleName)
                ? normalizedRuleName
                : buildFriendlyRuleName(rule)

            return (
              <div
                key={`${rule.rule_name || 'special-rule'}-${ruleIndex}`}
                className="rounded-md border border-border bg-sub-background p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-sub-primary flex items-center gap-2">
                      {ruleTitle}
                      {isSpecialRule && (
                        <span className="rounded-full border border-sub-primary/30 bg-sub-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sub-primary">
                          Rule đặc biệt
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {buildRuleSummarySentence(rule)}
                    </p>
                    {!isSpecialRule && (
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
                      onClick={() => openEditRuleModal(ruleIndex)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-destructive hover:text-destructive"
                      onClick={() => removeGradingRuleAt(ruleIndex)}
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

      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setShowAdvancedJson((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-sm font-bold text-foreground">Tùy chọn nâng cao</span>
          {showAdvancedJson ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showAdvancedJson && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Giáo viên có thể chỉnh JSON trực tiếp rồi bấm Áp dụng để cập nhật
              rubric. Mục Danh sách bảng dữ liệu đã ẩn trên UI nhưng vẫn giữ trong
              dữ liệu gửi backend.
            </p>
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
              <Button
                type="button"
                size="sm"
                onClick={applyAdvancedJson}
              >
                Áp dụng JSON
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingRuleIndex === null
                ? 'Thêm thẻ quy tắc chấm điểm'
                : 'Sửa thẻ quy tắc chấm điểm'}
            </DialogTitle>
            <DialogDescription>
              Bạn có thể nhập prompt để AI điền nhanh, hoặc tự chọn tay đầy đủ
              các giá trị trong thẻ quy tắc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border border-border bg-surface p-3 space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Prompt cho AI
              </label>
              <textarea
                value={modalPrompt}
                onChange={(event) => setModalPrompt(event.target.value)}
                rows={3}
                placeholder="Ví dụ: Nếu thiếu dòng thì trừ 0.25 điểm, sai giá trị ô thì trừ 0.1 điểm và bỏ qua hoa/thường."
                className="w-full rounded-md border border-border bg-sub-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateRuleByAi}
                  disabled={isGeneratingByAi}
                  className="gap-2"
                >
                  {isGeneratingByAi ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI đang tạo quy tắc nháp...
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {!isSpecialRuleDraft && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Tên quy tắc
                  </label>
                  <input
                    type="text"
                    value={ruleDraft.rule_name || ''}
                    onChange={(event) =>
                      updateRuleDraft(() => ({ rule_name: event.target.value }))
                    }
                    placeholder="Ví dụ: RULE_MISSING_ROW"
                    className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                  />
                </div>
              )}

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Mô tả / ghi chú (hiển thị cho mọi quy tắc)
                </label>
                <textarea
                  value={ruleDraft.description || ''}
                  onChange={(event) =>
                    updateRuleDraft(() => ({
                      description: event.target.value
                    }))
                  }
                  rows={2}
                  placeholder="Ví dụ: Nếu thiếu dữ liệu tham chiếu nền thì bỏ qua so khớp cột A, chỉ chấm cột B và C."
                  className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                />
              </div>

              {!isSpecialRuleDraft && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Đối tượng chấm
                    </label>
                    <select
                      value={draftTarget}
                      onChange={(event) =>
                        handleDraftTargetChange(event.target.value as GradingRuleTarget)
                      }
                      className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                    >
                      {INSERT_RULE_TARGET_OPTIONS.map((targetOption) => (
                        <option key={targetOption.value} value={targetOption.value}>
                          {targetOption.label}
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
                        updateRuleDraft(() => ({
                          condition: event.target.value as GradingRuleCondition
                        }))
                      }
                      className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                    >
                      {draftConditionOptions.map((conditionOption) => (
                        <option key={conditionOption.value} value={conditionOption.value}>
                          {conditionOption.label}
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
                      onChange={(event) =>
                        handleDraftActionChange(event.target.value as GradingRuleAction)
                      }
                      className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                    >
                      {INSERT_RULE_ACTION_OPTIONS.map((actionOption) => (
                        <option key={actionOption.value} value={actionOption.value}>
                          {actionOption.label}
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
                        updateRuleDraft(() => ({
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
                </>
              )}
            </div>

            {!isSpecialRuleDraft && draftModifierOptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Bộ tiền xử lý / châm chước
                </p>
                <div className="flex flex-wrap gap-3">
                  {draftModifierOptions.map((modifierOption) => {
                    const checked =
                      Array.isArray(ruleDraft.modifiers) &&
                      ruleDraft.modifiers.includes(modifierOption.value)

                    return (
                      <label
                        key={modifierOption.value}
                        className="inline-flex items-center gap-2 rounded border border-border bg-card px-2.5 py-1.5 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDraftModifier(modifierOption.value)}
                          className="h-3.5 w-3.5 rounded border-border accent-sub-primary"
                        />
                        {modifierOption.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRuleModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="button" onClick={saveRuleFromModal}>
              Lưu thẻ quy tắc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}