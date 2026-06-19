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

export const SYSTEM_RULE_PRESETS: SystemRulePreset[] = [
  {
    id: 'system-create-table-default',
    name: 'Mẫu hệ thống mặc định - CREATE TABLE',
    description:
      'Bộ quy tắc mặc định dựa trên % tỉ trọng điểm của bảng/câu hỏi.',
    questionType: 'CREATE_TABLE',
    rules: [
      {
        rule_name: 'Thiếu bảng bắt buộc',
        target: 'TABLE',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 100,
        description: 'Thiếu bảng bắt buộc thì trừ điểm.'
      },
      {
        rule_name: 'Thừa bảng không yêu cầu',
        target: 'TABLE',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 10,
        description: 'Tạo thêm bảng không nằm trong đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu cột bắt buộc',
        target: 'COLUMN',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 15,
        description: 'Thiếu cột bắt buộc thì trừ điểm.'
      },
      {
        rule_name: 'Thừa cột không yêu cầu',
        target: 'COLUMN',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 15,
        description: 'Khai báo thêm cột không yêu cầu thì trừ điểm.'
      },
      {
        rule_name: 'Sai họ kiểu dữ liệu',
        target: 'DATA_TYPE',
        condition: 'FAMILY_MISMATCH',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 15,
        description: 'Kiểu dữ liệu cột sai họ thì trừ điểm.'
      },
      {
        rule_name: 'Sai kích thước/chi tiết kiểu',
        target: 'DATA_TYPE',
        condition: 'SIZE_MISMATCH',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 5,
        description: 'Kiểu dữ liệu cùng họ nhưng sai kích thước thì trừ điểm.'
      },
      {
        rule_name: 'Sai NULL/NOT NULL',
        target: 'NULLABILITY',
        condition: 'NOT_EQUAL',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 5,
        description:
          'Cột khai báo NULL/NOT NULL sai so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Sai identity',
        target: 'IDENTITY',
        condition: 'NOT_EQUAL',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 5,
        description: 'Cột khai báo IDENTITY sai so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu khóa chính',
        target: 'PRIMARY_KEY',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 20,
        description: 'Thiếu khóa chính thì trừ điểm.'
      },
      {
        rule_name: 'Thừa khóa chính',
        target: 'PRIMARY_KEY',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 10,
        description: 'Khai báo khóa chính thừa so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Sai cột khóa chính',
        target: 'PRIMARY_KEY',
        condition: 'MISMATCH',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 20,
        description: 'Khóa chính khai báo sai cột so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu khóa ngoại',
        target: 'FOREIGN_KEY',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 20,
        description: 'Thiếu khóa ngoại bắt buộc thì trừ điểm.'
      },
      {
        rule_name: 'Thừa khóa ngoại',
        target: 'FOREIGN_KEY',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 10,
        description: 'Khai báo khóa ngoại thừa thì trừ điểm.'
      },
      {
        rule_name: 'Sai tham chiếu khóa ngoại',
        target: 'FOREIGN_KEY',
        condition: 'MISMATCH',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 15,
        description: 'Khóa ngoại tham chiếu sai bảng/cột thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu UNIQUE',
        target: 'UNIQUE',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 0,
        description: 'Thiếu UNIQUE constraint so với đáp án.'
      },
      {
        rule_name: 'Thừa UNIQUE',
        target: 'UNIQUE',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 0,
        description: 'Tạo thêm UNIQUE constraint không có trong đáp án.'
      },
      {
        rule_name: 'Thiếu CHECK',
        target: 'CHECK',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 0,
        description: 'Thiếu CHECK constraint so với đáp án.'
      },
      {
        rule_name: 'Thừa CHECK',
        target: 'CHECK',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 0,
        description: 'Tạo thêm CHECK constraint không có trong đáp án.'
      },
      {
        rule_name: 'Sai biểu thức CHECK',
        target: 'CHECK',
        condition: 'EXPRESSION_MISMATCH',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 0,
        description: 'CHECK constraint đúng đối tượng nhưng biểu thức sai.'
      },
      {
        rule_name: 'Thiếu DEFAULT',
        target: 'DEFAULT',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 0,
        description: 'Thiếu DEFAULT trên cột so với đáp án.'
      },
      {
        rule_name: 'Thừa DEFAULT',
        target: 'DEFAULT',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 0,
        description: 'Tạo thêm DEFAULT không có trong đáp án.'
      },
      {
        rule_name: 'Sai giá trị DEFAULT',
        target: 'DEFAULT',
        condition: 'VALUE_MISMATCH',
        modifiers: [],
        action: 'DEDUCT_PERCENTAGE',
        penalty_value: 0,
        description: 'DEFAULT đúng cột nhưng giá trị sai.'
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
        penalty_value: 0.25,
        description: 'Mỗi dòng dữ liệu thừa sẽ bị trừ điểm.'
      },
      {
        rule_name: 'Sai thứ tự dòng',
        target: 'ROW_ORDER',
        condition: 'OUT_OF_ORDER',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.05,
        description:
          'Đúng dòng dữ liệu nhưng sai thứ tự so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Ô sai giá trị (kiểu chữ)',
        target: 'CELL_VALUE',
        condition: 'NOT_EQUAL',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Giá trị text trong ô sai thì trừ điểm.'
      },
      {
        rule_name: 'Ô sai giá trị (kiểu số)',
        target: 'CELL_VALUE',
        condition: 'NOT_EQUAL',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Giá trị số trong ô sai thì trừ điểm.'
      },
      {
        rule_name: 'Ô sai giá trị (kiểu thời gian)',
        target: 'CELL_VALUE',
        condition: 'NOT_EQUAL',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Giá trị datetime trong ô sai thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu giá trị NULL',
        target: 'CELL_VALUE',
        condition: 'NOT_EQUAL',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description:
          'Đáp án yêu cầu NULL nhưng sinh viên lại điền giá trị thì trừ điểm.'
      },
      {
        rule_name: 'Thừa giá trị NULL',
        target: 'CELL_VALUE',
        condition: 'IS_NULL',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description:
          'Đáp án yêu cầu có giá trị nhưng sinh viên điền NULL thì trừ điểm.'
      }
    ]
  },
  {
    id: 'system-select-query-default',
    name: 'Mẫu hệ thống - SELECT',
    description:
      'Bộ quy tắc mặc định cho lỗi sai dòng, sai cột, sai giá trị và sai thứ tự.',
    questionType: 'SELECT_QUERY',
    rules: [
      {
        rule_name: 'Thiếu dòng',
        target: 'ROW',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.25,
        description: 'Thiếu dòng kết quả so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Thừa dòng',
        target: 'ROW',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.25,
        description: 'Thừa dòng kết quả so với đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Thiếu cột',
        target: 'COLUMN',
        condition: 'IS_MISSING',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description:
          'Cột có trong đáp án nhưng không có trong kết quả thì trừ điểm.'
      },
      {
        rule_name: 'Thừa cột',
        target: 'COLUMN',
        condition: 'IS_EXTRA',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.05,
        description:
          'Cột có trong kết quả nhưng không có trong đáp án thì trừ điểm.'
      },
      {
        rule_name: 'Sai tên cột',
        target: 'COLUMN',
        condition: 'NOT_EQUAL',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.05,
        description: 'Tên cột sai (so khớp theo vị trí cột) thì trừ điểm.'
      },
      {
        rule_name: 'Sai thứ tự cột',
        target: 'COLUMN_ORDER',
        condition: 'OUT_OF_ORDER',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.05,
        description: 'Cột đúng tên nhưng sai vị trí thì trừ điểm.'
      },
      {
        rule_name: 'Ô sai giá trị',
        target: 'CELL_VALUE',
        condition: 'NOT_EQUAL',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description: 'Dữ liệu ô tại một dòng/cột cụ thể bị sai thì trừ điểm.'
      },
      {
        rule_name: 'Sai thứ tự dòng',
        target: 'ROW_ORDER',
        condition: 'OUT_OF_ORDER',
        modifiers: [],
        action: 'DEDUCT_POINTS',
        penalty_value: 0.1,
        description:
          'Đúng dòng dữ liệu nhưng sai thứ tự (nếu yêu cầu ORDER BY) thì trừ điểm.'
      }
    ]
  }
]

export function getSystemRulePresets(
  questionType: SystemRulePresetQuestionType
): SystemRulePreset[] {
  return SYSTEM_RULE_PRESETS.filter((p) => p.questionType === questionType)
}
