'use client'

import { useRef, useEffect, useState } from 'react'
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { Geist_Mono } from 'next/font/google'
import { Maximize2 } from 'lucide-react'
import type * as monaco from 'monaco-editor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

interface SqlViewerProps {
  value: string
  height?: string
  showExpandButton?: boolean
  /** Force the editor into dark theme regardless of the app theme. */
  forceDark?: boolean
}

export function SqlViewer({
  value,
  height,
  showExpandButton = true,
  forceDark = false
}: SqlViewerProps) {
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = forceDark || currentTheme === 'dark'
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const lineCount = (value ?? '').split('\n').length
  const computedHeight =
    height ?? `${Math.min(Math.max(lineCount * 21 + 24, 80), 500)}px`

  const handleBeforeMount: BeforeMount = (m) => {
    m.editor.defineTheme('sql-viewer-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#FFFFFF',
        'editorGutter.background': '#FFFFFF',
        'editorLineNumber.foreground': '#6B7280',
        'editorLineNumber.activeForeground': '#111827'
      }
    })
    m.editor.defineTheme('sql-viewer-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editorGutter.background': '#1e1e1e',
        'editorLineNumber.foreground': '#9CA3AF',
        'editorLineNumber.activeForeground': '#F9FAFB'
      }
    })
  }

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
    requestAnimationFrame(() => editor.layout())
  }

  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    readOnly: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    lineDecorationsWidth: 6,
    wordWrap: 'on',
    automaticLayout: true,
    padding: { top: 8, bottom: 8 },
    contextmenu: false,
    fontFamily: geistMono.style.fontFamily,
    renderLineHighlight: 'none',
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    selectionHighlight: false,
    folding: false,
    glyphMargin: false,
    stickyScroll: { enabled: false },
    scrollbar: { vertical: 'hidden', horizontal: 'auto' }
  }

  // Fix scroll trapping: intercept wheel events in capture phase before Monaco gets them.
  // If Monaco cannot scroll further in the direction of the wheel, stop the event from
  // reaching Monaco so the browser's default page-scroll fires instead.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const handleWheel = (e: WheelEvent) => {
      const editor = editorRef.current
      if (!editor) return

      const scrollTop = editor.getScrollTop()
      const scrollHeight = editor.getScrollHeight()
      const containerHeight = editor.getLayoutInfo().height
      const scrollLeft = editor.getScrollLeft()
      const scrollWidth = editor.getScrollWidth()
      const containerWidth = editor.getLayoutInfo().width

      const atTop = scrollTop <= 0
      const atBottom = scrollTop + containerHeight >= scrollHeight
      const atLeft = scrollLeft <= 0
      const atRight = scrollLeft + containerWidth >= scrollWidth

      const monacoCanScroll =
        (e.deltaY < 0 && !atTop) ||
        (e.deltaY > 0 && !atBottom) ||
        (e.deltaX < 0 && !atLeft) ||
        (e.deltaX > 0 && !atRight)

      if (!monacoCanScroll) {
        // Monaco has nothing to scroll — stop it from swallowing the event so the page scrolls
        e.stopPropagation()
      }
    }

    wrapper.addEventListener('wheel', handleWheel, {
      capture: true,
      passive: true
    })
    return () => wrapper.removeEventListener('wheel', handleWheel, true)
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="group/sql-viewer relative"
      style={{ height: computedHeight, width: '100%' }}
    >
      {showExpandButton && (
        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-1.5 top-1.5 z-10 h-6 w-6 rounded-md border-border/60 bg-background/70 p-0 opacity-0 shadow-none transition-opacity hover:bg-background group-hover/sql-viewer:opacity-60 focus-visible:opacity-100 hover:opacity-100"
              title="Phóng to SQL"
              aria-label="Phóng to SQL"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="flex h-[90vh] w-[95vw] max-w-[95vw] flex-col p-4 sm:max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>Xem SQL</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-background">
              <Editor
                height="100%"
                language="sql"
                value={value ?? ''}
                theme={isDark ? 'sql-viewer-dark' : 'sql-viewer-light'}
                beforeMount={handleBeforeMount}
                onMount={handleEditorMount}
                options={{
                  ...editorOptions,
                  fontSize: 14,
                  lineNumbers: 'on',
                  lineNumbersMinChars: 3,
                  lineDecorationsWidth: 8,
                  scrollbar: { vertical: 'auto', horizontal: 'auto' }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Editor
        height={computedHeight}
        language="sql"
        value={value ?? ''}
        theme={isDark ? 'sql-viewer-dark' : 'sql-viewer-light'}
        beforeMount={handleBeforeMount}
        onMount={handleEditorMount}
        loading={
          <pre
            style={{
              height: computedHeight,
              margin: 0,
              padding: '8px 12px',
              fontFamily: geistMono.style.fontFamily,
              fontSize: '13px',
              overflow: 'auto',
              background: isDark ? '#1e1e1e' : '#ffffff',
              color: isDark ? '#d4d4d4' : '#000000'
            }}
          >
            {value}
          </pre>
        }
        options={editorOptions}
      />
    </div>
  )
}
