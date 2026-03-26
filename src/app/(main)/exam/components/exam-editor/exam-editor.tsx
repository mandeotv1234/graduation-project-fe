'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, RotateCcw } from 'lucide-react'
import { SqlEditor } from '@/components/shared/sql-editor'
import { Question } from '@/lib/types'
import styles from '@/app/(main)/exam/components/exam-editor/exam-editor.module.scss'

interface ExamEditorProps {
  question: Question
}

export default function ExamEditor({ question }: ExamEditorProps) {
  const [code, setCode] = useState(question.defaultCode || '')

  useEffect(() => {
    setCode(question.defaultCode || '')
  }, [question])

  return (
    <main className={styles.editorContainer}>
      {/* Question Header */}
      <div className={styles.questionHeader}>
        <h1 className={styles.questionTitle}>
          {`Câu ${question.id}: ${question.title}`}
        </h1>
        <p className={styles.questionDescription}>{question.description}</p>
      </div>

      {/* Editor Section - FLEX-1 PATTERN */}
      <div className={styles.editorSection}>
        <div className={styles.editorToolbar}>
          <span className={styles.editorLabel}>Trình soạn thảo SQL</span>
          <div className={styles.toolbarButtons}>
            <Button
              variant="ghost"
              size="sm"
              className={styles.resetButton}
              onClick={() => setCode(question.defaultCode || '')}
            >
              <RotateCcw className={styles.buttonIcon} />
              <span className={styles.buttonTextDesktop}>Reset Code</span>
              <span className={styles.buttonTextMobile}>Reset</span>
            </Button>
            <Button
              size="sm"
              className={styles.runButton}
              onClick={() => {
                // TODO: Implement query execution API call
              }}
            >
              <Play className={styles.buttonIcon} />
              <span className={styles.buttonTextDesktop}>Chạy thử</span>
              <span className={styles.buttonTextMobile}>Run</span>
            </Button>
          </div>
        </div>

        {/* Editor Container - KEY: flex-1 + overflow-hidden */}
        <div className={styles.editorContainerInner}>
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
