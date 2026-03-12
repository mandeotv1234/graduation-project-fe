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
      <div className="flex items-center justify-between border-b border-border bg-card px-4 sm:px-5 py-2 sm:py-3 shadow-sm z-10">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 sm:gap-2">
          <span>{`</>`}</span>
          <span className="hidden sm:inline">SQL Editor</span>
        </span>
        <Button
          onClick={onExecute}
          disabled={isLoading}
          className="h-8 px-3 sm:h-9 sm:px-4 text-xs sm:text-sm gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Play className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {isLoading ? 'Đang chạy...' : 'Chạy SQL'}
          </span>
          <span className="sm:hidden">{isLoading ? '...' : 'Chạy'}</span>
        </Button>
      </div>

      <div className="flex-1 bg-background">
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
