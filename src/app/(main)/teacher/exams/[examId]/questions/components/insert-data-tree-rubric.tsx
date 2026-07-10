'use client'

import { useMemo, type ReactNode } from 'react'

import {
  GradingRuleModifier,
  GradingRuleTarget,
  InsertDataGradingRule
} from '@/lib/types'

import {
  CreateTableTreeRubric,
  GroupConfig,
  RuleModifierOption
} from './create-table-tree-rubric'

// INSERT DATA uses the same compact tree editor as CREATE TABLE and SELECT,
// with only the result checks that InsertDataQuestionGrader actually emits.
export const INSERT_DATA_TREE_CONFIG: GroupConfig[] = [
  {
    id: 'group_row',
    label: 'DÒNG DỮ LIỆU',
    nodes: [
      {
        id: 'row_missing',
        label: 'Thiếu dòng dữ liệu',
        microcopy: 'Bài làm thiếu một dòng có trong dữ liệu đáp án.',
        target: 'ROW',
        condition: 'IS_MISSING',
        defaultPenalty: 10
      },
      {
        id: 'row_extra',
        label: 'Thừa dòng dữ liệu',
        microcopy: 'Bài làm chèn thêm một dòng không có trong đáp án.',
        target: 'ROW',
        condition: 'IS_EXTRA',
        defaultPenalty: 10
      },
      {
        id: 'row_order',
        label: 'Sai thứ tự dòng',
        microcopy:
          'Đúng tập dòng nhưng thứ tự khác đáp án; chỉ bật khi thứ tự là yêu cầu chấm.',
        target: 'ROW_ORDER',
        condition: 'OUT_OF_ORDER',
        defaultPenalty: 5,
        isOptional: true
      }
    ]
  },
  {
    id: 'group_cell',
    label: 'Ô DỮ LIỆU',
    nodes: [
      {
        id: 'cell_value',
        label: 'Sai giá trị ô',
        microcopy:
          'Giá trị tại cột được chấm không khớp đáp án; không trừ lặp khi cả dòng đã thiếu.',
        target: 'CELL_VALUE',
        condition: 'NOT_EQUAL',
        defaultPenalty: 5
      },
      {
        id: 'cell_null',
        label: 'Ô bị NULL sai yêu cầu',
        microcopy:
          'Sinh viên chèn NULL trong khi đáp án yêu cầu một giá trị cụ thể.',
        target: 'CELL_VALUE',
        condition: 'IS_NULL',
        defaultPenalty: 5
      }
    ]
  },
  {
    id: 'group_reference',
    label: 'RÀNG BUỘC THAM CHIẾU',
    nodes: [
      {
        id: 'fk_reference_error',
        label: 'Lỗi khóa ngoại / tham chiếu',
        microcopy:
          'Bài làm vi phạm khóa ngoại hoặc ràng buộc khi INSERT; dùng cho trường hợp hệ thống phải chạy lại theo fallback.',
        target: 'FOREIGN_KEY',
        condition: 'REFERENCE_ERROR',
        defaultPenalty: 10,
        isOptional: true
      }
    ]
  }
]

const INSERT_DATA_MODIFIER_OPTIONS: Partial<
  Record<GradingRuleTarget, RuleModifierOption[]>
> = {
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

const VALID_INSERT_MODIFIERS = new Set<GradingRuleModifier>(
  Object.values(INSERT_DATA_MODIFIER_OPTIONS)
    .flat()
    .map((option) => option.value)
)

interface InsertDataTreeRubricProps {
  rules: InsertDataGradingRule[]
  onChange: (rules: InsertDataGradingRule[]) => void
  headerAction?: ReactNode
}

export function InsertDataTreeRubric({
  rules,
  onChange,
  headerAction
}: InsertDataTreeRubricProps) {
  // Older INSERT presets may contain several type-specific labels for the same
  // target/condition. The grader uses the first matching rule, so the tree does
  // the same and emits a canonical, non-duplicated list after the first edit.
  const canonicalRules = useMemo(() => {
    const seen = new Set<string>()

    return rules
      .filter((rule) => {
        if (!rule.target || !rule.condition) return true

        const key = `${rule.target}|${rule.condition}`
        if (seen.has(key)) return false

        seen.add(key)
        return true
      })
      .map((rule) => ({
        ...rule,
        modifiers: Array.isArray(rule.modifiers)
          ? rule.modifiers.filter((modifier) =>
              VALID_INSERT_MODIFIERS.has(modifier)
            )
          : []
      }))
  }, [rules])

  return (
    <CreateTableTreeRubric
      rules={canonicalRules}
      onChange={onChange}
      headerAction={headerAction}
      config={INSERT_DATA_TREE_CONFIG}
      modifierOptions={INSERT_DATA_MODIFIER_OPTIONS}
    />
  )
}
