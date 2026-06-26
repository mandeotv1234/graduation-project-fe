'use client'

import {
  AlertTriangle,
  Check,
  Loader2,
  MessageSquarePlus,
  Sparkles,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { refineRubricTestCases } from '@/lib/actions'
import type {
  GradingRubric,
  RefineRubricTestCasesResponse,
  RubricRefinementMode
} from '@/lib/types'

type ContextQuery = {
  questionType?: string
  content?: string
  correctQuery: string
}

interface AiRubricRefinementPanelProps {
  questionType: string
  totalPoints: number
  currentRubric: GradingRubric
  onApply: (rubric: GradingRubric) => void
  correctQuery?: string
  questionContent?: string
  schemaContext?: string
  contextQueries?: ContextQuery[]
  activeTargetId?: string
  activeTargetLabel?: string
  className?: string
}

const MODES: Array<{
  value: RubricRefinementMode
  label: string
  description: string
}> = [
  {
    value: 'EDIT_TEST_CASE',
    label: 'Sửa mục đang chọn',
    description: 'AI chỉ tập trung vào testcase/bảng hiện tại.'
  },
  {
    value: 'ADD_TEST_CASE',
    label: 'Thêm testcase',
    description: 'AI thêm case hoặc dữ liệu kỳ vọng mới.'
  },
  {
    value: 'IMPROVE_COVERAGE',
    label: 'Tăng bao phủ',
    description: 'AI bổ sung phần còn thiếu theo prompt.'
  },
  {
    value: 'REBALANCE_POINTS',
    label: 'Chỉnh điểm',
    description: 'AI giữ logic test và cân lại mức điểm.'
  }
]

export function AiRubricRefinementPanel({
  questionType,
  totalPoints,
  currentRubric,
  onApply,
  correctQuery,
  questionContent,
  schemaContext,
  contextQueries = [],
  activeTargetId,
  activeTargetLabel,
  className = ''
}: AiRubricRefinementPanelProps) {
  const [mode, setMode] = useState<RubricRefinementMode>(
    activeTargetId ? 'EDIT_TEST_CASE' : 'IMPROVE_COVERAGE'
  )
  const [instruction, setInstruction] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [pending, setPending] = useState<RefineRubricTestCasesResponse | null>(
    null
  )

  const effectiveTargetId = mode === 'EDIT_TEST_CASE' ? activeTargetId : ''
  const placeholder = useMemo(() => {
    if (mode === 'ADD_TEST_CASE') {
      return 'Ví dụ: Thêm một test case kiểm tra trường hợp không có dữ liệu khớp điều kiện và kỳ vọng trả về rỗng.'
    }
    if (mode === 'REBALANCE_POINTS') {
      return 'Ví dụ: Giảm điểm trừ testcase biên xuống 0.25 và giữ tổng điểm đúng bằng điểm câu hỏi.'
    }
    if (mode === 'EDIT_TEST_CASE') {
      return 'Ví dụ: Testcase này chưa bao phủ trường hợp NULL, hãy sửa setup và expected result cho đúng.'
    }
    return 'Ví dụ: Các testcase hiện tại thiếu ca dữ liệu trùng khóa/biên ngày, hãy bổ sung để bao phủ hơn.'
  }, [mode])

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      toast.error('Nhập prompt để AI biết cần sửa gì')
      return
    }
    if (!correctQuery?.trim()) {
      toast.error('Cần có SQL đáp án trước khi nhờ AI chỉnh testcase')
      return
    }

    setIsRefining(true)
    setPending(null)
    try {
      const result = await refineRubricTestCases({
        correctQuery: correctQuery.trim(),
        questionContent: questionContent || '',
        totalPoints,
        questionType,
        schemaContext: schemaContext || '',
        contextQueries,
        currentRubric,
        teacherInstruction: instruction.trim(),
        target: {
          mode,
          testCaseId: effectiveTargetId || undefined
        }
      })

      if (!result.data?.rubric) {
        toast.error(result.message || 'AI chưa trả về rubric hợp lệ')
        return
      }

      setPending({
        rubric: result.data.rubric,
        changeSummary: Array.isArray(result.data.changeSummary)
          ? result.data.changeSummary
          : [],
        warnings: Array.isArray(result.data.warnings)
          ? result.data.warnings
          : []
      })
      toast.success('AI đã đề xuất cập nhật rubric')
    } catch {
      toast.error('Không thể gọi AI để chỉnh testcase')
    } finally {
      setIsRefining(false)
    }
  }

  const handleApply = () => {
    if (!pending?.rubric) return
    onApply(pending.rubric)
    setPending(null)
    setInstruction('')
    toast.success('Đã áp dụng rubric AI đề xuất')
  }

  return (
    <div
      className={`rounded-lg border border-border bg-muted/20 p-3 ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquarePlus className="h-4 w-4 text-primary" />
            Prompt AI sửa testcase
            {activeTargetLabel && (
              <Badge
                variant="secondary"
                className="max-w-[16rem] truncate rounded-full px-2 py-0 text-[10px]"
                title={activeTargetLabel}
              >
                {activeTargetLabel}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            AI nhận rubric hiện tại, SQL đáp án, schema và context câu trước để
            sửa đúng phần giáo viên yêu cầu.
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {MODES.map((item) => {
          const disabled = item.value === 'EDIT_TEST_CASE' && !activeTargetId
          return (
            <button
              key={item.value}
              type="button"
              disabled={disabled}
              onClick={() => setMode(item.value)}
              className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                mode === item.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              title={item.description}
            >
              <span className="block font-semibold">{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-2">
        <Textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder={placeholder}
          className="min-h-24 resize-y bg-background text-sm"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {effectiveTargetId
              ? `Đang nhắm tới: ${effectiveTargetId}`
              : 'Không nhắm riêng testcase nào'}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isRefining}
            className="gap-2"
          >
            {isRefining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Nhờ AI sửa
          </Button>
        </div>
      </div>

      {pending && (
        <div className="mt-3 rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              Kết quả AI đề xuất
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPending(null)}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Bỏ qua
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Áp dụng
              </Button>
            </div>
          </div>

          {pending.changeSummary.length > 0 && (
            <ul className="mb-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {pending.changeSummary.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          )}

          {pending.warnings.length > 0 && (
            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                {pending.warnings.map((item, index) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
