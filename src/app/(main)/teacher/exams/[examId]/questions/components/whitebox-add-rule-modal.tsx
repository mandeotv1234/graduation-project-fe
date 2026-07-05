'use client'

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Pencil,
  Play,
  Plus,
  Save,
  Search,
  ShieldAlert,
  Trash2
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  createRulePreset,
  deleteRulePreset,
  getRulePresets,
  updateRulePreset
} from '@/lib/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { WhiteboxCatalogItem, WhiteboxRule } from '@/lib/types'
import { cn } from '@/lib/utils'

import {
  buildWhiteboxDisplayGroups,
  defaultCustomRegexRule,
  defaultRuleFromCatalog,
  GROUP_LABELS,
  POLICY_BADGE_CLASS,
  WhiteboxDisplayRule
} from './whitebox-authoring'
import { TeacherSqlEditor } from './teacher-sql-editor'

type ModalMode = 'LIST' | 'CUSTOM_REGEX'
type CustomRegexPolicy = 'FORBID' | 'REQUIRE'
const CUSTOM_RULE_PRESET_KIND = 'WHITEBOX_CUSTOM_RULE'

interface CustomRuleLibraryItem {
  presetId: number
  presetName: string
  rule: WhiteboxRule
}

interface WhiteboxAddRuleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questionType: string
  catalog: WhiteboxCatalogItem[]
  rules: WhiteboxRule[]
  catalogById: Map<string, WhiteboxCatalogItem>
  onAdd: (rule: WhiteboxRule) => void
}

function customParam(rule: WhiteboxRule, name: string, fallback = ''): string {
  const value = rule.params?.[name]
  return typeof value === 'string' ? value : fallback
}

function customPolicy(rule: WhiteboxRule): CustomRegexPolicy {
  return customParam(rule, 'policy', 'FORBID') === 'REQUIRE'
    ? 'REQUIRE'
    : 'FORBID'
}

export function WhiteboxAddRuleModal({
  open,
  onOpenChange,
  questionType,
  catalog,
  rules,
  onAdd
}: WhiteboxAddRuleModalProps) {
  const [mode, setMode] = useState<ModalMode>('LIST')
  const [search, setSearch] = useState('')
  const [customRules, setCustomRules] = useState<CustomRuleLibraryItem[]>([])
  const [loadingCustomRules, setLoadingCustomRules] = useState(false)
  const [savingCustomRule, setSavingCustomRule] = useState(false)
  const [editingCustomRuleId, setEditingCustomRuleId] = useState<number | null>(
    null
  )
  const [customName, setCustomName] = useState('Rule regex tùy chỉnh')
  const [customPolicyValue, setCustomPolicyValue] =
    useState<CustomRegexPolicy>('FORBID')
  const [customPattern, setCustomPattern] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [customSampleSql, setCustomSampleSql] = useState('')
  const [customTestResult, setCustomTestResult] = useState<{
    ok: boolean
    message: string
    match?: string
  } | null>(null)

  useEffect(() => {
    if (!open) {
      setMode('LIST')
      setSearch('')
      setEditingCustomRuleId(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    let active = true

    const loadCustomRules = async () => {
      setLoadingCustomRules(true)
      try {
        const response = await getRulePresets(
          questionType,
          CUSTOM_RULE_PRESET_KIND
        )
        if (!active) return

        const nextRules = (response.data ?? [])
          .map((preset) => {
            try {
              const parsed = JSON.parse(preset.rulesJson) as
                | WhiteboxRule
                | WhiteboxRule[]
              const rule = Array.isArray(parsed) ? parsed[0] : parsed
              return rule && rule.type === 'CUSTOM_REGEX'
                ? {
                    presetId: preset.id,
                    presetName: preset.name,
                    rule
                  }
                : null
            } catch {
              return null
            }
          })
          .filter((rule): rule is CustomRuleLibraryItem => rule !== null)

        setCustomRules(nextRules)
      } catch {
        if (active) {
          toast.error('Không tải được thư viện regex tùy chỉnh')
        }
      } finally {
        if (active) setLoadingCustomRules(false)
      }
    }

    void loadCustomRules()

    return () => {
      active = false
    }
  }, [open, questionType])

  const configuredIds = useMemo(
    () => new Set(rules.map((rule) => rule.rule_id)),
    [rules]
  )

  const customRegexError = useMemo(() => {
    if (!customPattern.trim()) return 'Cần nhập regex trước khi lưu.'
    if (customPattern.length > 500) {
      return 'Regex không được vượt quá 500 ký tự.'
    }

    try {
      new RegExp(customPattern, 'i')
      return null
    } catch {
      return 'Regex chưa hợp lệ.'
    }
  }, [customPattern])

  const visibleCustomRules = useMemo(() => {
    const term = search.trim().toLowerCase()
    return customRules.filter((entry) => {
      const rule = entry.rule
      if (configuredIds.has(entry.rule.rule_id)) return false
      if (!term) return true

      const haystack = [
        entry.rule.rule_id,
        customParam(entry.rule, 'name', entry.rule.description ?? ''),
        customPolicy(rule) === 'FORBID' ? 'Cấm' : 'Bắt buộc',
        customParam(entry.rule, 'pattern'),
        customParam(entry.rule, 'message')
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [configuredIds, customRules, search])

  const groupedItems = useMemo(() => {
    return buildWhiteboxDisplayGroups(catalog, configuredIds, search)
  }, [catalog, configuredIds, search])

  const handlePick = (displayRule: WhiteboxDisplayRule) => {
    const defaultVariant =
      displayRule.variants.find((variant) => variant.label === 'Bất kỳ') ??
      displayRule.variants[0]
    if (!defaultVariant) return
    onAdd(defaultRuleFromCatalog(defaultVariant.item))
    onOpenChange(false)
  }

  const handlePickCustomRule = (entry: CustomRuleLibraryItem) => {
    onAdd({ ...entry.rule, params: { ...(entry.rule.params ?? {}) } })
    onOpenChange(false)
  }

  const handleEditCustomRule = (entry: CustomRuleLibraryItem) => {
    setEditingCustomRuleId(entry.presetId)
    setCustomName(customParam(entry.rule, 'name', entry.rule.description ?? ''))
    setCustomPolicyValue(customPolicy(entry.rule))
    setCustomPattern(customParam(entry.rule, 'pattern'))
    setCustomMessage(customParam(entry.rule, 'message'))
    setCustomSampleSql('')
    setCustomTestResult(null)
    setMode('CUSTOM_REGEX')
  }

  const handleDeleteCustomRule = async (entry: CustomRuleLibraryItem) => {
    try {
      await deleteRulePreset(entry.presetId)
      setCustomRules((prev) =>
        prev.filter((item) => item.presetId !== entry.presetId)
      )
      if (editingCustomRuleId === entry.presetId) {
        setEditingCustomRuleId(null)
        resetCustomForm()
        setMode('LIST')
      }
      toast.success('Đã xóa rule regex khỏi thư viện')
    } catch {
      toast.error('Xóa rule regex thất bại')
    }
  }

  const handleTestCustomRegex = () => {
    if (customRegexError) {
      setCustomTestResult({ ok: false, message: customRegexError })
      return
    }

    const regex = new RegExp(customPattern, 'i')
    const match = regex.exec(customSampleSql)
    const matched = Boolean(match)
    const violated = customPolicyValue === 'FORBID' ? matched : !matched

    setCustomTestResult({
      ok: !violated,
      match: match?.[0],
      message: matched
        ? customPolicyValue === 'FORBID'
          ? 'SQL mẫu khớp regex. Với rule Cấm, đây là vi phạm.'
          : 'SQL mẫu khớp regex. Với rule Bắt buộc, cấu hình này đạt.'
        : customPolicyValue === 'FORBID'
          ? 'SQL mẫu không khớp regex. Với rule Cấm, cấu hình này đạt.'
          : 'SQL mẫu không khớp regex. Với rule Bắt buộc, đây là vi phạm.'
    })
  }

  const resetCustomForm = () => {
    setCustomName('Rule regex tùy chỉnh')
    setCustomPolicyValue('FORBID')
    setCustomPattern('')
    setCustomMessage('')
    setCustomSampleSql('')
    setCustomTestResult(null)
  }

  const handleBackToList = () => {
    setEditingCustomRuleId(null)
    resetCustomForm()
    setMode('LIST')
  }

  const handleStartCreateCustomRule = () => {
    setEditingCustomRuleId(null)
    resetCustomForm()
    setMode('CUSTOM_REGEX')
  }

  const handleSaveCustomRegex = async () => {
    if (customRegexError) {
      setCustomTestResult({ ok: false, message: customRegexError })
      return
    }

    const base = defaultCustomRegexRule()
    const name = customName.trim() || 'Rule regex tùy chỉnh'
    const savedRule: WhiteboxRule = {
      ...base,
      description: name,
      params: {
        name,
        policy: customPolicyValue,
        pattern: customPattern.trim(),
        case_insensitive: true,
        message: customMessage.trim()
      }
    }

    setSavingCustomRule(true)
    try {
      if (editingCustomRuleId !== null) {
        await updateRulePreset(editingCustomRuleId, {
          name,
          rulesJson: JSON.stringify(savedRule)
        })
        setCustomRules((prev) =>
          prev.map((entry) =>
            entry.presetId === editingCustomRuleId
              ? { ...entry, presetName: name, rule: savedRule }
              : entry
          )
        )
      } else {
        const response = await createRulePreset({
          name,
          questionType,
          rulesJson: JSON.stringify(savedRule),
          kind: CUSTOM_RULE_PRESET_KIND
        })
        const createdPreset = response.data
        if (createdPreset) {
          setCustomRules((prev) => [
            {
              presetId: createdPreset.id,
              presetName: createdPreset.name,
              rule: savedRule
            },
            ...prev
          ])
        }
      }
      resetCustomForm()
      setEditingCustomRuleId(null)
      setSearch('')
      setMode('LIST')
      toast.success(
        editingCustomRuleId !== null
          ? 'Đã cập nhật rule regex trong thư viện'
          : 'Đã lưu rule regex vào thư viện'
      )
    } catch {
      toast.error(
        editingCustomRuleId !== null
          ? 'Cập nhật rule regex thất bại'
          : 'Lưu rule regex thất bại'
      )
    } finally {
      setSavingCustomRule(false)
    }
  }

  const visibleCount =
    groupedItems.reduce((total, group) => total + group.items.length, 0) +
    visibleCustomRules.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[800px] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-slate-100 bg-background px-6 py-4">
          <div className="flex min-w-0 items-start gap-4">
            {mode === 'CUSTOM_REGEX' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="h-9 w-9 shrink-0 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Quay lại"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                {mode === 'CUSTOM_REGEX'
                  ? 'Tạo rule regex tùy chỉnh'
                  : 'Thêm quy tắc cách viết'}
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-3xl text-sm leading-5 text-slate-500 dark:text-slate-300">
                {mode === 'CUSTOM_REGEX'
                  ? 'Kiểm thử pattern bằng SQL mẫu, lưu rule, rồi chọn rule đó trong danh sách.'
                  : 'Chọn rule có sẵn hoặc tự tạo regex để kiểm soát cách sinh viên viết SQL.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {mode === 'LIST' && (
          <RuleLibraryToolbar
            search={search}
            resultCount={visibleCount}
            onSearchChange={setSearch}
            onCreateCustom={handleStartCreateCustomRule}
          />
        )}

        {mode === 'CUSTOM_REGEX' ? (
          <CustomRegexBuilder
            customName={customName}
            customPolicyValue={customPolicyValue}
            customPattern={customPattern}
            customMessage={customMessage}
            customSampleSql={customSampleSql}
            customRegexError={customRegexError}
            customTestResult={customTestResult}
            onNameChange={setCustomName}
            onPolicyChange={setCustomPolicyValue}
            onPatternChange={(value) => {
              setCustomPattern(value)
              setCustomTestResult(null)
            }}
            onMessageChange={setCustomMessage}
            onSampleSqlChange={setCustomSampleSql}
            onTest={handleTestCustomRegex}
            onSave={handleSaveCustomRegex}
            savingCustomRule={savingCustomRule}
          />
        ) : (
          <RuleLibrary
            loadingCustomRules={loadingCustomRules}
            visibleCustomRules={visibleCustomRules}
            groupedItems={groupedItems}
            hasVisibleRules={visibleCount > 0}
            onPickCustomRule={handlePickCustomRule}
            onEditCustomRule={handleEditCustomRule}
            onDeleteCustomRule={handleDeleteCustomRule}
            onPickCatalogRule={handlePick}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RuleLibraryToolbar({
  search,
  resultCount,
  onSearchChange,
  onCreateCustom
}: {
  search: string
  resultCount: number
  onSearchChange: (value: string) => void
  onCreateCustom: () => void
}) {
  return (
    <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
        <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            autoFocus
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm rule, keyword, nhóm..."
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-slate-400"
          />
          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {resultCount}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onCreateCustom}
          className="h-10 justify-center gap-2 rounded-lg border-blue-200 bg-blue-50 px-4 font-semibold text-blue-700 shadow-sm hover:bg-blue-100 hover:text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
        >
          <Plus className="h-4 w-4" />
          Regex tùy chỉnh
        </Button>
      </div>
    </div>
  )
}

function RuleLibrary({
  loadingCustomRules,
  visibleCustomRules,
  groupedItems,
  hasVisibleRules,
  onPickCustomRule,
  onEditCustomRule,
  onDeleteCustomRule,
  onPickCatalogRule
}: {
  loadingCustomRules: boolean
  visibleCustomRules: CustomRuleLibraryItem[]
  groupedItems: Array<{ key: string; items: WhiteboxDisplayRule[] }>
  hasVisibleRules: boolean
  onPickCustomRule: (entry: CustomRuleLibraryItem) => void
  onEditCustomRule: (entry: CustomRuleLibraryItem) => void
  onDeleteCustomRule: (entry: CustomRuleLibraryItem) => void | Promise<void>
  onPickCatalogRule: (item: WhiteboxDisplayRule) => void
}) {
  if (!hasVisibleRules) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-6 dark:bg-slate-950/40">
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          Không còn rule phù hợp để thêm.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-6 dark:bg-slate-950/40">
      <div className="space-y-5">
        {loadingCustomRules && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải thư viện regex tùy chỉnh...
          </div>
        )}

        {visibleCustomRules.length > 0 && (
          <RuleSection
            title="Regex tùy chỉnh"
            count={visibleCustomRules.length}
          >
            {visibleCustomRules.map((entry) => (
              <CustomRuleButton
                key={entry.presetId}
                entry={entry}
                onClick={() => onPickCustomRule(entry)}
                onEdit={() => onEditCustomRule(entry)}
                onDelete={() => void onDeleteCustomRule(entry)}
              />
            ))}
          </RuleSection>
        )}

        {groupedItems.map((group) => (
          <RuleSection
            key={group.key}
            title={GROUP_LABELS[group.key] ?? group.key}
            count={group.items.length}
          >
            {group.items.map((item) => (
              <CatalogRuleButton
                key={item.key}
                item={item}
                onClick={() => onPickCatalogRule(item)}
              />
            ))}
          </RuleSection>
        ))}
      </div>
    </div>
  )
}

function RuleSection({
  title,
  count,
  children
}: {
  title: string
  count: number
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h5 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {title}
        </h5>
        <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
          {count}
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {children}
      </div>
    </section>
  )
}

function CustomRegexBuilder({
  customName,
  customPolicyValue,
  customPattern,
  customMessage,
  customSampleSql,
  customRegexError,
  customTestResult,
  onNameChange,
  onPolicyChange,
  onPatternChange,
  onMessageChange,
  onSampleSqlChange,
  onTest,
  onSave,
  savingCustomRule
}: {
  customName: string
  customPolicyValue: CustomRegexPolicy
  customPattern: string
  customMessage: string
  customSampleSql: string
  customRegexError: string | null
  customTestResult: { ok: boolean; message: string; match?: string } | null
  onNameChange: (value: string) => void
  onPolicyChange: (value: CustomRegexPolicy) => void
  onPatternChange: (value: string) => void
  onMessageChange: (value: string) => void
  onSampleSqlChange: (value: string) => void
  onTest: () => void
  onSave: () => void | Promise<void>
  savingCustomRule: boolean
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 dark:bg-slate-950/40">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <BuilderPanel title="Định nghĩa Rule" accentColor="blue">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Field label="Tên rule" hint="Tên này sẽ hiển thị trong thư viện">
                <div className="group flex h-11 items-center rounded-md border border-slate-300 bg-white transition-colors focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-slate-600 dark:focus-within:ring-slate-800">
                  <span className="flex h-full shrink-0 items-center border-r border-slate-200 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Tên
                  </span>
                  <Input
                    value={customName}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="VD: Cấm dùng SELECT *"
                    className="h-full border-0 bg-transparent px-3 text-sm font-medium shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                  />
                </div>
              </Field>

              <Field label="Loại rule">
                <PolicySegmentedControl
                  value={customPolicyValue}
                  onChange={onPolicyChange}
                />
              </Field>
            </div>

            <Field
              label="Regex"
              hint={String.raw`Nhập regex trực tiếp, ví dụ \bselect\b\s*\*`}
            >
              <div className="overflow-hidden rounded-md border border-slate-300 bg-white transition-colors focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-slate-600 dark:focus-within:ring-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/80">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Pattern
                  </span>
                  <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] text-slate-500 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:ring-slate-700">
                    RegExp
                  </span>
                </div>
                <Textarea
                  value={customPattern}
                  onChange={(event) => onPatternChange(event.target.value)}
                  placeholder={String.raw`\bselect\b\s*\*`}
                  className="min-h-[96px] resize-y rounded-none border-0 bg-transparent p-3 font-mono text-sm leading-relaxed shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                />
              </div>
              {customRegexError && customPattern.trim() !== '' && (
                <ValidationMessage ok={false} message={customRegexError} />
              )}
            </Field>

            <Field
              label="Thông báo khi vi phạm"
              hint="Sinh viên sẽ thấy nội dung này"
            >
              <Input
                value={customMessage}
                onChange={(event) => onMessageChange(event.target.value)}
                placeholder="VD: Không được dùng NOLOCK"
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-0 dark:border-slate-700 dark:bg-slate-900 dark:focus-visible:border-slate-700"
              />
            </Field>
          </BuilderPanel>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <BuilderPanel title="Kiểm thử Regex" accentColor="violet">
            <Field
              label="SQL mẫu"
              hint="Nhập câu SQL để kiểm tra regex có khớp đúng không"
            >
              <div className="h-[100px] overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-slate-300 focus-within:ring-0 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-slate-700">
                <TeacherSqlEditor
                  value={customSampleSql}
                  onChange={(value) => onSampleSqlChange(value || '')}
                  height="100%"
                  showExpandButton={false}
                />
              </div>
              {customTestResult && (
                <div className="space-y-2">
                  <ValidationMessage
                    ok={customTestResult.ok}
                    message={customTestResult.message}
                  />
                  {customTestResult.match && (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      Đoạn khớp:{' '}
                      <code className="font-mono font-semibold">
                        {customTestResult.match}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </Field>
          </BuilderPanel>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <p className="hidden text-xs text-slate-400 sm:block">
          Lưu rule vào thư viện để dùng lại cho nhiều câu hỏi
        </p>
        <div className="flex gap-3 sm:ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onTest}
            className="h-10 gap-2 rounded-lg border-violet-200 px-5 font-semibold text-violet-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:shadow-md dark:border-violet-900/50 dark:text-violet-300 dark:hover:bg-violet-950/30"
          >
            <Play className="h-4 w-4" />
            Chạy thử
          </Button>
          <Button
            type="button"
            onClick={() => void onSave()}
            disabled={Boolean(customRegexError) || savingCustomRule}
            className="h-10 gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 font-semibold text-white shadow-md shadow-blue-300/30 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-300/40 disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none dark:shadow-none"
          >
            {savingCustomRule ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu vào thư viện
          </Button>
        </div>
      </div>
    </div>
  )
}

function BuilderPanel({
  icon,
  title,
  accentColor = 'blue',
  children
}: {
  icon?: ReactNode
  title: string
  accentColor?: 'blue' | 'violet'
  children: ReactNode
}) {
  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    violet: 'text-violet-600 dark:text-violet-400'
  }
  return (
    <section className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        {icon && <span className={cn(iconColors[accentColor])}>{icon}</span>}
        <h3 className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-200">
          {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="block space-y-1.5">
      <div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </span>
        {hint && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

function PolicySegmentedControl({
  value,
  onChange
}: {
  value: CustomRegexPolicy
  onChange: (value: CustomRegexPolicy) => void
}) {
  return (
    <div className="grid h-9 grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
      {(['FORBID', 'REQUIRE'] as const).map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded text-sm font-medium transition-all duration-200',
              selected && option === 'FORBID'
                ? 'bg-white text-rose-600 shadow-sm dark:bg-rose-950/60 dark:text-rose-300'
                : '',
              selected && option === 'REQUIRE'
                ? 'bg-white text-emerald-600 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300'
                : '',
              !selected
                ? 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                : ''
            )}
          >
            {option === 'FORBID' ? 'Cấm' : 'Bắt buộc'}
          </button>
        )
      })}
    </div>
  )
}

function ValidationMessage({ ok, message }: { ok?: boolean; message: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2.5 py-2 text-xs transition-all border',
        ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
          : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300'
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
      )}
      <span className="font-medium">{message}</span>
    </div>
  )
}

function CustomRuleButton({
  entry,
  onClick,
  onEdit,
  onDelete
}: {
  entry: CustomRuleLibraryItem
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { rule } = entry
  const policy = customPolicy(rule)
  return (
    <div
      onClick={onClick}
      className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-slate-800 dark:hover:bg-slate-900/70"
    >
      <PolicyBadge policy={policy} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">
          {customParam(
            rule,
            'name',
            rule.description ?? 'Rule regex tùy chỉnh'
          )}
        </span>
        <span className="mt-1 block truncate font-mono text-xs text-slate-500">
          {customParam(rule, 'pattern')}
        </span>
        <span className="mt-1 block font-mono text-[10px] text-slate-400">
          {rule.rule_id}
        </span>
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
          className="h-8 w-8 shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900"
          title="Sửa rule"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="h-8 w-8 shrink-0 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
          title="Xóa rule"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>
    </div>
  )
}

function CatalogRuleButton({
  item,
  onClick
}: {
  item: WhiteboxDisplayRule
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-slate-800 dark:hover:bg-slate-900/70"
    >
      <span
        className={cn(
          'mt-0.5 w-20 shrink-0 rounded-md px-2 py-0.5 text-center text-[10px] font-semibold',
          POLICY_BADGE_CLASS[item.policy] ?? ''
        )}
      >
        {item.policyLabel}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">
          {item.featureLabel}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {item.description}
        </span>
        {item.variants.length > 1 && (
          <span className="mt-1 block text-[11px] text-slate-500">
            Tùy chọn: {item.variants.map((variant) => variant.label).join(', ')}
          </span>
        )}
      </span>

      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
    </button>
  )
}

function PolicyBadge({ policy }: { policy: CustomRegexPolicy }) {
  return (
    <span
      className={cn(
        'mt-0.5 w-20 shrink-0 rounded-md px-2 py-0.5 text-center text-[10px] font-semibold',
        policy === 'FORBID'
          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
      )}
    >
      {policy === 'FORBID' ? 'Cấm' : 'Bắt buộc'}
    </span>
  )
}
