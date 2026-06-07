'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { InsertDataGradingRule, QueryStructureCondition } from '@/lib/types'

import {
  DEFAULT_NESTING_THRESHOLD,
  WhiteboxPreset
} from './select-whitebox-presets'

interface SelectWhiteboxRuleRowProps {
  preset: WhiteboxPreset
  rule?: InsertDataGradingRule
  onToggle: (preset: WhiteboxPreset, checked: boolean) => void
  onUpdate: (
    condition: QueryStructureCondition,
    patch: Partial<InsertDataGradingRule>
  ) => void
  onToggleFailAll: (preset: WhiteboxPreset, enableFail: boolean) => void
}

export function SelectWhiteboxRuleRow({
  preset,
  rule,
  onToggle,
  onUpdate,
  onToggleFailAll
}: SelectWhiteboxRuleRowProps) {
  const checked = Boolean(rule)
  const isFailAll = rule?.action === 'FAIL_ALL'

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="flex flex-1 items-center gap-2 text-sm">
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => onToggle(preset, value === true)}
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
                onUpdate(preset.condition, {
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
                onUpdate(preset.condition, { argument: e.target.value })
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
                onUpdate(preset.condition, {
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
            onCheckedChange={(value) => onToggleFailAll(preset, value === true)}
          />
          Nâng cao: 0 điểm toàn bộ câu hỏi khi vi phạm (FAIL)
        </label>
      )}

      {checked && preset.neverFail && (
        <p className="mt-1.5 pl-6 text-xs text-amber-700 dark:text-amber-400">
          Quy tắc thử nghiệm, dễ chấm oan — luôn chỉ trừ điểm, không bao giờ đặt
          0 điểm toàn bộ. Tắt nếu thấy báo nhầm nhiều.
        </p>
      )}
    </div>
  )
}
