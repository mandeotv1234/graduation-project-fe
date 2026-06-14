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
import { ScrollArea } from '@/components/ui/scroll-area'
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
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Thêm quy tắc white-box</DialogTitle>
          <DialogDescription>
            Chọn đối tượng kiểm tra, cách xử lý, tham số rồi mức điểm — quy tắc
            chỉ được thêm khi bấm “Thêm quy tắc”.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-5 px-5 py-4">
            {/* Section 1 — object (feature) */}
            <section className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Đối tượng kiểm tra
              </h5>
              {activeFeature ? (
                <button
                  type="button"
                  onClick={clearFeature}
                  className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {activeFeature.featureLabel}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    đổi đối tượng khác
                  </span>
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm đối tượng kiểm tra…"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-md border">
                    {availableCount === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Không còn đối tượng phù hợp.
                      </p>
                    ) : (
                      featureGroups.map((group) => (
                        <div key={group.key} className="py-1">
                          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
                              >
                                <span className="flex-1">
                                  <span className="block">
                                    {feature.featureLabel}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    {actionCount} cách xử lý
                                  </span>
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                          'flex flex-col gap-0.5 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        )}
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          {group.actionLabel}
                          {hint && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                              {hint}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ACTION_HINT[group.actionKey]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Section 2b — operator/match mode (only when an action maps to >1 policy) */}
            {activeActionGroup && activeActionGroup.options.length > 1 && (
              <section className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Chế độ khớp
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {activeActionGroup.options.map((item) => {
                    const selected = draft?.rule_id === item.ruleId
                    return (
                      <button
                        key={item.ruleId}
                        type="button"
                        onClick={() => selectOperator(item)}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-sm hover:bg-muted',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        )}
                      >
                        {OPERATOR_LABEL[item.policy] ?? item.policyLabel}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Section 3-5 — params, penalty/severity, description */}
            {selectedItem && draft && (
              <>
                {/* Resolved backend rule shown as technical reference only. */}
                <p className="flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
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
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    3. Tham số
                  </h5>
                  {selectedItem.params.length === 0 ? (
                    <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      Quy tắc này không cần tham số.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      {selectedItem.params.map((spec) =>
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
                              className="h-8 w-56"
                            />
                          </label>
                        )
                      )}
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    4. Điểm trừ và mức áp dụng
                  </h5>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                    <select
                      value={draft.penalty_unit}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          penalty_unit: e.target.value as WhiteboxPenaltyUnit
                        })
                      }
                      className="h-8 rounded-md border border-input bg-background px-2"
                    >
                      <option value="ABSOLUTE">điểm</option>
                      <option value="PERCENTAGE_OF_QUESTION">% câu</option>
                    </select>
                    <select
                      value={draft.severity}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          severity: e.target.value as WhiteboxSeverity
                        })
                      }
                      className="h-8 rounded-md border border-input bg-background px-2"
                    >
                      <option value="WARNING_ONLY">Chỉ cảnh báo</option>
                      <option value="DEDUCTION">Trừ điểm</option>
                    </select>
                  </div>
                </section>

                <section className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
        </ScrollArea>

        <DialogFooter className="border-t px-5 py-3">
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
