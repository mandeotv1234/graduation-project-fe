'use client'

import { useMemo, type ReactNode } from 'react'

import { InsertDataGradingRule } from '@/lib/types'

import { CreateTableTreeRubric, GroupConfig } from './create-table-tree-rubric'

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
  }
]

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

    return rules.filter((rule) => {
      if (!rule.target || !rule.condition) return true

      const key = `${rule.target}|${rule.condition}`
      if (seen.has(key)) return false

      seen.add(key)
      return true
    })
  }, [rules])

  return (
    <CreateTableTreeRubric
      rules={canonicalRules}
      onChange={onChange}
      headerAction={headerAction}
      config={INSERT_DATA_TREE_CONFIG}
    />
  )
}
