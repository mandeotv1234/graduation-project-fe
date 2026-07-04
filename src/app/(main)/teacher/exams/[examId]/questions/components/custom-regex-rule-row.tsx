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
  const policyMeta =
    policy === 'FORBID'
      ? {
          label: 'Cấm',
          className:
            'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/50',
          description: 'Trừ điểm khi SQL khớp với regex tùy chỉnh.'
        }
      : {
          label: 'Bắt buộc',
          className:
            'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50',
          description: 'Trừ điểm khi SQL không khớp với regex tùy chỉnh.'
        }

  const clampPenaltyValue = (value: number, unit = rule.penalty_unit) =>
    unit === 'PERCENTAGE_OF_QUESTION'
      ? Math.min(Math.max(value, 0), 100)
      : Math.max(value, 0)

  return (
    <div className="px-4 py-3 transition-colors hover:bg-muted/35">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'mt-0.5 inline-flex min-w-20 shrink-0 justify-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1',
              policyMeta.className
            )}
          >
            {policyMeta.label}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-sm font-semibold text-foreground">
                {name}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Regex tùy chỉnh
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {rule.rule_id}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {policyMeta.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Select
            value={rule.severity}
            onValueChange={(value) =>
              onUpdate(rule.rule_id, {
                severity: value as WhiteboxSeverity,
                ...(value === 'WARNING_ONLY'
                  ? { penalty_value: 0, penalty_unit: 'ABSOLUTE' as const }
                  : {})
              })
            }
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WARNING_ONLY">Chỉ cảnh báo</SelectItem>
              <SelectItem value="DEDUCTION">Trừ điểm</SelectItem>
            </SelectContent>
          </Select>

          {rule.severity === 'DEDUCTION' && (
            <div className="flex h-8 items-center overflow-hidden rounded-md border border-input bg-background">
              <span className="border-r border-border px-2 text-xs text-muted-foreground">
                Trừ
              </span>
              <Input
                type="number"
                min={0}
                max={
                  rule.penalty_unit === 'PERCENTAGE_OF_QUESTION'
                    ? 100
                    : undefined
                }
                step={0.25}
                value={rule.penalty_value ?? 0}
                onChange={(event) =>
                  onUpdate(rule.rule_id, {
                    penalty_value: clampPenaltyValue(Number(event.target.value))
                  })
                }
                className="h-8 w-16 rounded-none border-0 text-center shadow-none focus-visible:ring-0"
              />
              <Select
                value={rule.penalty_unit}
                onValueChange={(value) =>
                  onUpdate(rule.rule_id, {
                    penalty_unit: value as WhiteboxPenaltyUnit,
                    penalty_value: clampPenaltyValue(
                      Number(rule.penalty_value ?? 0),
                      value as WhiteboxPenaltyUnit
                    )
                  })
                }
              >
                <SelectTrigger className="h-8 w-[86px] rounded-none border-0 border-l text-xs shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABSOLUTE">điểm</SelectItem>
                  <SelectItem value="PERCENTAGE_OF_QUESTION">% câu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <button
            type="button"
            onClick={() => onRemove(rule.rule_id)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
            title="Xóa quy tắc"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
