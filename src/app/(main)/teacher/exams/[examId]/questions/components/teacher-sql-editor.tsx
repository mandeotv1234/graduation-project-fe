'use client'

import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { Maximize2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Geist_Mono } from 'next/font/google'

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

interface TeacherSqlEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  height?: string
  readOnly?: boolean
  showExpandButton?: boolean
}

export function TeacherSqlEditor({
  value,
  onChange,
  height = '100%',
  readOnly = false,
  showExpandButton = true
}: TeacherSqlEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  const handleEditorWillMount = (m: Monaco) => {
    monacoRef.current = m
  }

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    m: Monaco
  ) => {
    editorRef.current = editor

    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      lineNumbersMinChars: 2,
      lineDecorationsWidth: 6,
      glyphMargin: false,
      folding: false,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: false,
      readOnly,
      fontFamily: geistMono.style.fontFamily
    })

    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Slash, () => {
      editor.getAction('editor.action.commentLine')?.run()
    })
  }

  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    lineNumbersMinChars: 2,
    lineDecorationsWidth: 6,
    glyphMargin: false,
    folding: false,
    wordWrap: 'on',
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: false,
    readOnly,
    padding: { top: 16, bottom: 16 },
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
    wordBasedSuggestions: 'allDocuments',
    fontFamily: geistMono.style.fontFamily
  }

  return (
    <div className="relative h-full w-full">
      {showExpandButton && (
        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 z-10 h-7 w-7 bg-background/90"
              title="Mo rong khung SQL"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] p-4 sm:max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>SQL Editor</DialogTitle>
            </DialogHeader>
            <div className="h-full min-h-0 overflow-hidden rounded-md border border-border bg-background">
              <Editor
                height="100%"
                language="sql"
                value={value}
                onChange={onChange}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                theme={isDark ? 'vs-dark' : 'vs'}
                options={editorOptions}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Editor
        height={height}
        language="sql"
        value={value}
        onChange={onChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        theme={isDark ? 'vs-dark' : 'vs'}
        options={editorOptions}
      />
    </div>
  )
}
