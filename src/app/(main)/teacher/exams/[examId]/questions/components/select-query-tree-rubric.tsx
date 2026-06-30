'use client'

import React from 'react'

import { InsertDataGradingRule } from '@/lib/types'

import { CreateTableTreeRubric, GroupConfig } from './create-table-tree-rubric'

// SELECT reuses the CREATE tree-rubric UI (same atomic-node catalog, badges, edit/delete modal,
// "Thêm đối tượng cần chấm", "Mẫu quy tắc") — only the catalog differs. The result set is a FLAT
// bag, so this is a 3-group catalog (columns -> rows -> cells), not a deep schema tree. The nine
// nodes are the complete audited SELECT taxonomy; one node = one (target|condition), so a teacher
// cannot author overlapping or silent no-op rules. Defaults mirror the BE SELECT_DEFAULT_WEIGHTS.
export const SELECT_TREE_CONFIG: GroupConfig[] = [
  {
    id: 'group_column',
    label: 'CỘT',
    nodes: [
      {
        id: 'col_missing',
        label: 'Thiếu cột so với đáp án',
        microcopy: 'Câu trả lời thiếu một cột mà đáp án có.',
        target: 'COLUMN',
        condition: 'IS_MISSING',
        defaultPenalty: 15
      },
      {
        id: 'col_extra',
        label: 'Dư cột không yêu cầu',
        microcopy: 'Câu trả lời trả về thêm cột mà đáp án không có.',
        target: 'COLUMN',
        condition: 'IS_EXTRA',
        defaultPenalty: 15
      },
      {
        id: 'col_rename',
        label: 'Sai tên cột (đặt alias khác)',
        microcopy:
          'Cùng vị trí nhưng tên/alias khác đáp án — chỉ trừ MỘT lần, không tính thiếu + dư.',
        target: 'COLUMN',
        condition: 'NOT_EQUAL',
        defaultPenalty: 10
      },
      {
        id: 'col_order',
        label: 'Sai thứ tự cột',
        microcopy:
          'Đúng tập cột nhưng sai thứ tự. Chỉ tính khi tập cột đã khớp.',
        target: 'COLUMN_ORDER',
        condition: 'OUT_OF_ORDER',
        defaultPenalty: 5,
        isOptional: true
      }
    ]
  },
  {
    id: 'group_row',
    label: 'DÒNG',
    nodes: [
      {
        id: 'row_missing',
        label: 'Thiếu dòng kết quả',
        microcopy: 'Câu trả lời thiếu dòng mà đáp án có.',
        target: 'ROW',
        condition: 'IS_MISSING',
        defaultPenalty: 10
      },
      {
        id: 'row_extra',
        label: 'Dư dòng kết quả',
        microcopy:
          'Câu trả lời trả về dòng thừa (gồm cả trùng lặp khi cần DISTINCT).',
        target: 'ROW',
        condition: 'IS_EXTRA',
        defaultPenalty: 10
      },
      {
        id: 'row_order',
        label: 'Sai thứ tự dòng',
        microcopy: 'Chỉ tính khi đề có ORDER BY và tập dòng đã khớp.',
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
          'Ô tương ứng có giá trị khác đáp án. Bỏ qua nếu cột/dòng của ô đó đã sai (tránh trừ trùng).',
        target: 'CELL_VALUE',
        condition: 'NOT_EQUAL',
        defaultPenalty: 5
      },
      {
        id: 'cell_null',
        label: 'Ô bị NULL (đáng lẽ có giá trị)',
        microcopy:
          'Ô trả về NULL trong khi đáp án có giá trị — chỉ tính IS_NULL, không tính thêm "sai giá trị".',
        target: 'CELL_VALUE',
        condition: 'IS_NULL',
        defaultPenalty: 5
      }
    ]
  }
]

interface SelectQueryTreeRubricProps {
  rules: InsertDataGradingRule[]
  onChange: (rules: InsertDataGradingRule[]) => void
  headerAction?: React.ReactNode
}

export function SelectQueryTreeRubric({
  rules,
  onChange,
  headerAction
}: SelectQueryTreeRubricProps) {
  return (
    <CreateTableTreeRubric
      rules={rules}
      onChange={onChange}
      headerAction={headerAction}
      config={SELECT_TREE_CONFIG}
    />
  )
}
