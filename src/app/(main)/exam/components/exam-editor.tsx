'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, RotateCcw } from 'lucide-react'
import { SqlEditor } from '@/components/shared/sql-editor'
import { Question } from '@/lib/types'

interface ExamEditorProps {
  question: Question
}

export default function ExamEditor({ question }: ExamEditorProps) {
  const [code, setCode] = useState(question.defaultCode || '')

  useEffect(() => {
    setCode(question.defaultCode || '')
  }, [question])

  return (
    <main className="h-full flex flex-col bg-background min-w-0 overflow-hidden">
      {/* Question Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
          {`Câu ${question.id}: ${question.title}`}
        </h1>
        <div className="editor-container">
          <div
            className="text-muted-foreground leading-relaxed text-sm sm:text-base ProseMirror"
            dangerouslySetInnerHTML={{ __html: question.description || '' }}
          />
        </div>
      </div>

      {/* Editor Section - FLEX-1 PATTERN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-card border-b border-border flex-wrap gap-2">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
            Trình soạn thảo SQL
          </span>
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 sm:h-8 gap-1 sm:gap-2 text-muted-foreground hover:text-foreground hover:bg-accent px-2 sm:px-3 text-xs sm:text-sm"
              onClick={() => setCode(question.defaultCode || '')}
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Reset Code</span>
              <span className="inline sm:hidden">Reset</span>
            </Button>
            <Button
              size="sm"
              className="h-7 sm:h-8 gap-1 sm:gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border-0 px-2 sm:px-3 text-xs sm:text-sm"
              onClick={() => {
                // TODO: Implement query execution API call
              }}
            >
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <span className="hidden sm:inline">Chạy thử</span>
              <span className="inline sm:hidden">Run</span>
            </Button>
          </div>
        </div>

        {/* Editor Container - KEY: flex-1 + overflow-hidden */}
        <div className="flex-1 overflow-hidden px-4 sm:px-6 py-4">
          <SqlEditor
            value={code}
            onChange={(value) => setCode(value || '')}
            height="100%"
          />
        </div>
      </div>
    </main>
  )
}
