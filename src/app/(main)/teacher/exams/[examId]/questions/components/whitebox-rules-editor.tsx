'use client'

import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Play
} from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { getWhiteboxCatalog, validateWhitebox } from '@/lib/actions'
import {
  WhiteboxCatalogItem,
  WhiteboxRule,
  WhiteboxSettings,
  WhiteboxValidationResult
} from '@/lib/types'
import { cn } from '@/lib/utils'

import { WhiteboxRuleRow } from './whitebox-rule-row'

interface WhiteboxRulesEditorProps {
  questionType: string
  totalPoints: number
  rules: WhiteboxRule[]
  settings: WhiteboxSettings
  onChange: (rules: WhiteboxRule[], settings: WhiteboxSettings) => void
  // Teacher's model answer; "Run on model answer" validation uses it (warns, never blocks).
  sqlForPreview?: string
}

function defaultRuleFromCatalog(item: WhiteboxCatalogItem): WhiteboxRule {
  const params: Record<string, unknown> = {}
  for (const spec of item.params) {
    if (spec.type === 'NUMBER' && typeof spec.defaultValue === 'number') {
      params[spec.name] = spec.defaultValue
    } else if (spec.type === 'STRING_LIST') {
      params[spec.name] = []
    }
  }
  return {
    rule_id: item.ruleId,
    enabled: true,
    type: item.type,
    penalty_value: item.defaultPenaltyValue,
    penalty_unit: item.defaultPenaltyUnit,
    severity: item.defaultSeverity,
    description: item.label,
    params
  }
}

const VIOLATION_STYLE: Record<
  string,
  { icon: typeof CheckCircle2; cls: string }
> = {
  FAIL: { icon: AlertTriangle, cls: 'text-rose-600 dark:text-rose-400' },
  WARN: { icon: AlertTriangle, cls: 'text-amber-600 dark:text-amber-400' },
  UNVERIFIED: { icon: HelpCircle, cls: 'text-slate-500 dark:text-slate-400' },
  PASS: { icon: CheckCircle2, cls: 'text-emerald-600 dark:text-emerald-400' }
}

export function WhiteboxRulesEditor({
  questionType,
  totalPoints,
  rules,
  settings,
  onChange,
  sqlForPreview
}: WhiteboxRulesEditorProps) {
  const [catalog, setCatalog] = useState<WhiteboxCatalogItem[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [validation, setValidation] = useState<WhiteboxValidationResult | null>(
    null
  )
  const [isValidating, startValidating] = useTransition()

  useEffect(() => {
    let active = true
    setLoadingCatalog(true)
    getWhiteboxCatalog(questionType)
      .then((res) => {
        if (!active) return
        setCatalog(res.data ?? [])
        setCatalogError(null)
      })
      .catch(
        () =>
          active && setCatalogError('Không tải được danh mục quy tắc whitebox.')
      )
      .finally(() => active && setLoadingCatalog(false))
    return () => {
      active = false
    }
  }, [questionType])

  const ruleById = useMemo(() => {
    const map = new Map<string, WhiteboxRule>()
    rules.forEach((rule) => map.set(rule.rule_id, rule))
    return map
  }, [rules])

  const toggle = (item: WhiteboxCatalogItem, checked: boolean) => {
    if (checked) {
      onChange([...rules, defaultRuleFromCatalog(item)], settings)
    } else {
      onChange(
        rules.filter((r) => r.rule_id !== item.ruleId),
        settings
      )
    }
  }

  const updateRule = (ruleId: string, patch: Partial<WhiteboxRule>) => {
    onChange(
      rules.map((r) => (r.rule_id === ruleId ? { ...r, ...patch } : r)),
      settings
    )
  }

  const updateSettings = (patch: Partial<WhiteboxSettings>) => {
    onChange(rules, { ...settings, ...patch })
  }

  const runValidation = () => {
    if (!sqlForPreview?.trim()) {
      toast.warning('Chưa có đáp án mẫu để chạy thử.')
      return
    }
    startValidating(async () => {
      try {
        const res = await validateWhitebox({
          questionType,
          sql: sqlForPreview,
          whiteboxRules: rules,
          whiteboxSettings: settings,
          questionPoints: totalPoints
        })
        setValidation(res.data ?? null)
      } catch {
        toast.error('Chạy thử whitebox thất bại.')
      }
    })
  }

  const modelAnswerViolations =
    validation?.violations.filter(
      (v) => v.status === 'FAIL' || v.status === 'WARN'
    ) ?? []

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/10">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-base font-semibold text-foreground">
          🔬 Chấm phương pháp (White-box)
        </span>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Kiểm tra <strong>cách viết</strong> câu truy vấn (JOIN, subquery, GROUP
        BY…), độc lập với kết quả. Danh mục quy tắc do backend cung cấp. Mặc
        định chỉ cảnh báo — chuyển sang “Trừ điểm” khi cần.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-4 rounded-lg bg-background/60 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Giới hạn tổng trừ:</span>
        <label className="flex items-center gap-1.5">
          Tuyệt đối
          <Input
            type="number"
            min={0}
            step={0.25}
            placeholder="∞"
            value={settings.max_total_deduction ?? ''}
            onChange={(e) =>
              updateSettings({
                max_total_deduction:
                  e.target.value === '' ? null : Number(e.target.value)
              })
            }
            className="h-8 w-24"
          />
          đ
        </label>
        <label className="flex items-center gap-1.5">
          Phần trăm
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            placeholder="∞"
            value={settings.max_total_deduction_pct ?? ''}
            onChange={(e) =>
              updateSettings({
                max_total_deduction_pct:
                  e.target.value === '' ? null : Number(e.target.value)
              })
            }
            className="h-8 w-20"
          />
          %
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={Boolean(settings.stop_on_first_violation)}
            onCheckedChange={(v) =>
              updateSettings({ stop_on_first_violation: v === true })
            }
          />
          Dừng ở vi phạm đầu tiên
        </label>
      </div>

      {loadingCatalog && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh mục quy
          tắc…
        </div>
      )}
      {catalogError && (
        <p className="text-sm text-rose-600 dark:text-rose-400">
          {catalogError}
        </p>
      )}

      {!loadingCatalog && !catalogError && (
        <div className="space-y-2">
          {catalog.map((item) => (
            <WhiteboxRuleRow
              key={item.ruleId}
              item={item}
              rule={ruleById.get(item.ruleId)}
              onToggle={toggle}
              onUpdate={updateRule}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={runValidation}
          disabled={isValidating}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Chạy thử trên đáp án mẫu
        </Button>
        {validation && !validation.sqlParseOk && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Đáp án mẫu không phân tích được cú pháp — các rule phụ thuộc parser
            không kiểm chứng được.
          </span>
        )}
      </div>

      {validation && (
        <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
          {modelAnswerViolations.length > 0 ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              ⚠️ Đáp án mẫu vi phạm {modelAnswerViolations.length} quy tắc —
              sinh viên làm giống đáp án cũng sẽ bị tính vi phạm. Hãy sửa đáp án
              mẫu hoặc tắt rule (vẫn cho phép lưu).
            </p>
          ) : (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              ✓ Đáp án mẫu không vi phạm quy tắc nào.
            </p>
          )}
          {validation.violations
            .filter((v) => v.status !== 'PASS')
            .map((v, idx) => {
              const style =
                VIOLATION_STYLE[v.status] ?? VIOLATION_STYLE.UNVERIFIED
              const Icon = style.icon
              return (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <Icon
                    className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', style.cls)}
                  />
                  <span>
                    <span className="font-medium">{v.label}</span>
                    {v.reason ? ` — ${v.reason}` : ''}
                    {v.deductedPoints > 0
                      ? ` (−${v.deductedPoints.toFixed(2)}đ)`
                      : ''}
                  </span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
