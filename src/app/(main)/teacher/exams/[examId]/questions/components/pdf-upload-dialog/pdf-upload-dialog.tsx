'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  createExamQuestionsBatch,
  extractQuestionsFromPdf
} from '@/lib/actions'
import {
  ExtractedQuestionDraft,
  ExamQuestionItem,
  QuestionType
} from '@/lib/types'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  CREATE_TABLE: 'CREATE TABLE',
  INSERT_DATA: 'INSERT DATA',
  SELECT_QUERY: 'SELECT QUERY',
  TRIGGER: 'TRIGGER',
  FUNCTION: 'FUNCTION',
  STORED_PROCEDURE: 'STORED PROCEDURE'
}

const QUESTION_TYPES: QuestionType[] = [
  'CREATE_TABLE',
  'INSERT_DATA',
  'SELECT_QUERY',
  'TRIGGER',
  'FUNCTION',
  'STORED_PROCEDURE'
]

interface PdfExtractDialogProps {
  open: boolean
  examId: number
  onClose: () => void
  onQuestionsCreated: (questions: ExamQuestionItem[]) => void
}

type Step = 'analyzing' | 'review' | 'saving'

export function PdfUploadDialog({
  open,
  examId,
  onClose,
  onQuestionsCreated
}: PdfExtractDialogProps) {
  const [step, setStep] = useState<Step>('analyzing')
  const [drafts, setDrafts] = useState<ExtractedQuestionDraft[]>([])

  useEffect(() => {
    if (!open) return
    setStep('analyzing')
    setDrafts([])

    const run = async () => {
      try {
        const result = await extractQuestionsFromPdf(examId)
        const questions = result.data?.questions ?? []
        if (questions.length === 0) {
          toast.error(
            'Không tìm thấy câu hỏi trong PDF. Kiểm tra lại file đề thi.'
          )
          onClose()
          return
        }
        setDrafts(questions)
        setStep('review')
      } catch (e) {
        let msg = 'AI không thể phân tích PDF. Vui lòng thử lại.'
        try {
          const raw = e instanceof Error ? e.message : String(e)
          const parsed = JSON.parse(raw)
          if (parsed?.message) msg = parsed.message
        } catch {
          // ignore JSON parse failure — use default message
        }
        toast.error(msg)
        onClose()
      }
    }
    run()
  }, [open])

  function updateDraft(
    index: number,
    field: keyof ExtractedQuestionDraft,
    value: string | number
  ) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    )
  }

  function removeDraft(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (drafts.length === 0) return
    setStep('saving')

    try {
      const payload = {
        questions: drafts.map((d, i) => ({
          content: d.content,
          questionType: d.questionType,
          difficultyLevel: d.difficultyLevel,
          points: d.points,
          orderIndex: i + 1,
          correctQuery: '',
          verifyScript: ''
        }))
      }

      const result = await createExamQuestionsBatch(examId, payload)
      const created = result.data?.questions ?? []
      toast.success(`Đã tạo ${created.length} câu hỏi thành công`)
      onQuestionsCreated(created)
    } catch {
      toast.error('Lưu câu hỏi thất bại. Vui lòng thử lại.')
      setStep('review')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Trích xuất câu hỏi từ PDF đề thi
          </DialogTitle>
          <DialogDescription>
            AI đang phân tích file PDF đề thi và trích xuất các câu hỏi tự động.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-medium">AI đang đọc đề thi…</p>
              <p className="text-sm">Quá trình này có thể mất tới 30 giây</p>
            </div>
          )}

          {(step === 'review' || step === 'saving') && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Tìm thấy{' '}
                <span className="font-semibold text-foreground">
                  {drafts.length}
                </span>{' '}
                câu hỏi. Kiểm tra và chỉnh sửa trước khi lưu.
              </p>

              <div className="space-y-3">
                {drafts.map((draft, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-3 bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-muted-foreground min-w-[24px]">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => removeDraft(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Xoá câu hỏi này"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      className="w-full text-sm border rounded-md p-2 min-h-[80px] resize-y bg-background"
                      value={draft.content}
                      onChange={(e) =>
                        updateDraft(index, 'content', e.target.value)
                      }
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          Loại câu hỏi
                        </label>
                        <select
                          className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
                          value={draft.questionType}
                          onChange={(e) =>
                            updateDraft(index, 'questionType', e.target.value)
                          }
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {QUESTION_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          Điểm
                        </label>
                        <input
                          type="number"
                          min={0.25}
                          step={0.25}
                          className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
                          value={draft.points}
                          onChange={(e) =>
                            updateDraft(
                              index,
                              'points',
                              parseFloat(e.target.value) || 1
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          Độ khó (1–5)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
                          value={draft.difficultyLevel}
                          onChange={(e) =>
                            updateDraft(
                              index,
                              'difficultyLevel',
                              Math.min(
                                5,
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={step === 'saving'}
                >
                  Huỷ
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={drafts.length === 0 || step === 'saving'}
                  className="gap-2"
                >
                  {step === 'saving' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu…
                    </>
                  ) : (
                    <>Lưu {drafts.length} câu hỏi</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
