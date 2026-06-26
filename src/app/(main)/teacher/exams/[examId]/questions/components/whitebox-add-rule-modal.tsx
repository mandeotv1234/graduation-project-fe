'use client'

import { AlertTriangle, ArrowLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  WhiteboxCatalogItem,
  WhiteboxPenaltyUnit,
  WhiteboxRule,
  WhiteboxSeverity
} from '@/lib/types'
import { cn } from '@/lib/utils'

import {
  ACTION_HINT,
  buildFeatureActions,
  buildFeatureGroups,
  defaultRuleFromCatalog,
  FeatureActionGroup,
  GROUP_LABELS,
  OPERATOR_LABEL,
  policyAction,
  POLICY_BADGE_CLASS,
  requiredParamsSatisfied
} from './whitebox-authoring'

interface WhiteboxAddRuleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog: WhiteboxCatalogItem[]
  // Already-configured rules — excluded from the picker and used for conflict warnings.
  rules: WhiteboxRule[]
  catalogById: Map<string, WhiteboxCatalogItem>
  onAdd: (rule: WhiteboxRule) => void
}

// Black-box-style rule builder: object (Đối tượng) -> Action/Type (Cấm/Bắt buộc/Giới hạn) ->
// optional operator/match mode -> params -> penalty/severity. The configured tuple compiles to one
// supported backend rule_id; a rule is appended to whitebox_rules[] only on the footer "Thêm quy tắc".
export function WhiteboxAddRuleModal({
  open,
  onOpenChange,
  catalog,
  rules,
  catalogById,
  onAdd
}: WhiteboxAddRuleModalProps) {
  const [search, setSearch] = useState('')
  const [featureId, setFeatureId] = useState<string | null>(null)
  const [actionKey, setActionKey] = useState<string | null>(null)
  // The resolved catalog rule, plus its editable draft config (seeded from catalog defaults).
  const [draft, setDraft] = useState<WhiteboxRule | null>(null)

  useEffect(() => {
    if (!open) {
      setSearch('')
      setFeatureId(null)
      setActionKey(null)
      setDraft(null)
    }
  }, [open])

  const configuredIds = useMemo(
    () => new Set(rules.map((r) => r.rule_id)),
    [rules]
  )

  const featureGroups = useMemo(
    () => buildFeatureGroups(catalog, configuredIds, search),
    [catalog, configuredIds, search]
  )

  const activeFeature = useMemo(() => {
    if (!featureId) return null
    for (const group of featureGroups) {
      const found = group.features.find((f) => f.featureId === featureId)
      if (found) return found
    }
    return null
  }, [featureGroups, featureId])

  // Action/Type families available for the selected object, in backend order.
  const actionGroups = useMemo(
    () => (activeFeature ? buildFeatureActions(activeFeature) : []),
    [activeFeature]
  )

  const activeActionGroup = useMemo(
    () => actionGroups.find((g) => g.actionKey === actionKey) ?? null,
    [actionGroups, actionKey]
  )

  const selectedItem = draft ? (catalogById.get(draft.rule_id) ?? null) : null

  // Conflict warnings the draft would introduce against already-configured rules.
  const draftConflicts = useMemo(() => {
    if (!selectedItem) return [] as string[]
    const out: string[] = []
    const describe = (id: string) => {
      const item = catalogById.get(id)
      return item ? `${item.featureLabel} · ${item.policyLabel}` : id
    }
    for (const other of selectedItem.conflictsWith ?? []) {
      if (configuredIds.has(other)) out.push(describe(other))
    }
    if (
      selectedItem.ruleId === 'MAX_JOIN_COUNT' &&
      configuredIds.has('REQUIRED_JOIN') &&
      Number(draft?.params?.max_joins) === 0
    ) {
      out.push(describe('REQUIRED_JOIN'))
    }
    if (selectedItem.ruleId === 'REQUIRED_JOIN') {
      const mj = rules.find((r) => r.rule_id === 'MAX_JOIN_COUNT')
      if (mj && Number(mj.params?.max_joins) === 0) {
        out.push(`${describe('MAX_JOIN_COUNT')} = 0`)
      }
    }
    return out
  }, [selectedItem, draft, rules, configuredIds, catalogById])

  // Pick the object first; reset downstream action/draft.
  const selectFeature = (id: string) => {
    setFeatureId(id)
    setActionKey(null)
    setDraft(null)
  }

  const clearFeature = () => {
    setFeatureId(null)
    setActionKey(null)
    setDraft(null)
  }

  // Pick the Action/Type. Single-option actions resolve the ruleId immediately; multi-option
  // actions wait for the operator/match-mode sub-choice.
  const selectAction = (group: FeatureActionGroup) => {
    setActionKey(group.actionKey)
    setDraft(
      group.options.length === 1
        ? defaultRuleFromCatalog(group.options[0])
        : null
    )
  }

  const selectOperator = (item: WhiteboxCatalogItem) => {
    setDraft(defaultRuleFromCatalog(item))
  }

  const selectOperatorByRuleId = (ruleId: string) => {
    const item = activeActionGroup?.options.find(
      (option) => option.ruleId === ruleId
    )
    if (item) selectOperator(item)
  }

  const setParam = (name: string, value: unknown) => {
    setDraft((prev) =>
      prev
        ? { ...prev, params: { ...(prev.params ?? {}), [name]: value } }
        : prev
    )
  }

  const stringListValue = (name: string): string => {
    const raw = draft?.params?.[name]
    return Array.isArray(raw) ? (raw as string[]).join(',') : ''
  }

  const canAdd =
    !!selectedItem && requiredParamsSatisfied(selectedItem, draft?.params ?? {})

  const handleAdd = () => {
    if (!draft || !selectedItem) return
    onAdd({
      ...draft,
      description: (draft.description ?? '').trim() || selectedItem.label
    })
    onOpenChange(false)
  }

  const availableCount = featureGroups.reduce(
    (sum, g) => sum + g.features.reduce((s, f) => s + f.policies.length, 0),
    0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[760px] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle className="text-xl font-bold text-foreground">
            Thêm quy tắc cách viết
          </DialogTitle>
          <DialogDescription className="text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            Chọn đối tượng kiểm tra, cách xử lý, tham số rồi mức điểm — quy tắc
            chỉ được thêm khi bấm “Thêm quy tắc”.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-8">
          <div className="space-y-5">
            {/* Section 1 — object (feature) */}
            <section className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                1. Đối tượng kiểm tra
              </h5>
              {activeFeature ? (
                <button
                  type="button"
                  onClick={clearFeature}
                  className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">
                    {activeFeature.featureLabel}
                  </span>
                  <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    đổi đối tượng khác
                  </span>
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm đối tượng kiểm tra…"
                      className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <div className="max-h-[calc(100dvh-23rem)] min-h-80 overflow-y-auto rounded-md border">
                    {availableCount === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Không còn đối tượng phù hợp.
                      </p>
                    ) : (
                      featureGroups.map((group) => (
                        <div key={group.key} className="py-1">
                          <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {GROUP_LABELS[group.key] ?? group.key}
                          </div>
                          {group.features.map((feature) => {
                            const actionCount = new Set(
                              feature.policies.map((p) =>
                                policyAction(p.policy)
                              )
                            ).size
                            return (
                              <button
                                key={feature.featureId}
                                type="button"
                                onClick={() => selectFeature(feature.featureId)}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                              >
                                <span className="flex-1">
                                  <span className="block font-medium">
                                    {feature.featureLabel}
                                  </span>
                                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {actionCount} cách xử lý
                                  </span>
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                              </button>
                            )
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </section>

            {/* Section 2 — Action/Type */}
            {activeFeature && (
              <section className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  2. Cách xử lý
                </h5>
                <div className="grid gap-1.5 sm:grid-cols-3">
                  {actionGroups.map((group) => {
                    const selected = group.actionKey === actionKey
                    // Operator hint shown only when the single option carries a match mode.
                    const hint =
                      group.options.length === 1
                        ? OPERATOR_LABEL[group.options[0].policy]
                        : undefined
                    return (
                      <button
                        key={group.actionKey}
                        type="button"
                        onClick={() => selectAction(group)}
                        className={cn(
                          'flex flex-col gap-1 rounded-md border px-3 py-2 text-left text-sm text-foreground hover:bg-muted',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        )}
                      >
                        <span className="flex items-center gap-1.5 font-semibold">
                          {group.actionLabel}
                          {hint && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              {hint}
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {ACTION_HINT[group.actionKey]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Section 2b — scope/match mode (only when an action maps to >1 backend rule) */}
            {activeActionGroup && activeActionGroup.options.length > 1 && (
              <section className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Phạm vi áp dụng
                </h5>
                <Select
                  value={draft?.rule_id ?? ''}
                  onValueChange={selectOperatorByRuleId}
                >
                  <SelectTrigger className="h-10 w-full text-left font-semibold text-foreground">
                    <SelectValue placeholder="Chọn phạm vi kiểm tra" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    className="w-[var(--radix-select-trigger-width)]"
                  >
                    {activeActionGroup.options.map((item) => (
                      <SelectItem key={item.ruleId} value={item.ruleId}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Chọn rule cụ thể trong nhóm “
                  {activeFeature?.featureLabel ?? 'đối tượng đã chọn'}”.
                </p>
              </section>
            )}

            {/* Section 3-5 — params, penalty/severity, description */}
            {selectedItem && draft && (
              <>
                {/* Resolved backend rule shown as technical reference only. */}
                <p className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                      POLICY_BADGE_CLASS[selectedItem.policy] ?? ''
                    )}
                  >
                    {selectedItem.policyLabel}
                  </span>
                  <span>{selectedItem.description}</span>
                  <span className="font-mono">({selectedItem.ruleId})</span>
                </p>

                <section className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    3. Tham số
                  </h5>
                  {selectedItem.params.length === 0 ? (
                    <p className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      Quy tắc này không cần tham số.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      {selectedItem.params.map((spec) =>
                        spec.type === 'NUMBER' ? (
                          <label
                            key={spec.name}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                          >
                            {spec.label}
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={Number(
                                draft.params?.[spec.name] ??
                                  (typeof spec.defaultValue === 'number'
                                    ? spec.defaultValue
                                    : 0)
                              )}
                              onChange={(e) =>
                                setParam(spec.name, Number(e.target.value))
                              }
                              className="h-8 w-24"
                            />
                          </label>
                        ) : (
                          <label
                            key={spec.name}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
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
                              className="h-8 w-56"
                            />
                          </label>
                        )
                      )}
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    4. Điểm trừ và mức áp dụng
                  </h5>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <label className="flex items-center gap-1.5">
                      Trừ
                      <Input
                        type="number"
                        min={0}
                        step={0.25}
                        value={draft.penalty_value ?? 0}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            penalty_value: Number(e.target.value)
                          })
                        }
                        className="h-8 w-24"
                      />
                    </label>
                    <Select
                      value={draft.penalty_unit}
                      onValueChange={(v) =>
                        setDraft({
                          ...draft,
                          penalty_unit: v as WhiteboxPenaltyUnit
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABSOLUTE">điểm</SelectItem>
                        <SelectItem value="PERCENTAGE_OF_QUESTION">
                          % câu
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={draft.severity}
                      onValueChange={(v) =>
                        setDraft({
                          ...draft,
                          severity: v as WhiteboxSeverity
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WARNING_ONLY">
                          Chỉ cảnh báo
                        </SelectItem>
                        <SelectItem value="DEDUCTION">Trừ điểm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </section>

                <section className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    5. Mô tả
                  </h5>
                  <Input
                    type="text"
                    value={draft.description ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                    placeholder={selectedItem.label}
                    className="h-9"
                  />
                </section>

                {draftConflicts.length > 0 && (
                  <p className="flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Mâu thuẫn với: {draftConflicts.join(', ')} (vẫn cho phép
                      thêm).
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t bg-background px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button type="button" onClick={handleAdd} disabled={!canAdd}>
            Thêm quy tắc
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
