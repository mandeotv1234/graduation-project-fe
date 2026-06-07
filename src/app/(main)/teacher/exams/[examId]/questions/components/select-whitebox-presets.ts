import { QueryStructureCondition } from '@/lib/types'

export interface WhiteboxPreset {
  condition: QueryStructureCondition
  label: string
  // DANGEROUS presets risk penalising a semantically-equivalent answer, so they default to
  // deduct-only and hide FAIL behind an explicit confirm.
  dangerous: boolean
  // FORBID_LITERAL_IN_WHERE is fuzzy: only ever deduct, never offer FAIL.
  neverFail?: boolean
  // Optional parameter input: a nesting-depth threshold or an aggregate allow-list (CSV).
  param?: 'threshold' | 'argument'
}

export const DEFAULT_NESTING_THRESHOLD = 2

export const WHITEBOX_PRESETS: WhiteboxPreset[] = [
  { condition: 'REQUIRE_JOIN', label: 'Bắt buộc dùng JOIN', dangerous: true },
  { condition: 'FORBID_JOIN', label: 'Cấm dùng JOIN', dangerous: false },
  {
    condition: 'REQUIRE_GROUP_BY',
    label: 'Bắt buộc dùng GROUP BY',
    dangerous: false
  },
  {
    condition: 'REQUIRE_AGGREGATE',
    label: 'Bắt buộc dùng hàm tổng hợp (COUNT/SUM/AVG/MIN/MAX)',
    dangerous: false,
    param: 'argument'
  },
  {
    condition: 'REQUIRE_DISTINCT',
    label: 'Bắt buộc dùng DISTINCT',
    dangerous: true
  },
  {
    condition: 'REQUIRE_CTE',
    label: 'Bắt buộc dùng CTE (WITH)',
    dangerous: true
  },
  { condition: 'FORBID_CTE', label: 'Cấm dùng CTE (WITH)', dangerous: false },
  {
    condition: 'FORBID_ORDER_BY',
    label: 'Cấm dùng ORDER BY',
    dangerous: false
  },
  {
    condition: 'FORBID_SUBQUERY_IN_SELECT',
    label: 'Cấm truy vấn con trong SELECT',
    dangerous: true
  },
  {
    condition: 'FORBID_SUBQUERY_IN_FROM',
    label: 'Cấm truy vấn con trong FROM',
    dangerous: true
  },
  {
    condition: 'FORBID_SUBQUERY_IN_WHERE',
    label: 'Cấm truy vấn con trong WHERE',
    dangerous: true
  },
  {
    condition: 'MAX_NESTING_DEPTH',
    label: 'Giới hạn độ sâu lồng truy vấn con',
    dangerous: false,
    param: 'threshold'
  },
  {
    condition: 'FORBID_LITERAL_IN_WHERE',
    label: 'Cấm hằng số trong WHERE (nghi ghi cứng đáp án)',
    dangerous: true,
    neverFail: true
  }
]

// Default deduction for a newly-ticked preset: 10% of the question, floored at 0.25, capped at total.
export function defaultWhiteboxPenalty(totalPoints: number): number {
  const tenth = Math.round(totalPoints * 0.1 * 100) / 100
  const chosen = Math.max(0.25, tenth)
  return totalPoints > 0 && chosen > totalPoints ? totalPoints : chosen
}
