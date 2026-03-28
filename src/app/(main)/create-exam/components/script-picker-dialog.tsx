'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type {
  ExistingScriptOption,
  ScriptSourceMode
} from './common-part-export.domain'

interface ScriptPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  options: ExistingScriptOption[]
  scriptMode: ScriptSourceMode
  onScriptModeChange: (mode: ScriptSourceMode) => void
  selectedScriptId: string
  onSelectedScriptIdChange: (id: string) => void
  customScript: string
  onCustomScriptChange: (script: string) => void
  isExecuting: boolean
  onExecute: () => void
  executeLabel: string
  executingLabel: string
  radioGroupName: string
}

export function ScriptPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  options,
  scriptMode,
  onScriptModeChange,
  selectedScriptId,
  onSelectedScriptIdChange,
  customScript,
  onCustomScriptChange,
  isExecuting,
  onExecute,
  executeLabel,
  executingLabel,
  radioGroupName
}: ScriptPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={radioGroupName}
                checked={scriptMode === 'existing'}
                onChange={() => onScriptModeChange('existing')}
                disabled={options.length === 0}
              />
              Dùng script hiện có
            </label>

            <select
              value={selectedScriptId}
              onChange={(event) => onSelectedScriptIdChange(event.target.value)}
              disabled={
                scriptMode !== 'existing' || options.length === 0 || isExecuting
              }
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              {options.length === 0 && (
                <option value="">Chưa có script SQL khả dụng</option>
              )}
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.kind === 'sql-ddl' ? '[DDL] ' : '[DML] '}
                  {option.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={radioGroupName}
                checked={scriptMode === 'custom'}
                onChange={() => onScriptModeChange('custom')}
              />
              Nhập script SQL khác
            </label>
            <Textarea
              value={customScript}
              onChange={(event) => onCustomScriptChange(event.target.value)}
              placeholder="Nhập script SQL..."
              className="min-h-40 font-mono text-xs"
              disabled={scriptMode !== 'custom' || isExecuting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExecuting}
          >
            Hủy
          </Button>
          <Button type="button" onClick={onExecute} disabled={isExecuting}>
            {isExecuting ? executingLabel : executeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
