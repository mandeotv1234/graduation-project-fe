'use client'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  GradingRuleAction,
  GradingRuleCondition,
  GradingRuleModifier,
  GradingRuleTarget,
  GradingSettings,
  InsertDataGradingRule
} from '@/lib/types'
import { apiClient } from '@/lib/api'
import { Pencil, Plus, Trash2, Settings2, X } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

const ACTION_OPTIONS: Array<{
  value: GradingRuleAction | 'IGNORE'
  label: string
}> = [
  { value: 'DEDUCT_PERCENTAGE', label: 'Trừ phần trăm (%)' },
  { value: 'DEDUCT_POINTS', label: 'Trừ điểm cố định (đ)' },
  { value: 'FAIL_ITEM', label: '0đ đối tượng này' },
  { value: 'FAIL_ALL', label: '0đ toàn bài' },
  { value: 'IGNORE', label: 'Bỏ qua (Không chấm)' }
]

type CreateTableRubricSettings = GradingSettings

interface CreateTableTreeRubricProps {
  rules: InsertDataGradingRule[]
  settings?: CreateTableRubricSettings
  onChange: (rules: InsertDataGradingRule[]) => void
  onChangeSettings?: (settings: CreateTableRubricSettings) => void
  headerAction?: React.ReactNode
  // Atomic-rule catalog to render. Defaults to the CREATE TABLE taxonomy; other question types
  // (e.g. SELECT) pass their own catalog to reuse the identical tree UI.
  config?: GroupConfig[]
  modifierOptions?: Partial<Record<GradingRuleTarget, RuleModifierOption[]>>
}

export type RuleNodeConfig = {
  id: string
  label: string
  microcopy?: string
  target: GradingRuleTarget
  condition: GradingRuleCondition
  defaultPenalty: number
  isChild?: boolean
  isOptional?: boolean
}

export type GroupConfig = {
  id: string
  label: string
  nodes: RuleNodeConfig[]
}

export type RuleModifierOption = {
  value: GradingRuleModifier
  label: string
}

const TREE_CONFIG: GroupConfig[] = [
  {
    id: 'group_table',
    label: 'BẢNG',
    nodes: [
      {
        id: 'table_missing',
        label: 'Thiếu bảng so với đáp án',
        microcopy: 'Sẽ trừ theo ngân sách điểm của bảng bị thiếu.',
        target: 'TABLE',
        condition: 'IS_MISSING',
        defaultPenalty: 100
      },
      {
        id: 'table_extra',
        label: 'Tạo thừa bảng không yêu cầu',
        microcopy:
          'Áp dụng trên tổng điểm bài làm vì bảng dư không thuộc ngân sách nào.',
        target: 'TABLE',
        condition: 'IS_EXTRA',
        defaultPenalty: 10
      },
      {
        id: 'table_replace',
        label: 'Sai tên bảng',
        microcopy:
          'Phát hiện lỗi gõ sai tên thay vì báo lỗi thiếu và thừa đồng thời.',
        target: 'TABLE',
        condition: 'NOT_EQUAL',
        defaultPenalty: 10
      }
    ]
  },
  {
    id: 'group_column',
    label: 'CỘT',
    nodes: [
      {
        id: 'column_missing',
        label: 'Thiếu cột trong bảng',
        target: 'COLUMN',
        condition: 'IS_MISSING',
        defaultPenalty: 15
      },
      {
        id: 'column_extra',
        label: 'Tạo thừa cột không yêu cầu',
        target: 'COLUMN',
        condition: 'IS_EXTRA',
        defaultPenalty: 15
      },
      {
        id: 'column_replace',
        label: 'Sai tên cột',
        microcopy:
          'Phát hiện lỗi gõ sai tên thay vì báo lỗi thiếu và thừa đồng thời.',
        target: 'COLUMN',
        condition: 'NOT_EQUAL',
        defaultPenalty: 10
      }
    ]
  },
  {
    id: 'group_pk',
    label: 'KHÓA CHÍNH',
    nodes: [
      {
        id: 'pk_missing',
        label: 'Thiếu định nghĩa khóa chính',
        target: 'PRIMARY_KEY',
        condition: 'IS_MISSING',
        defaultPenalty: 20
      },
      {
        id: 'pk_extra',
        label: 'Tạo thừa khóa chính (bảng không yêu cầu)',
        target: 'PRIMARY_KEY',
        condition: 'IS_EXTRA',
        defaultPenalty: 10
      },
      {
        id: 'pk_mismatch',
        label: 'Sai lệch cấu trúc (Sai cột cấu thành khóa)',
        microcopy:
          'Đã bao gồm lỗi chọn sai, thiếu hoặc thừa cột. Thuật toán tính là 1 lần vi phạm.',
        target: 'PRIMARY_KEY',
        condition: 'MISMATCH',
        defaultPenalty: 20
      }
    ]
  },
  {
    id: 'group_fk',
    label: 'KHÓA NGOẠI',
    nodes: [
      {
        id: 'fk_missing',
        label: 'Thiếu khóa ngoại so với đáp án',
        target: 'FOREIGN_KEY',
        condition: 'IS_MISSING',
        defaultPenalty: 20
      },
      {
        id: 'fk_extra',
        label: 'Tạo thừa khóa ngoại không yêu cầu',
        target: 'FOREIGN_KEY',
        condition: 'IS_EXTRA',
        defaultPenalty: 10
      },
      {
        id: 'fk_mismatch',
        label: 'Sai lệch cấu trúc (Trỏ sai bảng đích hoặc sai cột)',
        microcopy:
          'Độc lập với thiếu/thừa khóa ngoại. Thuật toán gộp lỗi tránh trừ điểm kép.',
        target: 'FOREIGN_KEY',
        condition: 'MISMATCH',
        defaultPenalty: 15
      }
    ]
  },
  {
    id: 'group_datatype',
    label: 'KIỂU DỮ LIỆU & RÀNG BUỘC TẠI CỘT',
    nodes: [
      {
        id: 'dt_family',
        label: 'Sai họ kiểu dữ liệu (VD: INT thay vì VARCHAR)',
        microcopy: 'Áp dụng khi sai bản chất dữ liệu.',
        target: 'DATA_TYPE',
        condition: 'FAMILY_MISMATCH',
        defaultPenalty: 15
      },
      {
        id: 'dt_size',
        label: 'Cùng họ nhưng sai kích thước (VD: sai độ dài)',
        microcopy: 'Tự động bỏ qua nếu đã bị trừ điểm sai họ.',
        target: 'DATA_TYPE',
        condition: 'SIZE_MISMATCH',
        defaultPenalty: 5,
        isChild: true,
        isOptional: true
      },
      {
        id: 'dt_null',
        label: 'Sai ràng buộc NULL / NOT NULL',
        target: 'NULLABILITY',
        condition: 'NOT_EQUAL',
        defaultPenalty: 5
      },
      {
        id: 'dt_identity',
        label: 'Sai thiết lập IDENTITY',
        target: 'IDENTITY',
        condition: 'NOT_EQUAL',
        defaultPenalty: 5
      }
    ]
  },
  {
    id: 'group_constraints',
    label: 'CÁC RÀNG BUỘC KHÁC',
    nodes: [
      {
        id: 'uq_missing',
        label: 'Thiếu ràng buộc UNIQUE',
        target: 'UNIQUE',
        condition: 'IS_MISSING',
        defaultPenalty: 5,
        isOptional: true
      },
      {
        id: 'uq_extra',
        label: 'Tạo thừa UNIQUE không yêu cầu',
        target: 'UNIQUE',
        condition: 'IS_EXTRA',
        defaultPenalty: 5,
        isOptional: true
      },
      {
        id: 'chk_missing',
        label: 'Thiếu ràng buộc CHECK',
        target: 'CHECK',
        condition: 'IS_MISSING',
        defaultPenalty: 5,
        isOptional: true
      },
      {
        id: 'chk_extra',
        label: 'Tạo thừa CHECK không yêu cầu',
        target: 'CHECK',
        condition: 'IS_EXTRA',
        defaultPenalty: 5,
        isOptional: true
      },
      {
        id: 'chk_mismatch',
        label: 'Sai biểu thức CHECK',
        target: 'CHECK',
        condition: 'EXPRESSION_MISMATCH',
        defaultPenalty: 5,
        isOptional: true
      },
      {
        id: 'def_missing',
        label: 'Thiếu giá trị DEFAULT',
        target: 'DEFAULT',
        condition: 'IS_MISSING',
        defaultPenalty: 5,
        isOptional: true
      },
      {
        id: 'def_extra',
        label: 'Tạo thừa DEFAULT không yêu cầu',
        target: 'DEFAULT',
        condition: 'IS_EXTRA',
        defaultPenalty: 5,
        isOptional: true
      },
      {
        id: 'def_mismatch',
        label: 'Sai giá trị DEFAULT',
        target: 'DEFAULT',
        condition: 'VALUE_MISMATCH',
        defaultPenalty: 5,
        isOptional: true
      }
    ]
  }
]

export function CreateTableTreeRubric({
  rules,
  settings,
  onChange,
  onChangeSettings,
  headerAction,
  config = TREE_CONFIG,
  modifierOptions = {}
}: CreateTableTreeRubricProps) {
  const rulesMap = useMemo(() => {
    const map = new Map<string, InsertDataGradingRule>()
    rules.forEach((r) => {
      if (r.target && r.condition) {
        map.set(`${r.target}|${r.condition}`, r)
      }
    })
    return map
  }, [rules])

  const [isAddObjectOpen, setIsAddObjectOpen] = useState(false)
  const [activeAddGroup, setActiveAddGroup] = useState<string | null>(null)
  const [localIgnored, setLocalIgnored] = useState<Set<string>>(new Set())

  const hiddenGroupNodesMap = useMemo(() => {
    const map = new Map<string, RuleNodeConfig[]>()
    config.forEach((group) => {
      const hiddenNodes = group.nodes.filter((node) => {
        const rule = rulesMap.get(`${node.target}|${node.condition}`)
        const isIgnored =
          rule?.action === 'IGNORE' ||
          localIgnored.has(`${node.target}|${node.condition}`)
        const isCustomized = !!rule && rule?.action !== 'IGNORE'
        const isVisible = !isIgnored && (isCustomized || !node.isOptional)
        return !isVisible
      })
      map.set(group.id, hiddenNodes)
    })
    return map
  }, [rulesMap, localIgnored])

  const visibleGroups = useMemo(() => {
    return config.filter((group) => {
      const hiddenCount = hiddenGroupNodesMap.get(group.id)?.length || 0
      const totalCount = group.nodes.length
      return hiddenCount < totalCount
    })
  }, [hiddenGroupNodesMap])

  const completelyHiddenGroups = useMemo(() => {
    return config.filter((group) => {
      const hiddenCount = hiddenGroupNodesMap.get(group.id)?.length || 0
      const totalCount = group.nodes.length
      return hiddenCount === totalCount
    })
  }, [hiddenGroupNodesMap])

  const handleUpdateRule = (
    target: GradingRuleTarget,
    condition: GradingRuleCondition,
    action: GradingRuleAction | 'IGNORE',
    penaltyValue: number,
    label: string,
    modifiers?: GradingRuleModifier[]
  ) => {
    const nextRules = [...rules]

    const applyToRule = (
      t: GradingRuleTarget,
      c: GradingRuleCondition,
      a: GradingRuleAction | 'IGNORE',
      p: number,
      l: string,
      m?: GradingRuleModifier[]
    ) => {
      const matchingIndexes = nextRules.reduce<number[]>((indexes, r, idx) => {
        if (r.target === t && r.condition === c) {
          indexes.push(idx)
        }
        return indexes
      }, [])
      const nextModifiers = a === 'IGNORE' ? [] : m
      if (matchingIndexes.length > 0) {
        const primaryIdx = matchingIndexes[0]
        const existingRule = nextRules[primaryIdx]
        nextRules[primaryIdx] = {
          ...existingRule,
          action: a as GradingRuleAction,
          penalty_value: p,
          rule_name: existingRule.rule_name || l,
          ...(nextModifiers !== undefined ? { modifiers: nextModifiers } : {})
        }
        for (let i = matchingIndexes.length - 1; i > 0; i--) {
          nextRules.splice(matchingIndexes[i], 1)
        }
      } else {
        nextRules.push({
          rule_name: l,
          target: t,
          condition: c,
          action: a as GradingRuleAction,
          penalty_value: p,
          modifiers: nextModifiers ?? []
        })
      }
    }

    applyToRule(target, condition, action, penaltyValue, label, modifiers)

    const nodesToIgnore = [`${target}|${condition}`]

    // Nếu hành động là IGNORE, tìm các node con phụ thuộc (isChild: true) và ignore chúng
    if (action === 'IGNORE') {
      for (const group of config) {
        const parentIdx = group.nodes.findIndex(
          (n) => n.target === target && n.condition === condition && !n.isChild
        )
        if (parentIdx >= 0) {
          let i = parentIdx + 1
          while (i < group.nodes.length && group.nodes[i].isChild) {
            const childNode = group.nodes[i]
            applyToRule(
              childNode.target,
              childNode.condition,
              'IGNORE',
              0,
              childNode.label,
              []
            )
            nodesToIgnore.push(`${childNode.target}|${childNode.condition}`)
            i++
          }
          break
        }
      }
    }

    // Local State update
    setLocalIgnored((prev) => {
      const next = new Set(prev)
      if (action === 'IGNORE') {
        nodesToIgnore.forEach((id) => next.add(id))
      } else {
        next.delete(`${target}|${condition}`)
      }
      return next
    })

    onChange(nextRules)
  }

  const handleDeleteRule = (
    target: GradingRuleTarget,
    condition: GradingRuleCondition
  ) => {
    setLocalIgnored((prev) => {
      const next = new Set(prev)
      next.delete(`${target}|${condition}`)
      return next
    })
    const nextRules = rules.filter(
      (r) => !(r.target === target && r.condition === condition)
    )
    onChange(nextRules)
  }

  return (
    <div className="mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            BỘ QUY TẮC CHẤM ĐIỂM
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {completelyHiddenGroups.length > 0 && (
            <Popover open={isAddObjectOpen} onOpenChange={setIsAddObjectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 gap-1 border-dashed"
                >
                  <Plus className="h-3 w-3" />
                  Thêm đối tượng cần chấm
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-64 p-0 max-h-[300px] overflow-y-auto"
                sideOffset={4}
              >
                <div className="flex flex-col py-1">
                  {completelyHiddenGroups.map((group) => {
                    const nodes = hiddenGroupNodesMap.get(group.id) || []
                    return (
                      <React.Fragment key={group.id}>
                        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/30">
                          {group.label}
                        </div>
                        {nodes.map((node) => (
                          <button
                            key={`${node.target}|${node.condition}`}
                            className="text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => {
                              handleUpdateRule(
                                node.target,
                                node.condition,
                                'DEDUCT_PERCENTAGE',
                                node.defaultPenalty,
                                node.label
                              )
                              setIsAddObjectOpen(false)
                            }}
                          >
                            {node.label}
                          </button>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {headerAction && (
            <div className="flex items-center gap-2">{headerAction}</div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 font-sans">
        {visibleGroups.map((group) => {
          const hiddenNodes = hiddenGroupNodesMap.get(group.id) || []

          return (
            <div key={group.id} className="relative">
              {/* Group Header */}
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="h-6 px-2.5 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs tracking-wider">
                  {group.label}
                </div>

                {hiddenNodes.length > 0 && (
                  <Popover
                    open={activeAddGroup === group.id}
                    onOpenChange={(open) =>
                      setActiveAddGroup(open ? group.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2 gap-1 opacity-60 hover:opacity-100 border border-dashed"
                      >
                        <Plus className="h-3 w-3" />
                        Thêm quy tắc
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-64 p-0 max-h-[300px] overflow-y-auto"
                      sideOffset={4}
                    >
                      <div className="flex flex-col py-1">
                        {hiddenNodes.map((node) => (
                          <button
                            key={`${node.target}|${node.condition}`}
                            className="text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => {
                              handleUpdateRule(
                                node.target,
                                node.condition,
                                'DEDUCT_PERCENTAGE',
                                node.defaultPenalty,
                                node.label
                              )
                              setActiveAddGroup(null)
                            }}
                          >
                            {node.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Nodes Container */}
              <div className="relative pl-6 pb-1">
                {(() => {
                  const visibleNodes = group.nodes.filter((node) => {
                    const rule = rulesMap.get(
                      `${node.target}|${node.condition}`
                    )
                    const isIgnored =
                      rule?.action === 'IGNORE' ||
                      localIgnored.has(`${node.target}|${node.condition}`)
                    const isCustomized = !!rule && rule?.action !== 'IGNORE'
                    return !isIgnored && (isCustomized || !node.isOptional)
                  })

                  return visibleNodes.map((node, nodeIdx) => {
                    const rule = rulesMap.get(
                      `${node.target}|${node.condition}`
                    )
                    const isCustomized = !!rule && rule?.action !== 'IGNORE'
                    const penalty = rule?.penalty_value ?? node.defaultPenalty
                    const isActive = isCustomized
                    const configuredFamilies = Array.isArray(
                      settings?.data_type_families
                    )
                      ? settings.data_type_families
                      : []
                    const dataTypeFamilySummary =
                      node.id === 'dt_family'
                        ? configuredFamilies.length > 0
                          ? `${configuredFamilies.length} nhóm, ${configuredFamilies.reduce(
                              (total: number, family: string[]) =>
                                total + family.length,
                              0
                            )} kiểu dữ liệu`
                          : 'Không dùng nhóm kiểu dữ liệu'
                        : null

                    const hasNonChildAfter = visibleNodes.some(
                      (n, i) => i > nodeIdx && !n.isChild
                    )
                    const isLastNonChild = !node.isChild && !hasNonChildAfter
                    const isFirstChild =
                      node.isChild &&
                      (nodeIdx === 0 || !visibleNodes[nodeIdx - 1].isChild)
                    const isLastChild =
                      node.isChild &&
                      (nodeIdx === visibleNodes.length - 1 ||
                        !visibleNodes[nodeIdx + 1].isChild)

                    return (
                      <div key={node.id} className="relative group/node mb-1.5">
                        {/* Main trunk vertical line */}
                        {(!node.isChild || hasNonChildAfter) && (
                          <div
                            className="absolute w-[2px] bg-foreground/20"
                            style={{
                              left: '-13px',
                              top: !node.isChild
                                ? nodeIdx === 0
                                  ? '-10px'
                                  : '-6px'
                                : '-6px',
                              bottom:
                                !node.isChild && isLastNonChild
                                  ? 'auto'
                                  : '-6px',
                              height:
                                !node.isChild && isLastNonChild
                                  ? nodeIdx === 0
                                    ? '27px'
                                    : '23px'
                                  : 'auto',
                              zIndex: 0
                            }}
                          />
                        )}

                        {/* Sub-trunk vertical line for child */}
                        {node.isChild && (
                          <div
                            className="absolute w-[2px] bg-foreground/20"
                            style={{
                              left: '11px',
                              top: isFirstChild ? '-10px' : '-6px',
                              bottom: isLastChild ? 'auto' : '-6px',
                              height: isLastChild
                                ? isFirstChild
                                  ? '27px'
                                  : '23px'
                                : 'auto',
                              zIndex: 0
                            }}
                          />
                        )}

                        {/* Horizontal branch line */}
                        <div
                          className="absolute h-[2px] bg-foreground/20"
                          style={{
                            left: node.isChild ? '11px' : '-13px',
                            top: '16px',
                            width: '13px',
                            zIndex: 0
                          }}
                        />

                        <div
                          className={`relative z-10 flex items-start justify-between gap-3 px-3 py-1.5 rounded transition-all duration-200 ${
                            isActive
                              ? 'bg-background hover:bg-muted/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                              : 'hover:bg-muted/40'
                          } ${node.isChild ? 'ml-6' : ''}`}
                        >
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0 pt-0.5">
                            <span
                              className={`font-medium text-sm transition-colors ${
                                isCustomized
                                  ? 'text-foreground'
                                  : 'text-foreground/80'
                              }`}
                            >
                              {node.label}
                            </span>

                            {node.microcopy && (
                              <div className="text-xs text-muted-foreground leading-relaxed max-w-[85%]">
                                {node.microcopy}
                              </div>
                            )}

                            {dataTypeFamilySummary && (
                              <div className="mt-1 inline-flex w-fit rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {dataTypeFamilySummary}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {isCustomized ? (
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-semibold text-xs bg-destructive/10 text-destructive`}
                                >
                                  {rule.action === 'FAIL_ALL' && '0đ toàn bài'}
                                  {rule.action === 'FAIL_ITEM' && '0đ mục này'}
                                  {rule.action === 'DEDUCT_PERCENTAGE' &&
                                    `- ${penalty}%`}
                                  {rule.action === 'DEDUCT_POINTS' &&
                                    `- ${penalty}đ`}
                                  {![
                                    'IGNORE',
                                    'FAIL_ALL',
                                    'FAIL_ITEM',
                                    'DEDUCT_PERCENTAGE',
                                    'DEDUCT_POINTS'
                                  ].includes(rule.action as string) &&
                                    rule.action}
                                </span>
                                {Array.isArray(rule.modifiers) &&
                                  rule.modifiers.length > 0 && (
                                    <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      {rule.modifiers.length} châm chước
                                    </span>
                                  )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold text-xs opacity-70">
                                  Mặc định (- {node.defaultPenalty}%)
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 opacity-40 group-hover/node:opacity-100 transition-opacity">
                              {node.id === 'dt_family' && (
                                <DataTypeFamilySettingsDialog
                                  settings={settings}
                                  onChangeSettings={onChangeSettings}
                                />
                              )}
                              <RuleEditorModal
                                rule={rule}
                                nodeLabel={node.label}
                                defaultPenalty={node.defaultPenalty}
                                modifierOptions={
                                  modifierOptions[node.target] ?? []
                                }
                                onSave={(action, penaltyVal, modifiers) =>
                                  handleUpdateRule(
                                    node.target,
                                    node.condition,
                                    action,
                                    penaltyVal,
                                    node.label,
                                    modifiers
                                  )
                                }
                                onDelete={() =>
                                  handleDeleteRule(node.target, node.condition)
                                }
                              />

                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-full transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10`}
                                onClick={() => {
                                  handleUpdateRule(
                                    node.target,
                                    node.condition,
                                    'IGNORE',
                                    0,
                                    node.label
                                  )
                                }}
                                title="Xóa khỏi cây"
                              >
                                <Trash2 className="h-4 w-4 pointer-events-none" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RuleEditorModal({
  rule,
  nodeLabel,
  defaultPenalty,
  modifierOptions = [],
  onSave,
  onDelete
}: {
  rule?: InsertDataGradingRule
  nodeLabel: string
  defaultPenalty: number
  modifierOptions?: RuleModifierOption[]
  onSave: (
    action: GradingRuleAction,
    penalty: number,
    modifiers?: GradingRuleModifier[]
  ) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<GradingRuleAction>(
    rule?.action || 'DEDUCT_PERCENTAGE'
  )
  const [penalty, setPenalty] = useState<number>(
    rule?.penalty_value ?? defaultPenalty
  )
  const [selectedModifiers, setSelectedModifiers] = useState<
    GradingRuleModifier[]
  >([])

  const normalizeModifiers = (values?: GradingRuleModifier[]) => {
    const allowed = new Set(modifierOptions.map((item) => item.value))
    return Array.isArray(values)
      ? values.filter((item) => allowed.has(item))
      : []
  }

  // Reset state when opening based on current rule
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setAction(rule?.action || 'DEDUCT_PERCENTAGE')
      setPenalty(rule?.penalty_value ?? defaultPenalty)
      setSelectedModifiers(normalizeModifiers(rule?.modifiers))
    }
    setOpen(newOpen)
  }

  const handleSave = () => {
    if (
      action === 'IGNORE' ||
      penalty > 0 ||
      action === 'FAIL_ALL' ||
      action === 'FAIL_ITEM'
    ) {
      onSave(
        action as GradingRuleAction,
        penalty,
        modifierOptions.length > 0 ? selectedModifiers : undefined
      )
    } else {
      onDelete()
    }
    setOpen(false)
  }

  const toggleModifier = (modifier: GradingRuleModifier) => {
    setSelectedModifiers((prev) =>
      prev.includes(modifier)
        ? prev.filter((item) => item !== modifier)
        : [...prev, modifier]
    )
  }

  const needsInput =
    action === 'DEDUCT_PERCENTAGE' || action === 'DEDUCT_POINTS'

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            title="Chỉnh sửa luật này"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{nodeLabel}</DialogTitle>
            <DialogDescription>
              Tùy chỉnh hình thức và mức độ trừ điểm
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Hình thức xử lý
              </label>
              <Select
                value={action}
                onValueChange={(val) => setAction(val as GradingRuleAction)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Chọn hình thức..." />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsInput && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Điểm trừ
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={penalty}
                    onChange={(e) => setPenalty(Number(e.target.value))}
                    className="pr-8 h-10 font-medium"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave()
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    {action === 'DEDUCT_PERCENTAGE' ? '%' : 'đ'}
                  </div>
                </div>
              </div>
            )}

            {modifierOptions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Bộ tiền xử lý / châm chước
                </label>
                <div className="flex flex-wrap gap-2">
                  {modifierOptions.map((option) => (
                    <label
                      key={option.value}
                      className="inline-flex items-center gap-2 rounded border border-border bg-card px-2.5 py-1.5 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModifiers.includes(option.value)}
                        onChange={() => toggleModifier(option.value)}
                        className="h-3.5 w-3.5 rounded border-border accent-sub-primary"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="button" onClick={handleSave}>
              Lưu thiết lập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function normalizeSqlTypeName(value?: unknown) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
}

function useMsSqlTypes() {
  const [types, setTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadTypes = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      const response = await apiClient.get<string[]>(
        '/sql-metadata/mssql-types',
        {
          cache: 'no-store'
        }
      )

      if (cancelled) return

      if (Array.isArray(response.data)) {
        setTypes(
          response.data
            .map((type) => normalizeSqlTypeName(type))
            .filter(Boolean)
        )
      } else {
        setTypes([])
        setErrorMessage(
          response.message || 'Không tải được danh sách kiểu dữ liệu MSSQL.'
        )
      }

      setIsLoading(false)
    }

    loadTypes().catch((error) => {
      if (cancelled) return
      setTypes([])
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không tải được danh sách kiểu dữ liệu MSSQL.'
      )
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { types, isLoading, errorMessage }
}

function DataTypeFamilySettingsDialog({
  settings,
  onChangeSettings
}: {
  settings?: CreateTableRubricSettings
  onChangeSettings?: (s: CreateTableRubricSettings) => void
}) {
  const [open, setOpen] = useState(false)
  const [typeInputs, setTypeInputs] = useState<Record<number, string>>({})
  const [typeInputErrors, setTypeInputErrors] = useState<
    Record<number, string>
  >({})
  const [focusedFamilyIndex, setFocusedFamilyIndex] = useState<number | null>(
    null
  )
  const [draftFamilies, setDraftFamilies] = useState<string[][] | null>(null)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)
  const {
    types: mssqlTypes,
    isLoading: isLoadingTypes,
    errorMessage: typeLoadError
  } = useMsSqlTypes()
  const defaultFamilies = useMemo(
    () => [
      ['VARCHAR', 'NVARCHAR', 'CHAR', 'NCHAR', 'TEXT', 'NTEXT'],
      ['INT', 'BIGINT', 'SMALLINT', 'TINYINT'],
      ['FLOAT', 'REAL', 'DECIMAL', 'NUMERIC', 'MONEY']
    ],
    []
  )

  useEffect(() => {
    if (!open) return
    setDraftFamilies(
      (settings?.data_type_families ?? defaultFamilies).map(
        (family: unknown[]) => family.map(normalizeSqlTypeName).filter(Boolean)
      )
    )
    setTypeInputs({})
    setTypeInputErrors({})
    setFocusedFamilyIndex(null)
  }, [open, settings, defaultFamilies])

  const families = draftFamilies ?? defaultFamilies
  const normalizeFamilyGroups = (value: unknown) => {
    const source = Array.isArray(value) ? value : defaultFamilies
    return source
      .filter(Array.isArray)
      .map((family: unknown[]) =>
        family.map(normalizeSqlTypeName).filter(Boolean)
      )
  }
  const savedFamilies = normalizeFamilyGroups(settings?.data_type_families)
  const isDirty =
    JSON.stringify(normalizeFamilyGroups(families)) !==
    JSON.stringify(savedFamilies)

  const setFamilies = (val: string[][]) => {
    setDraftFamilies(val)
  }
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true)
      return
    }
    if (isDirty) {
      setIsDiscardConfirmOpen(true)
      return
    }
    setOpen(false)
  }
  const cancelSettings = () => {
    setIsDiscardConfirmOpen(false)
    setOpen(false)
  }
  const keepEditing = () => {
    setIsDiscardConfirmOpen(false)
  }
  const discardSettings = () => {
    setIsDiscardConfirmOpen(false)
    setOpen(false)
  }
  const saveSettings = () => {
    const nextSettings = { ...settings } as Record<string, unknown>
    delete nextSettings.check_data_type_family
    delete nextSettings.strict_data_type_length
    onChangeSettings?.({
      ...(nextSettings as unknown as CreateTableRubricSettings),
      data_type_families: (draftFamilies ?? defaultFamilies).map((family) =>
        family.map(normalizeSqlTypeName).filter(Boolean)
      )
    })
    setIsDiscardConfirmOpen(false)
    setOpen(false)
  }

  const addFamily = () => setFamilies([...families, []])
  const removeFamily = (idx: number) => {
    setFamilies(families.filter((_: string[], i: number) => i !== idx))
    setTypeInputs((prev) => {
      const next = { ...prev }
      delete next[idx]
      return next
    })
  }

  const addType = (idx: number, type: string) => {
    const normalizedType = normalizeSqlTypeName(type)
    if (!normalizedType) return

    if (mssqlTypes.length === 0) {
      setTypeInputErrors((prev) => ({
        ...prev,
        [idx]: 'Chưa tải được danh sách kiểu dữ liệu từ MSSQL.'
      }))
      return
    }

    if (!mssqlTypes.includes(normalizedType)) {
      setTypeInputErrors((prev) => ({
        ...prev,
        [idx]: 'Kiểu dữ liệu này không tồn tại trong MSSQL.'
      }))
      return
    }

    const existingFamilyIndex = families.findIndex(
      (family: string[], familyIdx: number) =>
        familyIdx !== idx && family.includes(normalizedType)
    )

    if (existingFamilyIndex >= 0) {
      setTypeInputErrors((prev) => ({
        ...prev,
        [idx]: `Kiểu dữ liệu này đã có trong Nhóm ${existingFamilyIndex + 1}.`
      }))
      return
    }

    const newFamilies = [...families]
    if (!newFamilies[idx].includes(normalizedType)) {
      newFamilies[idx] = [...newFamilies[idx], normalizedType]
      setFamilies(newFamilies)
    }
    setTypeInputs((prev) => ({ ...prev, [idx]: '' }))
    setTypeInputErrors((prev) => {
      const next = { ...prev }
      delete next[idx]
      return next
    })
  }

  const removeType = (fIdx: number, tIdx: number) => {
    const newFamilies = [...families]
    newFamilies[fIdx] = newFamilies[fIdx].filter(
      (_: string, i: number) => i !== tIdx
    )
    setFamilies(newFamilies)
  }

  const getSuggestedTypes = (input: string) => {
    const normalizedInput = normalizeSqlTypeName(input)
    const usedTypes = new Set(
      families.flatMap((item: string[]) => item.map(normalizeSqlTypeName))
    )
    return mssqlTypes
      .filter((type) => !usedTypes.has(type))
      .filter((type) => !normalizedInput || type.includes(normalizedInput))
      .slice(0, 12)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            title="Cấu hình nhóm kiểu dữ liệu"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cấu hình nhóm họ kiểu dữ liệu</DialogTitle>
            <DialogDescription>
              Định nghĩa các kiểu dữ liệu được coi là cùng họ để hệ thống chấm
              nới lỏng khi sinh viên dùng kiểu khác đáp án nhưng cùng nhóm (ví
              dụ NVARCHAR và VARCHAR).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Danh sách các nhóm</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFamily}
                  className="h-8 gap-1"
                >
                  <Plus className="h-3 w-3" /> Thêm nhóm
                </Button>
              </div>

              {families.map((family: string[], fIdx: number) => (
                <div
                  key={fIdx}
                  className="rounded-md border border-border bg-card p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      Nhóm {fIdx + 1}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                      onClick={() => removeFamily(fIdx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {family.map((type, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-mono text-foreground border border-border"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => removeType(fIdx, tIdx)}
                          className="hover:text-destructive shrink-0 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Nhập kiểu dữ liệu..."
                        value={typeInputs[fIdx] ?? ''}
                        className="h-8 flex-1 bg-sub-background px-3 font-mono text-xs uppercase placeholder:font-sans placeholder:normal-case"
                        onFocus={() => setFocusedFamilyIndex(fIdx)}
                        onChange={(e) => {
                          setTypeInputs((prev) => ({
                            ...prev,
                            [fIdx]: e.target.value
                          }))
                          setTypeInputErrors((prev) => {
                            const next = { ...prev }
                            delete next[fIdx]
                            return next
                          })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addType(fIdx, typeInputs[fIdx] ?? '')
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => addType(fIdx, typeInputs[fIdx] ?? '')}
                      >
                        Thêm
                      </Button>
                    </div>

                    {typeInputErrors[fIdx] && (
                      <div className="px-1 text-xs text-destructive">
                        {typeInputErrors[fIdx]}
                      </div>
                    )}

                    {focusedFamilyIndex === fIdx && (
                      <div className="rounded-md border border-border bg-sub-background p-2">
                        {isLoadingTypes ? (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            Đang tải kiểu dữ liệu từ MSSQL...
                          </div>
                        ) : typeLoadError ? (
                          <div className="px-2 py-1 text-xs text-destructive">
                            {typeLoadError}
                          </div>
                        ) : getSuggestedTypes(typeInputs[fIdx] ?? '').length >
                          0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {getSuggestedTypes(typeInputs[fIdx] ?? '').map(
                              (type) => (
                                <button
                                  key={type}
                                  type="button"
                                  className="rounded border border-border bg-card px-2 py-1 font-mono text-[11px] text-foreground transition-colors hover:bg-muted"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => addType(fIdx, type)}
                                >
                                  {type}
                                </button>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            Không có kiểu dữ liệu phù hợp.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {families.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-md">
                  Chưa có nhóm nào. Hãy thêm nhóm để định nghĩa họ kiểu dữ liệu.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={cancelSettings}>
              Hủy
            </Button>
            <Button type="button" onClick={saveSettings}>
              Lưu thiết lập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDiscardConfirmOpen}
        onOpenChange={setIsDiscardConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ thay đổi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription>
              Các chỉnh sửa nhóm kiểu dữ liệu trong popup chưa được lưu vào
              rubric.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={keepEditing}>
              Tiếp tục chỉnh
            </AlertDialogCancel>
            <AlertDialogAction onClick={discardSettings}>
              Bỏ thay đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
