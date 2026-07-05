'use client'

import { AlertTriangle, Trash2 } from 'lucide-react'

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
import {
  normalizeWhiteboxRulePenalty,
  requiredParamsSatisfied,
  WhiteboxDisplayRule
} from './whitebox-authoring'

interface WhiteboxRuleRowProps {
  item: WhiteboxCatalogItem
  rule: WhiteboxRule
  displayRule?: WhiteboxDisplayRule | null
  onUpdate: (ruleId: string, patch: Partial<WhiteboxRule>) => void
  onRemove: (ruleId: string) => void
}

function getPolicyMeta(policy: WhiteboxCatalogItem['policy']) {
  if (policy === 'FORBID' || policy === 'FORBID_ANY') {
    return {
      label: 'Cấm',
      className:
        'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/50'
    }
  }

  if (policy === 'REQUIRE_ALL') {
    return {
      label: 'Bắt buộc tất cả',
      className:
        'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50'
    }
  }

  if (policy === 'REQUIRE' || policy === 'REQUIRE_ANY') {
    return {
      label: 'Bắt buộc',
      className:
        'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50'
    }
  }

  if (policy === 'AT_MOST') {
    return {
      label: 'Tối đa',
      className:
        'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50'
    }
  }

  if (policy === 'AT_LEAST') {
    return {
      label: 'Tối thiểu',
      className:
        'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50'
    }
  }

  return {
    label: 'Chính xác',
    className:
      'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50'
  }
}

export function WhiteboxRuleRow({
  item,
  rule,
  displayRule,
  onUpdate,
  onRemove
}: WhiteboxRuleRowProps) {
  const disabled = rule.enabled === false
  const paramsSatisfied = requiredParamsSatisfied(item, rule.params ?? {})
  const policy = getPolicyMeta(item.policy)

  const setParam = (name: string, value: unknown) => {
    onUpdate(rule.rule_id, {
      params: { ...(rule.params ?? {}), [name]: value }
    })
  }

  const clampPenaltyValue = (value: number, unit = rule.penalty_unit) =>
    unit === 'PERCENTAGE_OF_QUESTION'
      ? Math.min(Math.max(value, 0), 100)
      : Math.max(value, 0)

  const parsePenaltyValue = (value: string, fallback = 0) => {
    if (value.trim() === '') return 0
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const stringListValue = (name: string): string => {
    const raw = rule.params?.[name]
    return Array.isArray(raw) ? (raw as string[]).join(',') : ''
  }

  return (
    <div
      className={cn(
        'px-4 py-3 transition-colors hover:bg-muted/35',
        disabled && 'opacity-55'
      )}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'mt-0.5 inline-flex min-w-20 shrink-0 justify-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1',
              policy.className
            )}
          >
            {policy.label}
          </span>

          <div className="min-w-0 flex-1" title={item.description}>
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-sm font-semibold text-foreground">
                {displayRule?.featureLabel ?? item.featureLabel}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {rule.rule_id}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {displayRule?.description ?? item.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {displayRule && displayRule.variants.length > 1 && (
            <Select
              value={rule.rule_id}
              onValueChange={(nextRuleId) => {
                const nextVariant = displayRule.variants.find(
                  (variant) => variant.item.ruleId === nextRuleId
                )
                if (!nextVariant) return
                onUpdate(rule.rule_id, {
                  rule_id: nextVariant.item.ruleId,
                  type: nextVariant.item.type,
                  description: nextVariant.item.label,
                  params: {}
                })
              }}
            >
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {displayRule.variants.map((variant) => (
                  <SelectItem
                    key={variant.item.ruleId}
                    value={variant.item.ruleId}
                  >
                    {variant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={rule.severity}
            onValueChange={(v) =>
              onUpdate(
                rule.rule_id,
                normalizeWhiteboxRulePenalty(
                  { ...rule, severity: v as WhiteboxSeverity },
                  item
                )
              )
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
                onChange={(e) =>
                  onUpdate(rule.rule_id, {
                    penalty_value: clampPenaltyValue(
                      parsePenaltyValue(e.target.value, rule.penalty_value ?? 0)
                    )
                  })
                }
                className="h-8 w-16 rounded-none border-0 text-center shadow-none focus-visible:ring-0"
              />
              <Select
                value={rule.penalty_unit}
                onValueChange={(v) =>
                  onUpdate(rule.rule_id, {
                    penalty_unit: v as WhiteboxPenaltyUnit,
                    penalty_value: clampPenaltyValue(
                      parsePenaltyValue(String(rule.penalty_value ?? 0)),
                      v as WhiteboxPenaltyUnit
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

      {item.params.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-muted/35 px-3 py-2">
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

      {!paramsSatisfied && (
        <p className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Quy tắc này cần nhập đầy đủ tham số để có hiệu lực.
        </p>
      )}
    </div>
  )
}
