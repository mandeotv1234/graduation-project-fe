import { WhiteboxPenaltyUnit, WhiteboxSeverity } from '@/lib/types'

// A preset rule references a backend catalog rule_id and overrides its suggested config. It is NOT a
// rule definition — label/type/params still come from the backend catalog when applied.
export interface WhiteboxPresetRule {
  ruleId: string
  severity?: WhiteboxSeverity
  penaltyValue?: number
  penaltyUnit?: WhiteboxPenaltyUnit
  params?: Record<string, unknown>
}

// A teacher-facing convenience bundle, keyed by question type. Applying it replaces whitebox_rules.
export interface WhiteboxPreset {
  id: string
  name: string
  description: string
  questionType: string
  rules: WhiteboxPresetRule[]
}

const PCT: WhiteboxPenaltyUnit = 'PERCENTAGE_OF_QUESTION'
const DEDUCT: WhiteboxSeverity = 'DEDUCTION'
const WARN: WhiteboxSeverity = 'WARNING_ONLY'

// v1: SELECT_QUERY only (the only type with a backend white-box catalog). Other types get bundles
// once their evaluators land.
export const WHITEBOX_PRESETS: WhiteboxPreset[] = [
  {
    id: 'select-no-subquery-require-join',
    name: 'Cấm truy vấn lồng, bắt buộc JOIN',
    description: 'Buộc dùng JOIN thay vì subquery / comma-join.',
    questionType: 'SELECT_QUERY',
    rules: [
      {
        ruleId: 'FORBIDDEN_SUBQUERY',
        severity: DEDUCT,
        penaltyValue: 25,
        penaltyUnit: PCT
      },
      {
        ruleId: 'REQUIRED_JOIN',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_OLD_JOIN_SYNTAX',
        severity: WARN,
        penaltyValue: 15,
        penaltyUnit: PCT
      }
    ]
  },
  {
    id: 'select-anti-lazy',
    name: 'Chống viết ẩu (SELECT *, DISTINCT)',
    description: 'Cấm SELECT * và DISTINCT che lỗi JOIN nhân bản.',
    questionType: 'SELECT_QUERY',
    rules: [
      {
        ruleId: 'FORBIDDEN_SELECT_STAR',
        severity: DEDUCT,
        penaltyValue: 10,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_DISTINCT',
        severity: WARN,
        penaltyValue: 10,
        penaltyUnit: PCT
      }
    ]
  },
  {
    id: 'select-require-grouping',
    name: 'Bắt buộc gom nhóm',
    description: 'Buộc dùng GROUP BY + hàm tổng hợp (và HAVING).',
    questionType: 'SELECT_QUERY',
    rules: [
      {
        ruleId: 'REQUIRED_GROUP_BY',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'REQUIRED_AGGREGATE_FUNCTION',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'REQUIRED_HAVING',
        severity: WARN,
        penaltyValue: 15,
        penaltyUnit: PCT
      }
    ]
  }
]

export function getWhiteboxPresets(questionType: string): WhiteboxPreset[] {
  return WHITEBOX_PRESETS.filter(
    (preset) => preset.questionType === questionType
  )
}
