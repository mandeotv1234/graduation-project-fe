'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface SystemPresetItem {
  id: string
  name: string
  description: string
}

interface SystemPresetListProps {
  presets: SystemPresetItem[]
  // Apply by id; the parent resolves the typed preset and applies it to its own rule model.
  onApply: (id: string) => void
  heading?: string
  applyLabel?: string
  emptyText?: string
}

/**
 * Shared "Mẫu hệ thống" preset list (cards + Apply), reused by the black-box rules editor and the
 * white-box editor. Each owns its rule model + Dialog wrapper; only this presentational list is shared.
 */
export function SystemPresetList({
  presets,
  onApply,
  heading = 'Mẫu hệ thống',
  applyLabel = 'Áp dụng mẫu hệ thống',
  emptyText = 'Chưa có mẫu hệ thống cho loại câu hỏi này.'
}: SystemPresetListProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h5 className="text-xs font-semibold">{heading}</h5>
        <Badge variant="secondary" className="text-[10px]">
          Gợi ý
        </Badge>
      </div>
      {presets.length === 0 ? (
        <div className="py-4 text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <ul className="space-y-2">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="flex flex-col gap-2 rounded-md border border-primary/20 bg-primary/5 p-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary">
                  {preset.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {preset.description}
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onApply(preset.id)}
                  className="h-7 px-2.5 text-xs"
                >
                  {applyLabel}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
