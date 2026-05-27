'use client'

import { useRef, useEffect } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { Geist_Mono } from 'next/font/google'
import type * as monaco from 'monaco-editor'

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

interface SqlViewerProps {
  value: string
  height?: string
}

export function SqlViewer({ value, height }: SqlViewerProps) {
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const lineCount = (value ?? '').split('\n').length
  const computedHeight =
    height ?? `${Math.min(Math.max(lineCount * 21 + 24, 80), 300)}px`

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
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
    <div ref={wrapperRef} style={{ height: computedHeight, width: '100%' }}>
      <Editor
        height={computedHeight}
        language="sql"
        value={value ?? ''}
        theme={isDark ? 'vs-dark' : 'vs'}
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
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineNumbers: 'off',
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
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          scrollbar: { vertical: 'hidden', horizontal: 'auto' }
        }}
      />
    </div>
  )
}
