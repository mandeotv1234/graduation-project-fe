'use client'

import {
  AlertTriangle,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
  createRulePreset,
  deleteRulePreset,
  getRulePresets,
  updateRulePreset
} from '@/lib/actions'
import {
  getWhiteboxPresets,
  WhiteboxPreset
} from '@/lib/constants/whitebox-presets'
import {
  RulePreset,
  WhiteboxCatalogItem,
  WhiteboxRule,
  WhiteboxSettings
} from '@/lib/types'

import { CustomRegexRuleRow } from './custom-regex-rule-row'
import { WhiteboxAddRuleModal } from './whitebox-add-rule-modal'
import {
  defaultRuleFromCatalog,
  detectConflicts,
  findWhiteboxDisplayRuleByRuleId,
  isCustomRegexRule,
  normalizeWhiteboxRulePenalty
} from './whitebox-authoring'
import { SystemPresetList } from './system-preset-list'
import { loadWhiteboxCatalog } from './whitebox-catalog-client'
import { WhiteboxRuleRow } from './whitebox-rule-row'

interface WhiteboxRulesEditorProps {
  questionType: string
  totalPoints: number
  rules: WhiteboxRule[]
  settings: WhiteboxSettings
  onChange: (rules: WhiteboxRule[], settings: WhiteboxSettings) => void
  // Đáp án mẫu của giáo viên, dùng để điền sẵn khi cần kiểm tra.
  sqlForPreview?: string
}

export function WhiteboxRulesEditor({
  questionType,
  totalPoints,
  rules,
  settings,
  onChange
}: WhiteboxRulesEditorProps) {
  const [catalog, setCatalog] = useState<WhiteboxCatalogItem[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [isRefreshingCatalog, setIsRefreshingCatalog] = useState(false)
  // Add-rule modal: feature -> policy -> params -> penalty/severity, appended only on confirm.
  const [addOpen, setAddOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  // DB-backed teacher presets (WHITEBOX kind)
  const [savedPresets, setSavedPresets] = useState<RulePreset[]>([])
  const [isLoadingPresets, setIsLoadingPresets] = useState(false)
  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  // Khi có giá trị, dialog đang sửa mẫu đã lưu: "Cập nhật mẫu" sẽ ghi đè mẫu đó.
  const [editingPreset, setEditingPreset] = useState<{
    id: number
    name: string
  } | null>(null)
  // SQL lấy từ đáp án mẫu, có thể dùng cho các kiểm tra nhanh.
  useEffect(() => {
    let active = true
    setLoadingCatalog(true)
    loadWhiteboxCatalog(questionType)
      .then((res) => {
        if (!active) return
        if (!Array.isArray(res.data)) {
          setCatalog([])
          setCatalogError(
            res.message || 'Không tải được danh mục quy tắc cách viết.'
          )
          return
        }
        setCatalog(res.data)
        setCatalogError(null)
      })
      .catch(
        () =>
          active &&
          setCatalogError('Không tải được danh mục quy tắc cách viết.')
      )
      .finally(() => active && setLoadingCatalog(false))
    return () => {
      active = false
    }
  }, [questionType])

  const catalogById = useMemo(() => {
    const map = new Map<string, WhiteboxCatalogItem>()
    catalog.forEach((item) => map.set(item.ruleId, item))
    return map
  }, [catalog])

  // Contradictory configured rules (catalog conflictsWith + MAX_JOIN_COUNT=0 vs REQUIRED_JOIN). Warn only.
  const conflicts = useMemo(
    () => detectConflicts(rules, catalogById),
    [rules, catalogById]
  )

  const presets = useMemo(
    () => getWhiteboxPresets(questionType),
    [questionType]
  )

  const maxQuestionPoints = Math.max(0, Number(totalPoints) || 0)
  const clampNumber = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)
  const parseFiniteNumber = (value: string): number | null => {
    if (value.trim() === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  const limitMode =
    settings.max_total_deduction !== null &&
    settings.max_total_deduction !== undefined
      ? 'POINT'
      : 'PERCENT'
  const pointLimit = clampNumber(
    settings.max_total_deduction ?? Math.min(1, maxQuestionPoints),
    0,
    maxQuestionPoints
  )
  const percentLimit = clampNumber(
    settings.max_total_deduction_pct ?? 100,
    0,
    100
  )
  const effectivePercentLimit = (totalPoints * percentLimit) / 100
  const effectiveLimit =
    limitMode === 'POINT' ? pointLimit : effectivePercentLimit
  const formattedEffectiveLimit = Number.isFinite(effectiveLimit)
    ? Number(effectiveLimit.toFixed(2)).toString()
    : '0'

  const displayRuleByRuleId = useMemo(() => {
    const map = new Map<
      string,
      ReturnType<typeof findWhiteboxDisplayRuleByRuleId>
    >()
    catalog.forEach((item) => {
      map.set(
        item.ruleId,
        findWhiteboxDisplayRuleByRuleId(catalog, item.ruleId)
      )
    })
    return map
  }, [catalog])

  const loadSavedPresets = async () => {
    setIsLoadingPresets(true)
    try {
      const res = await getRulePresets(questionType, 'WHITEBOX')
      if (res.data) setSavedPresets(res.data)
    } catch {
      // silently ignore
    } finally {
      setIsLoadingPresets(false)
    }
  }

  const normalizeRules = (inputRules: WhiteboxRule[]) =>
    inputRules.map((rule) =>
      normalizeWhiteboxRulePenalty(rule, catalogById.get(rule.rule_id))
    )

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      toast.error('Vui lòng nhập tên mẫu')
      return
    }
    if (rules.length === 0) {
      toast.error('Không có quy tắc nào để lưu')
      return
    }
    setIsSavingPreset(true)
    try {
      await createRulePreset({
        name: newPresetName.trim(),
        questionType,
        rulesJson: JSON.stringify(normalizeRules(rules)),
        kind: 'WHITEBOX'
      })
      toast.success('Đã lưu mẫu quy tắc')
      setNewPresetName('')
      loadSavedPresets()
    } catch {
      toast.error('Lỗi khi lưu mẫu')
    } finally {
      setIsSavingPreset(false)
    }
  }

  // Overwrite the saved preset currently being edited with the editor's current rules.
  const handleUpdatePreset = async () => {
    if (!editingPreset) return
    if (!newPresetName.trim()) {
      toast.error('Vui lòng nhập tên mẫu')
      return
    }
    if (rules.length === 0) {
      toast.error('Không có quy tắc nào để lưu')
      return
    }
    setIsSavingPreset(true)
    try {
      await updateRulePreset(editingPreset.id, {
        name: newPresetName.trim(),
        rulesJson: JSON.stringify(normalizeRules(rules))
      })
      toast.success('Đã cập nhật mẫu quy tắc')
      setEditingPreset(null)
      setNewPresetName('')
      loadSavedPresets()
    } catch {
      toast.error('Lỗi khi cập nhật mẫu')
    } finally {
      setIsSavingPreset(false)
    }
  }

  const handleApplySavedPreset = (preset: RulePreset) => {
    try {
      const parsed = JSON.parse(preset.rulesJson) as WhiteboxRule[]
      onChange(normalizeRules(parsed), settings)
      setEditingPreset(null)
      toast.success(`Đã áp dụng mẫu: ${preset.name}`)
      setPresetOpen(false)
    } catch {
      toast.error('Lỗi khi đọc dữ liệu mẫu')
    }
  }

  // Load a saved preset's rules into the White-box step and enter edit mode so the teacher can
  // tweak rules inline, then re-open this dialog and overwrite the preset.
  const handleEditSavedPreset = (preset: RulePreset) => {
    try {
      const parsed = JSON.parse(preset.rulesJson) as WhiteboxRule[]
      onChange(normalizeRules(parsed), settings)
      setEditingPreset({ id: preset.id, name: preset.name })
      setNewPresetName(preset.name)
      setPresetOpen(false)
      toast.info(
        `Đang sửa mẫu "${preset.name}". Chỉnh quy tắc rồi mở lại “Mẫu quy tắc” → “Cập nhật mẫu”.`
      )
    } catch {
      toast.error('Lỗi khi đọc dữ liệu mẫu')
    }
  }

  const cancelEditingPreset = () => {
    setEditingPreset(null)
    setNewPresetName('')
  }

  const handleDeletePreset = async (id: number) => {
    try {
      await deleteRulePreset(id)
      setSavedPresets((prev) => prev.filter((p) => p.id !== id))
      toast.success('Đã xóa mẫu')
    } catch {
      toast.error('Lỗi khi xóa mẫu')
    }
  }

  // Append a fully-configured rule from the modal (rule_id stays the persisted identity).
  const appendRule = (rule: WhiteboxRule) => {
    onChange(
      [
        ...rules,
        normalizeWhiteboxRulePenalty(rule, catalogById.get(rule.rule_id))
      ],
      settings
    )
  }

  // Apply a preset bundle: resolve each rule_id against the backend catalog, then override the
  // suggested severity/penalty/params. Replaces the current whitebox rules (mirrors black-box presets).
  const applyPreset = (preset: WhiteboxPreset) => {
    const next: WhiteboxRule[] = []
    for (const presetRule of preset.rules) {
      const item = catalogById.get(presetRule.ruleId)
      if (!item) continue
      const base = defaultRuleFromCatalog(item)
      next.push(
        normalizeWhiteboxRulePenalty(
          {
            ...base,
            severity: presetRule.severity ?? base.severity,
            penalty_value: presetRule.penaltyValue ?? base.penalty_value,
            penalty_unit: presetRule.penaltyUnit ?? base.penalty_unit,
            params: presetRule.params
              ? { ...base.params, ...presetRule.params }
              : base.params
          },
          item
        )
      )
    }
    onChange(next, settings)
    setEditingPreset(null)
    setPresetOpen(false)
    toast.success(`Đã áp dụng mẫu: ${preset.name}`)
  }

  const updateRule = (ruleId: string, patch: Partial<WhiteboxRule>) => {
    const nextRuleId =
      typeof patch.rule_id === 'string' && patch.rule_id.length > 0
        ? patch.rule_id
        : ruleId
    onChange(
      rules.map((r) =>
        r.rule_id === ruleId
          ? normalizeWhiteboxRulePenalty(
              { ...r, ...patch },
              catalogById.get(nextRuleId)
            )
          : r
      ),
      settings
    )
  }

  const removeRule = (ruleId: string) => {
    onChange(
      rules.filter((r) => r.rule_id !== ruleId),
      settings
    )
  }

  const updateSettings = (patch: Partial<WhiteboxSettings>) => {
    onChange(rules, { ...settings, ...patch })
  }

  const updateLimitMode = (mode: 'POINT' | 'PERCENT') => {
    if (mode === 'POINT') {
      updateSettings({
        max_total_deduction: pointLimit,
        max_total_deduction_pct: null
      })
      return
    }
    updateSettings({
      max_total_deduction: null,
      max_total_deduction_pct: percentLimit
    })
  }

  const handleOpenAddRule = async () => {
    setIsRefreshingCatalog(true)
    try {
      const res = await loadWhiteboxCatalog(questionType)
      if (!Array.isArray(res.data)) {
        setCatalog([])
        setCatalogError(
          res.message || 'Không tải được danh mục quy tắc cách viết.'
        )
        toast.error('Không tải được danh mục quy tắc cách viết.')
        return
      }
      setCatalog(res.data)
      setCatalogError(null)
      setAddOpen(true)
    } catch {
      toast.error('Không tải được danh mục quy tắc cách viết.')
    } finally {
      setIsRefreshingCatalog(false)
    }
  }

  const updatePointLimit = (value: string) => {
    const parsed = parseFiniteNumber(value)
    updateSettings({
      max_total_deduction:
        parsed === null ? null : clampNumber(parsed, 0, maxQuestionPoints),
      max_total_deduction_pct: null
    })
  }

  const updatePercentLimit = (value: string) => {
    const parsed = parseFiniteNumber(value)
    updateSettings({
      max_total_deduction: null,
      max_total_deduction_pct:
        parsed === null ? null : clampNumber(parsed, 0, 100)
    })
  }

  useEffect(() => {
    if (
      limitMode === 'POINT' &&
      (settings.max_total_deduction !== pointLimit ||
        settings.max_total_deduction_pct !== null)
    ) {
      onChange(rules, {
        ...settings,
        max_total_deduction: pointLimit,
        max_total_deduction_pct: null
      })
      return
    }

    if (
      limitMode === 'PERCENT' &&
      settings.max_total_deduction_pct !== null &&
      settings.max_total_deduction_pct !== percentLimit
    ) {
      onChange(rules, {
        ...settings,
        max_total_deduction: null,
        max_total_deduction_pct: percentLimit
      })
    }
  }, [limitMode, onChange, percentLimit, pointLimit, rules, settings])

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/10">
      {/* Header mirrors the black-box rules editor: title + count on the left, actions on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
          Quy tắc cách viết câu lệnh
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-0.5 text-xs"
          >
            {rules.length}
          </Badge>
        </h4>
        {!loadingCatalog && !catalogError && (
          <div className="flex items-center gap-2">
            <Dialog
              open={presetOpen}
              onOpenChange={(open) => {
                setPresetOpen(open)
                if (open) loadSavedPresets()
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 whitespace-nowrap px-4 text-sm"
                >
                  <FileText className="mr-1.5 h-4 w-4" />
                  Mẫu quy tắc
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md flex flex-col max-h-[85vh]">
                <DialogHeader className="shrink-0">
                  <DialogTitle>Mẫu quy tắc cách viết</DialogTitle>
                  <DialogDescription>
                    Lưu hoặc tải bộ quy tắc cho loại câu hỏi này (thay thế các
                    quy tắc cách viết hiện tại).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 overflow-y-auto min-h-0 flex-1">
                  {/* Save new preset, or update the one currently being edited */}
                  <div className="space-y-2">
                    {editingPreset && (
                      <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
                        <span className="font-medium text-primary">
                          Đang sửa mẫu: {editingPreset.name}
                        </span>
                        <button
                          type="button"
                          onClick={cancelEditingPreset}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Thoát
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Tên mẫu quy tắc mới..."
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
                      />
                      <Button
                        onClick={
                          editingPreset ? handleUpdatePreset : handleSavePreset
                        }
                        disabled={
                          isSavingPreset ||
                          !newPresetName.trim() ||
                          rules.length === 0
                        }
                        size="sm"
                      >
                        {isSavingPreset ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {editingPreset ? 'Cập nhật mẫu' : 'Lưu làm mẫu mới'}
                      </Button>
                    </div>
                    {rules.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Thêm quy tắc (nút “Thêm quy tắc”) trước, rồi quay lại
                        đây để lưu thành mẫu.
                      </p>
                    )}
                  </div>

                  {/* System presets */}
                  {presets.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <SystemPresetList
                        presets={presets.map((p) => ({
                          id: p.id,
                          name: p.name,
                          description: p.description
                        }))}
                        onApply={(id) => {
                          const preset = presets.find((p) => p.id === id)
                          if (preset) applyPreset(preset)
                        }}
                      />
                    </div>
                  )}

                  {/* DB-backed saved presets */}
                  <div className="border-t border-border pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="text-xs font-semibold">
                        Danh sách mẫu đã lưu của bạn
                      </h5>
                    </div>

                    {isLoadingPresets ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Đang tải...
                        </span>
                      </div>
                    ) : savedPresets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-8 bg-sub-background">
                        <p className="text-sm text-muted-foreground">
                          Bạn chưa lưu mẫu nào.
                        </p>
                      </div>
                    ) : (
                      <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
                        {savedPresets.map((p) => (
                          <li
                            key={p.id}
                            className="flex flex-col gap-2 rounded-md border border-border bg-sub-background p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="truncate text-sm font-semibold text-sub-primary"
                                title={p.name}
                              >
                                {p.name}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {new Date(p.createdAt).toLocaleDateString(
                                  'vi-VN'
                                )}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApplySavedPreset(p)}
                                  className="h-7 px-2 text-xs"
                                >
                                  Áp dụng mẫu này
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditSavedPreset(p)}
                                  className="h-7 px-2 text-xs"
                                >
                                  <Pencil className="mr-1 h-3 w-3" />
                                  Sửa
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePreset(p.id)}
                                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 whitespace-nowrap px-4 text-sm"
              disabled={isRefreshingCatalog}
              onClick={handleOpenAddRule}
            >
              {isRefreshingCatalog ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              {isRefreshingCatalog ? 'Đang tải...' : 'Thêm quy tắc'}
            </Button>
          </div>
        )}
      </div>

      <WhiteboxAddRuleModal
        open={addOpen}
        onOpenChange={setAddOpen}
        questionType={questionType}
        catalog={catalog}
        rules={rules}
        catalogById={catalogById}
        onAdd={appendRule}
      />

      <p className="mb-3 mt-1 text-sm text-muted-foreground">
        Kiểm tra <strong>cách viết</strong> câu truy vấn (JOIN, subquery, GROUP
        BY...), độc lập với kết quả. Danh mục quy tắc do backend cung cấp. Mặc
        định chỉ cảnh báo - chuyển sang “Trừ điểm” khi cần.
      </p>

      <div className="mb-3 rounded-lg border border-border/60 bg-background/70 px-3 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h5 className="text-sm font-semibold text-foreground">
              Whitebox trừ tối đa
            </h5>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Tổng điểm trừ từ các rule bên dưới sẽ không vượt quá mức này.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 lg:w-auto lg:grid-cols-[170px_170px_120px_180px] lg:items-center">
            <Select
              value={limitMode}
              onValueChange={(value) =>
                updateLimitMode(value as 'POINT' | 'PERCENT')
              }
            >
              <SelectTrigger className="h-9 w-full bg-background">
                <SelectValue placeholder="Chọn kiểu giới hạn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POINT">Theo điểm</SelectItem>
                <SelectItem value="PERCENT">Theo % điểm câu</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-[44px_1fr] items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Tối đa
              </span>
              {limitMode === 'POINT' ? (
                <div className="grid grid-cols-[80px_42px] items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={maxQuestionPoints}
                    step={0.25}
                    value={
                      settings.max_total_deduction === null ||
                      settings.max_total_deduction === undefined
                        ? ''
                        : pointLimit
                    }
                    onChange={(e) => updatePointLimit(e.target.value)}
                    className="h-9 w-20"
                  />
                  <span className="text-sm text-muted-foreground">điểm</span>
                </div>
              ) : (
                <div className="grid grid-cols-[80px_42px] items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={
                      settings.max_total_deduction_pct === null ||
                      settings.max_total_deduction_pct === undefined
                        ? ''
                        : percentLimit
                    }
                    onChange={(e) => updatePercentLimit(e.target.value)}
                    className="h-9 w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>

            <p className="h-9 whitespace-nowrap rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Thực tế:{' '}
              <span className="font-semibold text-foreground">
                {formattedEffectiveLimit} điểm
              </span>
            </p>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={Boolean(settings.stop_on_first_violation)}
                onCheckedChange={(v) =>
                  updateSettings({ stop_on_first_violation: v === true })
                }
              />
              <span className="whitespace-nowrap text-sm font-medium text-foreground">
                Chỉ trừ lỗi đầu tiên
              </span>
            </label>
          </div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="mb-3 space-y-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Phát hiện quy tắc mâu thuẫn (vẫn cho phép lưu):
          </p>
          <ul className="list-disc pl-6">
            {conflicts.map((c, idx) => (
              <li key={idx}>
                <span className="font-medium">{c.labelA}</span> mâu thuẫn với{' '}
                <span className="font-medium">{c.labelB}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loadingCatalog && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh mục quy
          tắc...
        </div>
      )}
      {catalogError && (
        <p className="text-sm text-rose-600 dark:text-rose-400">
          {catalogError}
        </p>
      )}

      {!loadingCatalog &&
        !catalogError &&
        (rules.length > 0 ? (
          <div className="overflow-hidden rounded-lg bg-card divide-y divide-border/60">
            {rules.map((rule) => {
              if (isCustomRegexRule(rule.rule_id)) {
                return (
                  <CustomRegexRuleRow
                    key={rule.rule_id}
                    rule={rule}
                    onUpdate={updateRule}
                    onRemove={removeRule}
                  />
                )
              }
              const item = catalogById.get(rule.rule_id)
              if (!item) return null
              return (
                <WhiteboxRuleRow
                  key={rule.rule_id}
                  item={item}
                  rule={rule}
                  displayRule={displayRuleByRuleId.get(rule.rule_id) ?? null}
                  onUpdate={updateRule}
                  onRemove={removeRule}
                />
              )
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-sm text-muted-foreground">
            Chưa bật quy tắc nào. Bấm “Mẫu quy tắc” hoặc “Thêm quy tắc”.
          </p>
        ))}
    </div>
  )
}
