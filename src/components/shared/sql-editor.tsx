import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'

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

  const handleEditorWillMount = (monaco: Monaco) => {
    // Define custom dark theme for SQL
    monaco.editor.defineTheme('sql-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'type', foreground: '4EC9B0' }
      ],
      colors: {
        'editor.background': '#020617',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#1e293b',
        'editor.selectionBackground': '#334155',
        'editorCursor.foreground': '#60a5fa',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.inactiveSelectionBackground': '#1e293b80',
        'editorIndentGuide.background': '#334155',
        'editorIndentGuide.activeBackground': '#475569'
      }
    })
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
      readOnly: readOnly
    })

    // Add keyboard shortcuts
    // Ctrl+/ or Cmd+/ for comment toggle
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
        theme="sql-dark"
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
          wordBasedSuggestions: 'allDocuments'
        }}
      />
    </div>
  )
}
