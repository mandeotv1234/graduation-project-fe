'use client'

import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'

interface SqlEditorPanelProps {
  value: string
  onChange: (value: string) => void
  onExecute: () => void
  isLoading: boolean
}

export function SqlEditorPanel({
  value,
  onChange,
  onExecute,
  isLoading
}: SqlEditorPanelProps) {
  const { resolvedTheme } = useTheme()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          SQL Editor
        </span>
        <Button
          size="sm"
          onClick={onExecute}
          disabled={isLoading}
          className="gap-1.5"
        >
          <Play className="h-3.5 w-3.5" />
          {isLoading ? 'Đang chạy...' : 'Chạy SQL'}
        </Button>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="sql"
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          value={value}
          onChange={(val) => onChange(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            suggest: {
              showKeywords: true
            }
          }}
        />
      </div>
    </div>
  )
}
