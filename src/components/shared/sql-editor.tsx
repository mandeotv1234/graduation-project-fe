import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { useTheme } from 'next-themes'
import { Geist_Mono } from 'next/font/google'

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

interface SqlEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  height?: string
  readOnly?: boolean
}

export function SqlEditor({
  value,
  onChange,
  height = '100%',
  readOnly = false
}: SqlEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  const handleEditorWillMount = (monaco: Monaco) => {
    monacoRef.current = monaco
  }

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: false,
      readOnly: readOnly,
      fontFamily: geistMono.style.fontFamily
    })

    // Block clipboard actions (Ctrl+C, Ctrl+V, Ctrl+X)
    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const ctrlOrCmd = isMac ? monaco.KeyMod.WinCtrl : monaco.KeyMod.CtrlCmd
    // Block Ctrl+C
    editor.addCommand(ctrlOrCmd | monaco.KeyCode.KEY_C, () => {})
    // Block Ctrl+V
    editor.addCommand(ctrlOrCmd | monaco.KeyCode.KEY_V, () => {})
    // Block Ctrl+X
    editor.addCommand(ctrlOrCmd | monaco.KeyCode.KEY_X, () => {})

    // Block right-click context menu
    editor.onMouseDown((e) => {
      if (e.event.rightButton) {
        e.event.preventDefault?.()
        e.event.stopPropagation?.()
      }
    })

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.getAction('editor.action.commentLine')?.run()
    })
  }

  return (
    <div className="h-full w-full">
      <Editor
        height={height}
        language="sql"
        value={value}
        onChange={onChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        theme={isDark ? 'vs-dark' : 'vs'}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: false,
          readOnly: readOnly,
          padding: { top: 16, bottom: 16 },
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'allDocuments',
          fontFamily: geistMono.style.fontFamily
        }}
      />
    </div>
  )
}
