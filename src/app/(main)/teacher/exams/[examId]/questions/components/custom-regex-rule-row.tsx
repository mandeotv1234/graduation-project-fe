'use client'

import { Trash2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  WhiteboxPenaltyUnit,
  WhiteboxRule,
  WhiteboxSeverity
} from '@/lib/types'
import { cn } from '@/lib/utils'

type CustomRegexPolicy = 'FORBID' | 'REQUIRE'

interface CustomRegexRuleRowProps {
  rule: WhiteboxRule
  onUpdate: (ruleId: string, patch: Partial<WhiteboxRule>) => void
  onRemove: (ruleId: string) => void
}

function stringParam(rule: WhiteboxRule, name: string, fallback = ''): string {
  const value = rule.params?.[name]
  return typeof value === 'string' ? value : fallback
}

export function CustomRegexRuleRow({
  rule,
  onUpdate,
  onRemove
}: CustomRegexRuleRowProps) {
  const name = stringParam(
    rule,
    'name',
    rule.description ?? 'Rule regex tùy chỉnh'
  )
  const policy = stringParam(rule, 'policy', 'FORBID') as CustomRegexPolicy

  return (
    <div className="px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            policy === 'FORBID' ? 'bg-rose-500' : 'bg-emerald-500'
          )}
          title={policy === 'FORBID' ? 'Cấm' : 'Bắt buộc'}
        />

        <span className="min-w-[180px] flex-1">
          <span className="block text-sm">{name}</span>
          <span className="block font-mono text-[10px] text-muted-foreground">
            {rule.rule_id}
          </span>
        </span>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Trừ
          <Input
            type="number"
            min={0}
            step={0.25}
            value={rule.penalty_value ?? 0}
            onChange={(event) =>
              onUpdate(rule.rule_id, {
                penalty_value: Number(event.target.value)
              })
            }
            className="h-8 w-20"
          />
        </label>

        <Select
          value={rule.penalty_unit}
          onValueChange={(value) =>
            onUpdate(rule.rule_id, {
              penalty_unit: value as WhiteboxPenaltyUnit
            })
          }
        >
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ABSOLUTE">điểm</SelectItem>
            <SelectItem value="PERCENTAGE_OF_QUESTION">% câu</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={rule.severity}
          onValueChange={(value) =>
            onUpdate(rule.rule_id, { severity: value as WhiteboxSeverity })
          }
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WARNING_ONLY">Chỉ cảnh báo</SelectItem>
            <SelectItem value="DEDUCTION">Trừ điểm</SelectItem>
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => onRemove(rule.rule_id)}
          className="text-muted-foreground transition-colors hover:text-rose-600"
          title="Xóa quy tắc"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
