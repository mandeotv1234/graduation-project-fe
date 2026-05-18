'use client'

import { Loader2, RefreshCw, Save } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import type {
  EntityDescriptionState,
  Step1Props
} from './export-exam-pdf-modal.types'

const ENTITY_LIST_CLASS = [
  'max-h-[56vh] min-h-0 space-y-3 overflow-y-auto pb-4 pr-2',
  'scrollbar-thin [scrollbar-gutter:stable]'
].join(' ')

function EntityDescriptionRow({
  entity,
  onUpdate,
  onRegenerate,
  onSave
}: {
  entity: EntityDescriptionState
  onUpdate: (value: string) => void
  onRegenerate: () => Promise<void>
  onSave: () => Promise<void>
}) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isLoading =
    entity.status === 'loading' ||
    isRegenerating ||
    isSaving ||
    entity.status === 'saving'

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      await onRegenerate()
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }

  const isDirty = entity.value !== entity.savedValue

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {entity.entityName}
            {entity.displayName && entity.displayName !== entity.entityName && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({entity.displayName})
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {entity.status === 'error' && (
            <span className="text-xs text-destructive">Lỗi</span>
          )}
          {entity.status === 'saved' && !isDirty && (
            <span className="text-xs text-emerald-600">Đã lưu</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={isLoading}
            onClick={handleRegenerate}
            title="Tạo lại mô tả bằng AI"
          >
            {isRegenerating || entity.status === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Gen lại
          </Button>
          {isDirty && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={isLoading}
              onClick={handleSave}
              title="Lưu mô tả"
            >
              {isSaving || entity.status === 'saving' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Lưu
            </Button>
          )}
        </div>
      </div>

      {entity.status === 'loading' && !entity.value ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Đang chờ AI tạo mô tả...</span>
        </div>
      ) : (
        <Textarea
          value={entity.value}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Nhập mô tả entity (tân từ CSDL)..."
          className="min-h-[80px] resize-y text-sm"
          disabled={isLoading}
          maxLength={2000}
        />
      )}

      {entity.status === 'error' && (
        <p className="text-xs text-destructive">
          AI không thể tạo mô tả. Vui lòng nhập thủ công hoặc thử gen lại.
        </p>
      )}
    </div>
  )
}

export function Step1EditDescriptions({
  entities,
  onUpdateDescription,
  onRegenerate,
  onSave,
  onNext
}: Step1Props) {
  const [isAdvancing, setIsAdvancing] = useState(false)

  const anyBusy = entities.some(
    (e) => e.status === 'loading' || e.status === 'saving'
  )

  const handleNext = async () => {
    setIsAdvancing(true)
    try {
      await onNext()
    } finally {
      setIsAdvancing(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Bước 1: Mô tả CSDL
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Kiểm tra và chỉnh sửa mô tả (tân từ) cho từng entity. AI sẽ tự động
          tạo mô tả nếu chưa có.
        </p>
      </div>

      {entities.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Đặc tả không có entity nào.
        </p>
      ) : (
        <div className={ENTITY_LIST_CLASS}>
          {entities.map((entity) => (
            <EntityDescriptionRow
              key={entity.entityId}
              entity={entity}
              onUpdate={(val) => onUpdateDescription(entity.entityId, val)}
              onRegenerate={() => onRegenerate(entity.entityId)}
              onSave={() => onSave(entity.entityId)}
            />
          ))}
        </div>
      )}

      <div className="-mx-6 -mb-5 mt-auto flex shrink-0 justify-end border-t border-border bg-background px-6 py-3">
        <Button onClick={handleNext} disabled={anyBusy || isAdvancing}>
          {isAdvancing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Tiếp tục
        </Button>
      </div>
    </div>
  )
}
