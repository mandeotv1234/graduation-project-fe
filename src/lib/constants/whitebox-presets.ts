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

export const WHITEBOX_PRESETS: WhiteboxPreset[] = [
  {
    id: 'select-no-subquery-require-join',
    name: 'Cấm tất cả truy vấn lồng, bắt buộc JOIN',
    description: 'Cấm toàn bộ subquery ở mọi mệnh đề, buộc dùng JOIN thay thế.',
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
    id: 'select-no-subquery-in-where-from',
    name: 'Cấm subquery trong WHERE và FROM',
    description:
      'Cấm dùng subquery trong WHERE/FROM, nhưng vẫn cho phép trong SELECT và HAVING.',
    questionType: 'SELECT_QUERY',
    rules: [
      {
        ruleId: 'FORBIDDEN_SUBQUERY_IN_WHERE',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_SUBQUERY_IN_FROM',
        severity: DEDUCT,
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
  },

  // ---- FUNCTION presets ----
  {
    id: 'function-basic-quality',
    name: 'Kiểm tra cơ bản hàm (Function)',
    description: 'Bắt buộc RETURN, cấm DML và SQL động trong hàm.',
    questionType: 'FUNCTION',
    rules: [
      {
        ruleId: 'REQUIRED_RETURN',
        severity: DEDUCT,
        penaltyValue: 15,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_DML_IN_FUNCTION',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_DYNAMIC_SQL',
        severity: DEDUCT,
        penaltyValue: 25,
        penaltyUnit: PCT
      }
    ]
  },
  {
    id: 'function-scalar-strict',
    name: 'Hàm vô hướng nghiêm ngặt',
    description:
      'Bắt buộc hàm vô hướng, RETURN, SCHEMABINDING và cấm hàm không tất định.',
    questionType: 'FUNCTION',
    rules: [
      {
        ruleId: 'REQUIRED_SCALAR_FUNCTION',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'REQUIRED_RETURN',
        severity: DEDUCT,
        penaltyValue: 15,
        penaltyUnit: PCT
      },
      {
        ruleId: 'REQUIRED_SCHEMABINDING',
        severity: WARN,
        penaltyValue: 5,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_NONDETERMINISTIC_FN',
        severity: DEDUCT,
        penaltyValue: 10,
        penaltyUnit: PCT
      }
    ]
  },
  {
    id: 'function-no-cursor-dynamic',
    name: 'Cấm CURSOR và SQL động trong hàm',
    description:
      'Cấm dùng CURSOR và EXEC()/sp_executesql để tránh anti-pattern.',
    questionType: 'FUNCTION',
    rules: [
      {
        ruleId: 'FORBIDDEN_CURSOR',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_DYNAMIC_SQL',
        severity: DEDUCT,
        penaltyValue: 25,
        penaltyUnit: PCT
      }
    ]
  },

  // ---- CREATE_TABLE presets ----
  {
    id: 'create-table-basic-ddl',
    name: 'Kiểm tra DDL cơ bản',
    description:
      'Bắt buộc PRIMARY KEY mỗi bảng, cấm kiểu dữ liệu deprecated, SELECT INTO và WITH NOCHECK.',
    questionType: 'CREATE_TABLE',
    rules: [
      {
        ruleId: 'REQUIRED_PK',
        severity: DEDUCT,
        penaltyValue: 15,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_DEPRECATED_TYPE',
        severity: DEDUCT,
        penaltyValue: 5,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_SELECT_INTO',
        severity: DEDUCT,
        penaltyValue: 30,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_NOCHECK',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      }
    ]
  },

  // ---- STORED_PROCEDURE presets ----
  {
    id: 'sp-basic-quality',
    name: 'Kiểm tra cơ bản stored procedure',
    description: 'Bắt buộc TRY/CATCH và cấm SQL động.',
    questionType: 'STORED_PROCEDURE',
    rules: [
      {
        ruleId: 'SP_REQUIRED_TRY_CATCH',
        severity: DEDUCT,
        penaltyValue: 15,
        penaltyUnit: PCT
      },
      {
        ruleId: 'SP_FORBIDDEN_DYNAMIC_SQL',
        severity: DEDUCT,
        penaltyValue: 25,
        penaltyUnit: PCT
      }
    ]
  },
  {
    id: 'sp-transaction-safety',
    name: 'An toàn transaction',
    description:
      'Bắt buộc Transaction kết hợp TRY/CATCH để đảm bảo tính toàn vẹn dữ liệu.',
    questionType: 'STORED_PROCEDURE',
    rules: [
      {
        ruleId: 'SP_REQUIRED_TRANSACTION',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'SP_REQUIRED_TRY_CATCH',
        severity: DEDUCT,
        penaltyValue: 15,
        penaltyUnit: PCT
      }
    ]
  },
  {
    id: 'sp-strict-production',
    name: 'Stored procedure chuẩn production',
    description: 'Đầy đủ: TRY/CATCH, Transaction, cấm CURSOR/DDL/TRUNCATE.',
    questionType: 'STORED_PROCEDURE',
    rules: [
      {
        ruleId: 'SP_REQUIRED_TRY_CATCH',
        severity: DEDUCT,
        penaltyValue: 15,
        penaltyUnit: PCT
      },
      {
        ruleId: 'SP_REQUIRED_TRANSACTION',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'SP_FORBIDDEN_CURSOR',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'SP_FORBIDDEN_DDL_IN_PROC',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'SP_FORBIDDEN_TRUNCATE',
        severity: DEDUCT,
        penaltyValue: 15,
        penaltyUnit: PCT
      }
    ]
  },

  // ---- INSERT_DATA presets ----
  {
    id: 'insert-basic-safety',
    name: 'INSERT an toàn cơ bản',
    description:
      'Cấm tự tắt ràng buộc/trigger, cấm IDENTITY_INSERT và bắt buộc ghi danh sách cột.',
    questionType: 'INSERT_DATA',
    rules: [
      {
        ruleId: 'FORBIDDEN_NOCHECK_CONSTRAINT',
        severity: DEDUCT,
        penaltyValue: 25,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_IDENTITY_INSERT',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_DISABLE_TRIGGER',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'REQUIRED_COLUMN_LIST',
        severity: WARN,
        penaltyValue: 10,
        penaltyUnit: PCT
      }
    ]
  },
  {
    id: 'insert-strict-data-only',
    name: 'INSERT thuần dữ liệu',
    description:
      'Chỉ cho phép kịch bản INSERT rõ ràng, cấm INSERT SELECT, UPDATE/DELETE, MERGE và TRUNCATE.',
    questionType: 'INSERT_DATA',
    rules: [
      {
        ruleId: 'REQUIRED_COLUMN_LIST',
        severity: DEDUCT,
        penaltyValue: 10,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_INSERT_SELECT',
        severity: DEDUCT,
        penaltyValue: 15,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_UPDATE_DELETE',
        severity: DEDUCT,
        penaltyValue: 25,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_MERGE',
        severity: DEDUCT,
        penaltyValue: 20,
        penaltyUnit: PCT
      },
      {
        ruleId: 'FORBIDDEN_TRUNCATE',
        severity: DEDUCT,
        penaltyValue: 25,
        penaltyUnit: PCT
      }
    ]
  },
  {
    id: 'insert-compact-script',
    name: 'Giới hạn script INSERT',
    description:
      'Bắt buộc danh sách cột và giới hạn số câu lệnh để tránh script vòng vèo.',
    questionType: 'INSERT_DATA',
    rules: [
      {
        ruleId: 'REQUIRED_COLUMN_LIST',
        severity: DEDUCT,
        penaltyValue: 10,
        penaltyUnit: PCT
      },
      {
        ruleId: 'MAX_STATEMENTS',
        severity: DEDUCT,
        penaltyValue: 10,
        penaltyUnit: PCT,
        params: { max_statements: 5 }
      }
    ]
  }
]

export function getWhiteboxPresets(questionType: string): WhiteboxPreset[] {
  return WHITEBOX_PRESETS.filter(
    (preset) => preset.questionType === questionType
  )
}
