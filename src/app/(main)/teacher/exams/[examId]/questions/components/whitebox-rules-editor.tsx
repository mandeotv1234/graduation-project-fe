'use client'

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  HelpCircle,
  Loader2,
  Pencil,
  Play,
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
  createRulePreset,
  deleteRulePreset,
  getRulePresets,
  getWhiteboxCatalog,
  updateRulePreset,
  validateWhitebox
} from '@/lib/actions'
import {
  getWhiteboxPresets,
  WhiteboxPreset
} from '@/lib/constants/whitebox-presets'
import {
  RulePreset,
  WhiteboxCatalogItem,
  WhiteboxRule,
  WhiteboxSettings,
  WhiteboxValidationResult
} from '@/lib/types'
import { cn } from '@/lib/utils'

import { WhiteboxAddRuleModal } from './whitebox-add-rule-modal'
import { defaultRuleFromCatalog, detectConflicts } from './whitebox-authoring'
import { SystemPresetList } from './system-preset-list'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { WhiteboxRuleRow } from './whitebox-rule-row'

interface WhiteboxRulesEditorProps {
  questionType: string
  totalPoints: number
  rules: WhiteboxRule[]
  settings: WhiteboxSettings
  onChange: (rules: WhiteboxRule[], settings: WhiteboxSettings) => void
  // Teacher's model answer; pre-fills the "Chạy thử" box (teacher can tweak before running).
  sqlForPreview?: string
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
  const [isValidating, setIsValidating] = useState(false)
  // Add-rule modal: feature -> policy -> params -> penalty/severity, appended only on confirm.
  const [addOpen, setAddOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  // DB-backed teacher presets (WHITEBOX kind)
  const [savedPresets, setSavedPresets] = useState<RulePreset[]>([])
  const [isLoadingPresets, setIsLoadingPresets] = useState(false)
  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  // When set, the dialog is editing this saved preset: "Cập nhật mẫu" overwrites it instead of creating a new one.
  const [editingPreset, setEditingPreset] = useState<{
    id: number
    name: string
  } | null>(null)
  // The SQL run by "Chạy thử"; pre-filled from the model answer, editable for ad-hoc checks.
  const [previewSql, setPreviewSql] = useState(sqlForPreview ?? '')

  useEffect(() => {
    setPreviewSql(sqlForPreview ?? '')
  }, [sqlForPreview])

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

  const catalogById = useMemo(() => {
    const map = new Map<string, WhiteboxCatalogItem>()
    catalog.forEach((item) => map.set(item.ruleId, item))
    return map
  }, [catalog])

  const configuredIds = useMemo(
    () => new Set(rules.map((r) => r.rule_id)),
    [rules]
  )

  // Catalog rules not yet configured — gates the "Thêm quy tắc" button.
  const availableCount = useMemo(
    () => catalog.filter((item) => !configuredIds.has(item.ruleId)).length,
    [catalog, configuredIds]
  )

  // Contradictory configured rules (catalog conflictsWith + MAX_JOIN_COUNT=0 vs REQUIRED_JOIN). Warn only.
  const conflicts = useMemo(
    () => detectConflicts(rules, catalogById),
    [rules, catalogById]
  )

  const presets = useMemo(
    () => getWhiteboxPresets(questionType),
    [questionType]
  )

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
        rulesJson: JSON.stringify(rules),
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
        rulesJson: JSON.stringify(rules)
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
      onChange(parsed, settings)
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
      onChange(parsed, settings)
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
    onChange([...rules, rule], settings)
  }

  // Apply a preset bundle: resolve each rule_id against the backend catalog, then override the
  // suggested severity/penalty/params. Replaces the current whitebox rules (mirrors black-box presets).
  const applyPreset = (preset: WhiteboxPreset) => {
    const next: WhiteboxRule[] = []
    for (const presetRule of preset.rules) {
      const item = catalogById.get(presetRule.ruleId)
      if (!item) continue
      const base = defaultRuleFromCatalog(item)
      next.push({
        ...base,
        severity: presetRule.severity ?? base.severity,
        penalty_value: presetRule.penaltyValue ?? base.penalty_value,
        penalty_unit: presetRule.penaltyUnit ?? base.penalty_unit,
        params: presetRule.params
          ? { ...base.params, ...presetRule.params }
          : base.params
      })
    }
    onChange(next, settings)
    setEditingPreset(null)
    setPresetOpen(false)
    toast.success(`Đã áp dụng mẫu: ${preset.name}`)
  }

  const updateRule = (ruleId: string, patch: Partial<WhiteboxRule>) => {
    onChange(
      rules.map((r) => (r.rule_id === ruleId ? { ...r, ...patch } : r)),
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

  const runValidation = async () => {
    if (!previewSql.trim()) {
      toast.warning('Chưa có SQL để chạy thử.')
      return
    }
    setIsValidating(true)
    try {
      const res = await validateWhitebox({
        questionType,
        sql: previewSql,
        whiteboxRules: rules,
        whiteboxSettings: settings,
        questionPoints: totalPoints
      })
      setValidation(res.data ?? null)
    } catch {
      toast.error('Chạy thử whitebox thất bại.')
    } finally {
      setIsValidating(false)
    }
  }

  const modelAnswerViolations =
    validation?.violations.filter(
      (v) => v.status === 'FAIL' || v.status === 'WARN'
    ) ?? []

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/10">
      {/* Header mirrors the black-box rules editor: title + count on the left, actions on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
          Chấm phương pháp (White-box)
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Mẫu quy tắc white-box</DialogTitle>
                  <DialogDescription>
                    Lưu hoặc tải bộ quy tắc cho loại câu hỏi này (thay thế các
                    quy tắc white-box hiện tại).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
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
                        Thêm quy tắc ở bước White-box (nút “Thêm quy tắc”)
                        trước, rồi quay lại đây để lưu thành mẫu.
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
              disabled={availableCount === 0}
              onClick={() => setAddOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm quy tắc
            </Button>
          </div>
        )}
      </div>

      <WhiteboxAddRuleModal
        open={addOpen}
        onOpenChange={setAddOpen}
        catalog={catalog}
        rules={rules}
        catalogById={catalogById}
        onAdd={appendRule}
      />

      <p className="mb-3 mt-1 text-sm text-muted-foreground">
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
          tắc…
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
          <div className="space-y-2">
            {rules.map((rule) => {
              const item = catalogById.get(rule.rule_id)
              if (!item) return null
              return (
                <WhiteboxRuleRow
                  key={rule.rule_id}
                  item={item}
                  rule={rule}
                  onUpdate={updateRule}
                  onRemove={removeRule}
                />
              )
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-sm text-muted-foreground">
            Chưa bật quy tắc whitebox nào. Bấm “Mẫu quy tắc” hoặc “Thêm quy
            tắc”.
          </p>
        ))}

      {/* Run the rules against a SQL answer (pre-filled with the model answer) — warns, never blocks. */}
      <div className="mt-4 space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Chạy thử trên đáp án mẫu
          </label>
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
            Chạy thử
          </Button>
        </div>
        <div className="h-32 overflow-hidden rounded-md border border-border bg-sub-background">
          <TeacherSqlEditor
            value={previewSql}
            onChange={(value) => setPreviewSql(value || '')}
            height="100%"
          />
        </div>

        {validation && !validation.sqlParseOk && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            SQL không phân tích được cú pháp — rule phụ thuộc parser không kiểm
            chứng được (UNVERIFIED).
          </p>
        )}

        {validation && (
          <div className="space-y-2">
            {modelAnswerViolations.length > 0 ? (
              <p className="flex items-start gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  SQL này vi phạm {modelAnswerViolations.length} quy tắc — nếu
                  là đáp án mẫu, sinh viên làm giống cũng bị tính vi phạm. Sửa
                  đáp án mẫu hoặc tắt rule (vẫn cho phép lưu).
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Không vi phạm quy tắc nào.
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
    </div>
  )
}
