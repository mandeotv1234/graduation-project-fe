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

const TARGET_OPTIONS: Array<{ value: GradingRuleTarget; label: string }> = [
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

const CONDITION_OPTIONS: Record<
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

const MODIFIER_OPTIONS: Record<
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

const ACTION_OPTIONS: Array<{ value: GradingRuleAction; label: string }> = [
  { value: 'DEDUCT_POINTS', label: 'Trừ điểm cố định' },
  { value: 'DEDUCT_PERCENTAGE', label: 'Trừ theo phần trăm' },
  { value: 'FAIL_ITEM', label: '0 điểm đối tượng hiện tại' },
  { value: 'FAIL_ALL', label: '0 điểm toàn bộ câu hỏi' },
  { value: 'IGNORE', label: 'Bỏ qua, không trừ điểm' }
]

const VALID_TARGETS = new Set(TARGET_OPTIONS.map((opt) => opt.value))
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

function getConditionOptions(target: GradingRuleTarget) {
  return CONDITION_OPTIONS[target] || CONDITION_OPTIONS.ROW
}

function getModifierOptions(target: GradingRuleTarget) {
  return MODIFIER_OPTIONS[target] || []
}

function getConditionLabel(target: GradingRuleTarget, condition: GradingRuleCondition) {
  return (
    getConditionOptions(target).find((opt) => opt.value === condition)?.label ||
    condition
  )
}

function getTargetLabel(target: GradingRuleTarget) {
  return TARGET_OPTIONS.find((opt) => opt.value === target)?.label || target
}

function getModifierLabel(target: GradingRuleTarget, modifier: GradingRuleModifier) {
  return (
    getModifierOptions(target).find((opt) => opt.value === modifier)?.label ||
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
  index: number
): InsertDataGradingRule {
  const description =
    typeof input.description === 'string' ? input.description.trim() : ''

  if (isDescriptionOnlySpecialRule(input)) {
    return { description }
  }

  const target = VALID_TARGETS.has(input.target as GradingRuleTarget)
    ? (input.target as GradingRuleTarget)
    : 'ROW'

  const conditionOptions = getConditionOptions(target)
  const condition = conditionOptions.some((opt) => opt.value === input.condition)
    ? (input.condition as GradingRuleCondition)
    : conditionOptions[0].value

  const action = VALID_ACTIONS.has(input.action as GradingRuleAction)
    ? (input.action as GradingRuleAction)
    : 'DEDUCT_POINTS'

  const validModifiers = new Set(getModifierOptions(target).map((m) => m.value))
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

function buildRuleSummary(rule: InsertDataGradingRule) {
  const specialDescription =
    typeof rule.description === 'string' ? rule.description.trim() : ''

  if (specialDescription.length > 0 && isDescriptionOnlySpecialRule(rule)) {
    return specialDescription
  }

  const target = rule.target || 'ROW'
  const condition =
    rule.condition || getConditionOptions(target)[0].value
  const action = rule.action || 'DEDUCT_POINTS'
  const penaltyValue = Math.max(0, toNumber(rule.penalty_value, 0))
  const modifiers = Array.isArray(rule.modifiers) ? rule.modifiers : []

  const modifierText =
    modifiers.length > 0
      ? `, áp dụng: ${modifiers
          .map((modifier) => getModifierLabel(target, modifier))
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

  return `Nếu phát hiện "${getConditionLabel(target, condition)}" trên "${getTargetLabel(target)}"${modifierText} thì ${actionText}.`
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGeneratingByAi, setIsGeneratingByAi] = useState(false)
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)
  const [specialMode, setSpecialMode] = useState(false)
  const [modalPrompt, setModalPrompt] = useState('')
  const [ruleDraft, setRuleDraft] = useState<InsertDataGradingRule>(
    normalizeRule(
      {
        target: 'ROW',
        condition: 'IS_MISSING',
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        modifiers: []
      },
      0
    )
  )

  const normalizedRules = useMemo(
    () => rules.map((rule, idx) => normalizeRule(rule, idx)),
    [rules]
  )

  const draftTarget = ruleDraft.target || 'ROW'
  const draftCondition =
    ruleDraft.condition || getConditionOptions(draftTarget)[0].value
  const draftAction = ruleDraft.action || 'DEDUCT_POINTS'
  const draftConditionOptions = getConditionOptions(draftTarget)
  const draftModifierOptions = getModifierOptions(draftTarget)

  const updateDraft = (
    updater: (current: InsertDataGradingRule) => Partial<InsertDataGradingRule>
  ) => {
    const normalizeIndex = editingRuleIndex ?? normalizedRules.length
    setRuleDraft((current) => {
      const merged = { ...current, ...updater(current) }
      const normalized = normalizeRule(merged, normalizeIndex)
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
    setModalPrompt('')
    setRuleDraft(
      normalizeRule(
        {
          rule_name: buildRuleName(normalizedRules.length),
          target: 'ROW',
          condition: 'IS_MISSING',
          action: 'DEDUCT_POINTS',
          penalty_value: 0.1,
          modifiers: []
        },
        normalizedRules.length
      )
    )
    setIsModalOpen(true)
  }

  const openEditModal = (ruleIndex: number) => {
    const nextRule = normalizeRule(normalizedRules[ruleIndex], ruleIndex)
    setEditingRuleIndex(ruleIndex)
    setRuleDraft(nextRule)
    setSpecialMode(isDescriptionOnlySpecialRule(nextRule))
    setModalPrompt('')
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
    const normalized = normalizeRule(ruleDraft, normalizeIndex)
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

  const generateRuleByAi = async () => {
    if (!correctQuery?.trim()) {
      toast.error('Vui lòng nhập SQL đáp án trước khi dùng AI')
      return
    }
    if (!modalPrompt.trim()) {
      toast.error('Vui lòng nhập prompt trong modal trước khi dùng AI')
      return
    }

    const existingRulesContext =
      normalizedRules.length === 0
        ? '- Chưa có quy tắc nào.'
        : normalizedRules
            .map((rule, index) => {
              if (isDescriptionOnlySpecialRule(rule)) {
                return `${index + 1}. [SPECIAL] ${rule.description || ''}`
              }
              return `${index + 1}. ${rule.rule_name || buildRuleName(index)} | target=${rule.target || 'ROW'} | condition=${rule.condition || 'IS_MISSING'} | action=${rule.action || 'DEDUCT_POINTS'} | penalty=${toNumber(rule.penalty_value, 0)}`
            })
            .join('\n')

    const composedQuestionContent = [
      questionContent?.trim() ? `## Ngữ cảnh đề bài\n${questionContent.trim()}` : '',
      contextSummary?.trim() ? `## Ngữ cảnh dữ liệu hiện tại\n${contextSummary.trim()}` : '',
      `## Yêu cầu giáo viên\n${modalPrompt.trim()}`,
      `## Quy tắc hiện có\n${existingRulesContext}`,
      '## Năng lực JSON được phép',
      '- Rule thường: { rule_name, target, condition, modifiers, action, penalty_value, description }.',
      '- Rule đặc biệt: chỉ có { description } nếu là ngoại lệ nghiệp vụ khó biểu diễn.',
      '- Chỉ trả về DUY NHẤT 1 rule phù hợp nhất theo prompt.',
      '- Ưu tiên tên quy tắc thân thiện tiếng Việt, ngắn gọn.'
    ]
      .filter(Boolean)
      .join('\n\n')

    setIsGeneratingByAi(true)
    try {
      const result = await generateGradingRubric({
        correctQuery: correctQuery.trim(),
        questionContent: composedQuestionContent,
        totalPoints,
        questionType,
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
        (rule, idx) => normalizeRule(rule, idx)
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
      const nextDraft = normalizeRule(best, normalizeIndex)
      setRuleDraft(nextDraft)
      setSpecialMode(isDescriptionOnlySpecialRule(nextDraft))
      toast.success('AI đã điền nháp 1 quy tắc, kiểm tra lại rồi bấm Lưu.')
    } catch (error) {
      console.error('AI generate rule draft failed:', error)
      toast.error('Lỗi khi gọi AI. Vui lòng thử lại.')
    } finally {
      setIsGeneratingByAi(false)
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
                    {buildRuleSummary(rule)}
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingRuleIndex === null
                ? 'Thêm quy tắc chấm điểm'
                : 'Sửa quy tắc chấm điểm'}
            </DialogTitle>
            <DialogDescription>
              Dùng AI để điền nháp nhanh hoặc tự nhập tay để tinh chỉnh rule.
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

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={specialMode}
                onChange={(e) => setSpecialMode(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-sub-primary"
              />
              Rule đặc biệt (description-only)
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Đối tượng chấm
                    </label>
                    <select
                      value={draftTarget}
                      onChange={(event) => {
                        const nextTarget = event.target.value as GradingRuleTarget
                        updateDraft((current) => {
                          const nextConditionOptions = getConditionOptions(nextTarget)
                          const nextCondition = nextConditionOptions.some(
                            (opt) => opt.value === current.condition
                          )
                            ? current.condition
                            : nextConditionOptions[0].value

                          return {
                            target: nextTarget,
                            condition: nextCondition,
                            modifiers: []
                          }
                        })
                      }}
                      className="w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                    >
                      {TARGET_OPTIONS.map((opt) => (
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

                {draftModifierOptions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Bộ tiền xử lý / châm chước
                    </p>
                    <div className="flex flex-wrap gap-3">
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
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="button" onClick={saveRule}>
              Lưu quy tắc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
