'use client'

import { Trash2 } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  WhiteboxCatalogItem,
  WhiteboxPenaltyUnit,
  WhiteboxRule,
  WhiteboxSeverity
} from '@/lib/types'
import { normalizeWhiteboxRulePenalty } from './whitebox-authoring'

interface WhiteboxRuleRowProps {
  item: WhiteboxCatalogItem
  rule: WhiteboxRule
  onUpdate: (ruleId: string, patch: Partial<WhiteboxRule>) => void
  onRemove: (ruleId: string) => void
}

export function WhiteboxRuleRow({
  item,
  rule,
  onUpdate,
  onRemove
}: WhiteboxRuleRowProps) {
  const disabled = rule.enabled === false

  const setParam = (name: string, value: unknown) => {
    onUpdate(item.ruleId, { params: { ...(rule.params ?? {}), [name]: value } })
  }

  const stringListValue = (name: string): string => {
    const raw = rule.params?.[name]
    return Array.isArray(raw) ? (raw as string[]).join(',') : ''
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-background/60 px-3 py-2',
        disabled && 'opacity-55'
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Checkbox
          checked={!disabled}
          onCheckedChange={(value) =>
            onUpdate(item.ruleId, { enabled: value === true })
          }
          title={disabled ? 'Đang tắt — bật lại' : 'Đang bật — tắt tạm'}
        />
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            item.policy === 'FORBID' || item.policy === 'FORBID_ANY'
              ? 'bg-rose-500'
              : item.policy === 'REQUIRE' ||
                  item.policy === 'REQUIRE_ANY' ||
                  item.policy === 'REQUIRE_ALL'
                ? 'bg-emerald-500'
                : 'bg-amber-500'
          )}
          title={item.policyLabel}
        />
        <span className="flex-1" title={item.description}>
          <span className="block text-sm">{item.featureLabel}</span>
          <span className="block font-mono text-[10px] text-muted-foreground">
            {item.ruleId}
          </span>
        </span>

        <Select
          value={rule.severity}
          onValueChange={(v) =>
            onUpdate(
              item.ruleId,
              normalizeWhiteboxRulePenalty(
                { ...rule, severity: v as WhiteboxSeverity },
                item
              )
            )
          }
        >
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WARNING_ONLY">Chỉ cảnh báo</SelectItem>
            <SelectItem value="DEDUCTION">Trừ điểm</SelectItem>
          </SelectContent>
        </Select>
        {rule.severity === 'DEDUCTION' && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Trừ
              <Input
                type="number"
                min={0}
                step={0.25}
                value={rule.penalty_value ?? 0}
                onChange={(e) =>
                  onUpdate(item.ruleId, {
                    penalty_value: Number(e.target.value)
                  })
                }
                className="h-8 w-20"
              />
            </label>
            <Select
              value={rule.penalty_unit}
              onValueChange={(v) =>
                onUpdate(item.ruleId, {
                  penalty_unit: v as WhiteboxPenaltyUnit
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
          </>
        )}
        <button
          type="button"
          onClick={() => onRemove(item.ruleId)}
          className="text-muted-foreground transition-colors hover:text-rose-600"
          title="Xóa quy tắc"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {item.params.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-3 pl-7">
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
                    rule.params?.[spec.name] ??
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
    </div>
  )
}
