'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  WhiteboxCatalogItem,
  WhiteboxPenaltyUnit,
  WhiteboxRule,
  WhiteboxSeverity
} from '@/lib/types'

interface WhiteboxRuleRowProps {
  item: WhiteboxCatalogItem
  rule?: WhiteboxRule
  onToggle: (item: WhiteboxCatalogItem, checked: boolean) => void
  onUpdate: (ruleId: string, patch: Partial<WhiteboxRule>) => void
}

const TYPE_BADGE: Record<string, string> = {
  FORBIDDEN: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  REQUIRED:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  LIMIT: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
}

export function WhiteboxRuleRow({
  item,
  rule,
  onToggle,
  onUpdate
}: WhiteboxRuleRowProps) {
  const checked = Boolean(rule)

  const setParam = (name: string, value: unknown) => {
    onUpdate(item.ruleId, {
      params: { ...(rule?.params ?? {}), [name]: value }
    })
  }

  const stringListValue = (name: string): string => {
    const raw = rule?.params?.[name]
    return Array.isArray(raw) ? (raw as string[]).join(',') : ''
  }

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="flex flex-1 items-center gap-2 text-sm">
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => onToggle(item, value === true)}
          />
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold',
              TYPE_BADGE[item.type] ?? ''
            )}
          >
            {item.type}
          </span>
          <span>{item.label}</span>
        </label>

        {checked && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Trừ
              <Input
                type="number"
                min={0}
                step={0.25}
                value={rule?.penalty_value ?? 0}
                onChange={(e) =>
                  onUpdate(item.ruleId, {
                    penalty_value: Number(e.target.value)
                  })
                }
                className="h-8 w-20"
              />
            </label>
            <select
              value={rule?.penalty_unit}
              onChange={(e) =>
                onUpdate(item.ruleId, {
                  penalty_unit: e.target.value as WhiteboxPenaltyUnit
                })
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="ABSOLUTE">điểm</option>
              <option value="PERCENTAGE_OF_QUESTION">% câu</option>
            </select>
            <select
              value={rule?.severity}
              onChange={(e) =>
                onUpdate(item.ruleId, {
                  severity: e.target.value as WhiteboxSeverity
                })
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="WARNING_ONLY">⚠️ Chỉ cảnh báo</option>
              <option value="DEDUCTION">🔴 Trừ điểm</option>
            </select>
          </>
        )}
      </div>

      {checked && item.params.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-3 pl-6">
          {item.params.map((spec) =>
            spec.type === 'NUMBER' ? (
              <label
                key={spec.name}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                {spec.label}
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={Number(
                    rule?.params?.[spec.name] ??
                      (typeof spec.defaultValue === 'number'
                        ? spec.defaultValue
                        : 0)
                  )}
                  onChange={(e) => setParam(spec.name, Number(e.target.value))}
                  className="h-8 w-20"
                />
              </label>
            ) : (
              <label
                key={spec.name}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                {spec.label}
                <Input
                  type="text"
                  placeholder="VD: COUNT,SUM"
                  value={stringListValue(spec.name)}
                  onChange={(e) =>
                    setParam(
                      spec.name,
                      e.target.value
                        .split(',')
                        .map((token) => token.trim())
                        .filter(Boolean)
                    )
                  }
                  className="h-8 w-44"
                />
              </label>
            )
          )}
        </div>
      )}

      {checked && (
        <p className="mt-1.5 pl-6 text-xs text-muted-foreground">
          {item.description}
        </p>
      )}
    </div>
  )
}
