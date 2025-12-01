'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, RotateCcw } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { Geist_Mono } from 'next/font/google'
import { Question } from '@/lib/types'

const geistMono = Geist_Mono({ subsets: ['latin'] })

interface ExamEditorProps {
  question: Question
}

export default function ExamEditor({ question }: ExamEditorProps) {
  const [code, setCode] = useState(question.defaultCode)

  useEffect(() => {
    setCode(question.defaultCode)
  }, [question])

  return (
    <main className="flex-1 flex flex-col bg-slate-950">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          {/* Question Header */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-3">
              {`Câu ${question.id}: ${question.title}`}
            </h1>
            <p className="text-slate-400 leading-relaxed text-base">
              {question.description}
            </p>
          </div>

          {/* Editor Section */}
          <div className="flex flex-col gap-0 border border-slate-800 rounded-lg overflow-hidden bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                Trình soạn thảo SQL
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setCode(question.defaultCode)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Code
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
                  onClick={() => {
                    console.log('code', code)
                  }}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Chạy thử
                </Button>
              </div>
            </div>

            <div className="relative h-[400px] w-full border-t border-slate-800">
              <Editor
                height="100%"
                defaultLanguage="sql"
                value={code}
                theme="custom-dark"
                beforeMount={(monaco) => {
                  monaco.editor.defineTheme('custom-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                      'editor.background': '#020617'
                    }
                  })
                }}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  fontFamily: geistMono.style.fontFamily
                }}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </main>
  )
}
