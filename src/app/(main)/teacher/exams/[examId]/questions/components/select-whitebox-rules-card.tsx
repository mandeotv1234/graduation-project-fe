'use client'

import { AlertTriangle } from 'lucide-react'

import { InsertDataGradingRule, QueryStructureCondition } from '@/lib/types'

import {
  DEFAULT_NESTING_THRESHOLD,
  WHITEBOX_PRESETS,
  WhiteboxPreset,
  defaultWhiteboxPenalty
} from './select-whitebox-presets'
import { SelectWhiteboxRuleRow } from './select-whitebox-rule-row'

interface SelectWhiteboxRulesCardProps {
  totalPoints: number
  // QUERY-target rules only; the parent merges these back with result-set rules.
  rules: InsertDataGradingRule[]
  onChange: (rules: InsertDataGradingRule[]) => void
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
          penalty_value: defaultWhiteboxPenalty(totalPoints),
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
        {WHITEBOX_PRESETS.map((preset) => (
          <SelectWhiteboxRuleRow
            key={preset.condition}
            preset={preset}
            rule={findRule(preset.condition)}
            onToggle={toggle}
            onUpdate={updateRule}
            onToggleFailAll={toggleFailAll}
          />
        ))}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Mục có dấu <strong>*</strong> dễ chấm oan lời giải tương đương — mặc
        định chỉ trừ điểm, không đặt 0 điểm toàn bộ trừ khi thật sự cần.
      </p>
    </div>
  )
}
