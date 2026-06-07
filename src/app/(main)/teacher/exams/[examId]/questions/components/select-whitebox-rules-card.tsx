'use client'

import { AlertTriangle } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { InsertDataGradingRule, QueryStructureCondition } from '@/lib/types'

interface SelectWhiteboxRulesCardProps {
  totalPoints: number
  // QUERY-target rules only; the parent merges these back with result-set rules.
  rules: InsertDataGradingRule[]
  onChange: (rules: InsertDataGradingRule[]) => void
}

interface WhiteboxPreset {
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

const DEFAULT_NESTING_THRESHOLD = 2

const PRESETS: WhiteboxPreset[] = [
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

function defaultPenalty(totalPoints: number): number {
  const tenth = Math.round(totalPoints * 0.1 * 100) / 100
  const chosen = Math.max(0.25, tenth)
  return totalPoints > 0 && chosen > totalPoints ? totalPoints : chosen
}

export function SelectWhiteboxRulesCard({
  totalPoints,
  rules,
  onChange
}: SelectWhiteboxRulesCardProps) {
  const findRule = (condition: QueryStructureCondition) =>
    rules.find((rule) => rule.condition === condition)

  const toggle = (preset: WhiteboxPreset, checked: boolean) => {
    if (checked) {
      onChange([
        ...rules,
        {
          rule_name: preset.label,
          target: 'QUERY',
          condition: preset.condition,
          action: 'DEDUCT_POINTS',
          penalty_value: defaultPenalty(totalPoints),
          ...(preset.param === 'threshold'
            ? { threshold: DEFAULT_NESTING_THRESHOLD }
            : {})
        }
      ])
    } else {
      onChange(rules.filter((rule) => rule.condition !== preset.condition))
    }
  }

  const updateRule = (
    condition: QueryStructureCondition,
    patch: Partial<InsertDataGradingRule>
  ) => {
    onChange(
      rules.map((rule) =>
        rule.condition === condition ? { ...rule, ...patch } : rule
      )
    )
  }

  const toggleFailAll = (preset: WhiteboxPreset, enableFail: boolean) => {
    if (enableFail) {
      const confirmed = window.confirm(
        `Bạn chắc chắn muốn cho quy tắc "${preset.label}" trừ 0 điểm TOÀN BỘ câu hỏi khi vi phạm? ` +
          'Lời giải đúng nhưng viết theo cách khác có thể bị 0 điểm oan.'
      )
      if (!confirmed) return
    }
    updateRule(preset.condition, {
      action: enableFail ? 'FAIL_ALL' : 'DEDUCT_POINTS'
    })
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/10">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-base font-semibold text-foreground">
          🧩 Chấm cấu trúc câu lệnh (White-box)
        </span>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Kiểm tra <strong>cách viết</strong> câu truy vấn của sinh viên (JOIN,
        truy vấn con, GROUP BY…), bổ sung cho việc so sánh kết quả. Mỗi mục được
        tick sẽ thêm một quy tắc chấm tương ứng.
      </p>

      <div className="space-y-2">
        {PRESETS.map((preset) => {
          const rule = findRule(preset.condition)
          const checked = Boolean(rule)
          const isFailAll = rule?.action === 'FAIL_ALL'
          return (
            <div
              key={preset.condition}
              className="rounded-lg border border-border/60 bg-background/60 px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <label className="flex flex-1 items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggle(preset, value === true)}
                  />
                  <span>
                    {preset.label}
                    {preset.dangerous && (
                      <span
                        className="ml-1 text-amber-600 dark:text-amber-400"
                        title="Quy tắc dễ chấm oan lời giải tương đương — mặc định chỉ trừ điểm."
                      >
                        *
                      </span>
                    )}
                  </span>
                </label>

                {checked && preset.param === 'threshold' && (
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Tối đa
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={rule?.threshold ?? DEFAULT_NESTING_THRESHOLD}
                      onChange={(e) =>
                        updateRule(preset.condition, {
                          threshold: Number(e.target.value)
                        })
                      }
                      className="h-8 w-16"
                    />
                    cấp lồng
                  </label>
                )}

                {checked && preset.param === 'argument' && (
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Gồm
                    <Input
                      type="text"
                      placeholder="VD: COUNT,SUM"
                      value={rule?.argument ?? ''}
                      onChange={(e) =>
                        updateRule(preset.condition, {
                          argument: e.target.value
                        })
                      }
                      className="h-8 w-36"
                    />
                  </label>
                )}

                {checked && !isFailAll && (
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Trừ
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      value={rule?.penalty_value ?? 0}
                      onChange={(e) =>
                        updateRule(preset.condition, {
                          penalty_value: Number(e.target.value)
                        })
                      }
                      className="h-8 w-20"
                    />
                    điểm
                  </label>
                )}
              </div>

              {checked && preset.dangerous && !preset.neverFail && (
                <label className="mt-2 flex items-center gap-2 pl-6 text-xs text-amber-700 dark:text-amber-400">
                  <Checkbox
                    checked={isFailAll}
                    onCheckedChange={(value) =>
                      toggleFailAll(preset, value === true)
                    }
                  />
                  Nâng cao: 0 điểm toàn bộ câu hỏi khi vi phạm (FAIL)
                </label>
              )}

              {checked && preset.neverFail && (
                <p className="mt-1.5 pl-6 text-xs text-amber-700 dark:text-amber-400">
                  Quy tắc thử nghiệm, dễ chấm oan — luôn chỉ trừ điểm, không bao
                  giờ đặt 0 điểm toàn bộ. Tắt nếu thấy báo nhầm nhiều.
                </p>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Mục có dấu <strong>*</strong> dễ chấm oan lời giải tương đương — mặc
        định chỉ trừ điểm, không đặt 0 điểm toàn bộ trừ khi thật sự cần.
      </p>
    </div>
  )
}
