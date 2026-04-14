import type { InsertDataGradingRule } from '@/lib/types'

export type SystemRulePresetQuestionType =
  | 'CREATE_TABLE'
  | 'INSERT_DATA'
  | 'SELECT_QUERY'

export interface SystemRulePreset {
  id: string
  name: string
  description: string
  questionType: SystemRulePresetQuestionType
  rules: InsertDataGradingRule[]
}

const SYSTEM_RULE_PRESETS: SystemRulePreset[] = [
  {
    id: 'system-create-table-default',
    name: 'Mẫu hệ thống - CREATE TABLE',
    description:
      'Bộ quy tắc mặc định cho lỗi thiếu/thừa bảng, cột, sai kiểu dữ liệu và sai ràng buộc.',
    questionType: 'CREATE_TABLE',
    rules: [
      {
        rule_name: 'Thiếu bảng bắt buộc',
        target: 'TABLE',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.5,
        description: 'Thiếu bảng bắt buộc thì trừ điểm.'
      },
      {
        rule_name: 'Thừa bảng không yêu cầu',
        target: 'TABLE',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.2,
        description: 'Tạo thêm bảng không nằm trong đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu cột bắt buộc',
        target: 'COLUMN',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.25,
        description: 'Thiếu cột bắt buộc thì trừ điểm.'
      },
      {
        rule_name: 'Thừa cột không yêu cầu',
        target: 'COLUMN',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Khai báo thêm cột không yêu cầu thì trừ điểm.'
      },
      {
        rule_name: 'Sai kiểu dữ liệu cột',
        target: 'DATA_TYPE',
        condition: 'TYPE_MISMATCH',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.2,
        description: 'Kiểu dữ liệu cột không khớp đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Sai thứ tự cột',
        target: 'COLUMN_ORDER',
        condition: 'OUT_OF_ORDER',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.05,
        description: 'Thứ tự cột sai so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu khóa chính',
        target: 'PRIMARY_KEY',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.35,
        description: 'Thiếu khóa chính thì trừ điểm.'
      },
      {
        rule_name: 'Thừa khóa chính',
        target: 'PRIMARY_KEY',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Khai báo khóa chính thừa so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu khóa ngoại',
        target: 'FOREIGN_KEY',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.3,
        description: 'Thiếu khóa ngoại bắt buộc thì trừ điểm.'
      },
      {
        rule_name: 'Thừa khóa ngoại',
        target: 'FOREIGN_KEY',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Khai báo khóa ngoại thừa thì trừ điểm.'
      },
      {
        rule_name: 'Sai tham chiếu khóa ngoại',
        target: 'FOREIGN_KEY',
        condition: 'REFERENCE_ERROR',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.3,
        description: 'Khóa ngoại tham chiếu sai bảng/cột thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu ràng buộc cục bộ',
        target: 'CONSTRAINT_LOCAL',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.15,
        description: 'Thiếu ràng buộc cục bộ quan trọng thì trừ điểm.'
      },
      {
        rule_name: 'Thừa ràng buộc cục bộ',
        target: 'CONSTRAINT_LOCAL',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.05,
        description: 'Ràng buộc cục bộ thừa so với đáp án thì trừ điểm.'
      }
    ]
  },
  {
    id: 'system-insert-data-default',
    name: 'Mẫu hệ thống - INSERT DATA',
    description:
      'Bộ quy tắc mặc định cho lỗi thiếu/thừa dòng, sai giá trị ô, null sai và sai thứ tự dòng.',
    questionType: 'INSERT_DATA',
    rules: [
      {
        rule_name: 'Thiếu dòng dữ liệu',
        target: 'ROW',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.25,
        description: 'Mỗi dòng dữ liệu thiếu sẽ bị trừ điểm.'
      },
      {
        rule_name: 'Thừa dòng dữ liệu',
        target: 'ROW',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Dòng dữ liệu thừa so với đáp án sẽ bị trừ điểm.'
      },
      {
        rule_name: 'Sai giá trị trong ô dữ liệu',
        target: 'CELL_VALUE',
        condition: 'NOT_EQUAL',
        modifiers: ['TRIM_WHITESPACE', 'TO_LOWERCASE'],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Giá trị trong ô không khớp đáp án sẽ bị trừ điểm.'
      },
      {
        rule_name: 'Giá trị bị null không hợp lệ',
        target: 'CELL_VALUE',
        condition: 'IS_NULL',
        modifiers: ['TRIM_WHITESPACE', 'TO_LOWERCASE'],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description:
          'Ô dữ liệu bị null trong khi đáp án không null sẽ bị trừ điểm.'
      },
      {
        rule_name: 'Sai thứ tự dòng dữ liệu',
        target: 'ROW_ORDER',
        condition: 'OUT_OF_ORDER',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Thứ tự dòng dữ liệu không đúng yêu cầu sẽ bị trừ điểm.'
      },
      {
        rule_name: 'Sai ràng buộc khóa ngoại',
        target: 'FOREIGN_KEY',
        condition: 'REFERENCE_ERROR',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.25,
        description: 'Dữ liệu vi phạm tham chiếu khóa ngoại sẽ bị trừ điểm.'
      }
    ]
  },
  {
    id: 'system-select-query-default',
    name: 'Mẫu hệ thống - SELECT QUERY',
    description:
      'Bộ quy tắc mặc định cho lỗi thiếu/thừa cột, thiếu/thừa dòng, sai giá trị và sai thứ tự kết quả.',
    questionType: 'SELECT_QUERY',
    rules: [
      {
        rule_name: 'Thiếu cột trong kết quả',
        target: 'COLUMN',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.5,
        description: 'Kết quả thiếu cột bắt buộc thì trừ điểm.'
      },
      {
        rule_name: 'Thừa cột trong kết quả',
        target: 'COLUMN',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.2,
        description: 'Kết quả có cột thừa so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Sai thứ tự dòng',
        target: 'ROW_ORDER',
        condition: 'OUT_OF_ORDER',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.25,
        description: 'Thứ tự dòng không đúng theo yêu cầu thì trừ điểm.'
      },
      {
        rule_name: 'Sai thứ tự cột',
        target: 'COLUMN_ORDER',
        condition: 'OUT_OF_ORDER',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.25,
        description: 'Thứ tự cột không đúng theo đáp án thì trừ điểm.'
      }
    ]
  }
]

export function getSystemRulePresets(
  questionType: SystemRulePresetQuestionType
) {
  return SYSTEM_RULE_PRESETS.filter(
    (item) => item.questionType === questionType
  )
}
