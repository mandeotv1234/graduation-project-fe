'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Pencil,
  X,
  Save,
  User,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import DOMPurify from 'dompurify'
import { QuestionResultDetail, OverrideSubmissionRequest } from '@/lib/types'
import { overrideSubmissionScore } from '@/lib/actions'
import { formatDateTime } from '@/lib/utils/time'
import styles from './submission-detail-view.module.scss'

// Map raw questionType to display label
const QUESTION_TYPE_LABELS: Record<string, string> = {
  SELECT_QUERY: 'SELECT',
  CREATE_TABLE: 'CREATE TABLE',
  INSERT_DATA: 'INSERT',
  TRIGGER: 'TRIGGER',
  FUNCTION: 'FUNCTION',
  STORED_PROCEDURE: 'PROCEDURE'
}

// Parse error message into structured sections split by ". " or " | "
function parseErrorSections(
  error: string
): Array<{ label: string; content: string }> {
  // Split by " | " first (SQL error vs rubric detail)
  const parts = error.split(' | ').filter(Boolean)
  if (parts.length >= 2) {
    return [
      { label: 'Lỗi SQL', content: parts[0].trim() },
      { label: 'Chi tiết chấm điểm', content: parts.slice(1).join('\n') }
    ]
  }
  // Single block — split long sentences by ". " for readability
  const sentences = error.split('. ').filter(Boolean)
  if (sentences.length > 2) {
    return sentences.map((s, i) => ({
      label: i === 0 ? 'Lỗi' : `Chi tiết ${i}`,
      content: s.trim().replace(/\.?$/, '')
    }))
  }
  return [{ label: 'Chi tiết lỗi', content: error }]
}

interface QuestionCardProps {
  qr: QuestionResultDetail
  index: number
  examId: number
  resultId: number
  isEditing: boolean
  isRegrading: boolean
  canEdit: boolean
  previousScore?: { scoreEarned: number; isCorrect: boolean } | null
  onEditStart: () => void
  onEditCancel: () => void
  onSaveSuccess: (
    updated: Partial<QuestionResultDetail> & {
      updatedResult?: {
        totalScore: number
        correctCount: number
        gradingType: 'AUTO' | 'MANUAL' | 'MIXED'
      }
    }
  ) => void
}

export function QuestionCard({
  qr,
  index,
  examId,
  resultId,
  isEditing,
  isRegrading,
  canEdit,
  previousScore,
  onEditStart,
  onEditCancel,
  onSaveSuccess
}: QuestionCardProps) {
  const [editScore, setEditScore] = useState(qr.scoreEarned)
  const [editIsCorrect, setEditIsCorrect] = useState(qr.isCorrect)
  const [editComment, setEditComment] = useState(qr.teacherComment ?? '')
  const [saving, setSaving] = useState(false)

  // Reset edit form when entering edit mode (prevents stale values after regrade)
  React.useEffect(() => {
    if (isEditing) {
      setEditScore(qr.scoreEarned)
      setEditIsCorrect(qr.isCorrect)
      setEditComment(qr.teacherComment ?? '')
    }
  }, [isEditing, qr.scoreEarned, qr.isCorrect, qr.teacherComment])

  // When score changes, auto-set isCorrect if score reaches maxPoints
  function handleScoreChange(val: string) {
    const n = parseFloat(val)
    if (!isNaN(n)) {
      const clamped = Math.min(Math.max(n, 0), qr.maxPoints)
      setEditScore(clamped)
      if (clamped >= qr.maxPoints) setEditIsCorrect(true)
      else if (clamped === 0) setEditIsCorrect(false)
    }
  }

  // Validate before opening confirmation dialog
  const scoreValid =
    !isNaN(editScore) && editScore >= 0 && editScore <= qr.maxPoints

  async function handleSave() {
    if (!scoreValid) {
      toast.error(`Điểm phải từ 0 đến ${qr.maxPoints}`)
      return
    }
    setSaving(true)
    try {
      const payload: OverrideSubmissionRequest = {
        scoreEarned: editScore,
        isCorrect: editIsCorrect,
        teacherComment: editComment.trim() || undefined
      }

      if (!qr.submissionId) {
        toast.error('Không có mã submission cho câu hỏi này')
        return
      }
      const res = await overrideSubmissionScore(
        examId,
        resultId,
        qr.submissionId,
        payload
      )

      if (res.data) {
        toast.success('Đã cập nhật điểm thành công')
        onSaveSuccess({
          scoreEarned: res.data.scoreEarned,
          isCorrect: res.data.isCorrect,
          teacherComment: res.data.teacherComment,
          gradingType: 'MANUAL',
          updatedResult: res.data.updatedResult
        })
      } else {
        toast.error(res.message ?? 'Không thể cập nhật điểm')
      }
    } catch {
      toast.error('Lỗi kết nối khi lưu điểm')
    } finally {
      setSaving(false)
    }
  }

  const typeLabel = QUESTION_TYPE_LABELS[qr.questionType] ?? qr.questionType

  // Comparison delta (phase 9)
  const hasPrev = previousScore != null
  const scoreDelta = hasPrev ? qr.scoreEarned - previousScore!.scoreEarned : 0
  const deltaClass =
    scoreDelta > 0
      ? styles.deltaPositive
      : scoreDelta < 0
        ? styles.deltaNegative
        : styles.deltaNeutral

  return (
    <div
      className={`${styles.questionCard} ${qr.isCorrect ? styles.correct : styles.incorrect}`}
    >
      {/* Card header */}
      <div className={styles.qHeader}>
        <div className={styles.qHeaderLeft}>
          <span className={styles.qTitle}>Câu hỏi {index + 1}</span>

          {/* Phase 7: question type badge */}
          <span className={styles.questionTypeBadge}>{typeLabel}</span>

          {/* Phase 7: grading type badge */}
          <span
            className={`${styles.gradingBadge} ${
              qr.gradingType === 'MANUAL'
                ? styles.gradingManual
                : styles.gradingAuto
            }`}
          >
            {qr.gradingType === 'MANUAL' ? 'Thủ công' : 'Tự động'}
          </span>
        </div>

        <div className={styles.qHeaderRight}>
          {/* Phase 9: comparison delta */}
          {hasPrev && (
            <span className={`${styles.scoreDelta} ${deltaClass}`}>
              {scoreDelta > 0
                ? `+${scoreDelta.toFixed(1)}`
                : scoreDelta.toFixed(1)}
              đ
            </span>
          )}

          <span
            className={`${styles.qScore} ${qr.isCorrect ? styles.passed : styles.failed}`}
          >
            {qr.scoreEarned.toFixed(1)}/{qr.maxPoints}đ
          </span>

          {/* Phase 8: edit button */}
          {canEdit && !isEditing && !isRegrading && (
            <Button
              variant="outline"
              size="sm"
              className={styles.editBtn}
              onClick={onEditStart}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Sửa điểm
            </Button>
          )}

          {canEdit && isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditCancel}
              disabled={saving}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Phase 8: inline edit form — placed above code for long scripts */}
      {isEditing && (
        <div className={styles.editForm}>
          <div className={styles.editFormRow}>
            <div className={styles.editField}>
              <Label htmlFor={`score-${qr.questionId}`}>
                Điểm ({0} – {qr.maxPoints})
              </Label>
              <Input
                id={`score-${qr.questionId}`}
                type="number"
                step="0.5"
                min={0}
                max={qr.maxPoints}
                value={editScore}
                onChange={(e) => handleScoreChange(e.target.value)}
                className={styles.scoreInput}
              />
            </div>

            <div className={styles.editField}>
              <Label>Kết quả</Label>
              <div className={styles.correctToggle}>
                <input
                  type="checkbox"
                  id={`correct-${qr.questionId}`}
                  checked={editIsCorrect}
                  onChange={(e) => setEditIsCorrect(e.target.checked)}
                  className={styles.correctCheckbox}
                />
                <label
                  htmlFor={`correct-${qr.questionId}`}
                  className={styles.correctLabel}
                >
                  {editIsCorrect ? 'Đúng' : 'Sai'}
                </label>
              </div>
            </div>
          </div>

          <div className={styles.editField}>
            <Label htmlFor={`comment-${qr.questionId}`}>
              Nhận xét của giáo viên (tùy chọn)
            </Label>
            <Textarea
              id={`comment-${qr.questionId}`}
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              maxLength={1000}
              placeholder="Nhập nhận xét cho học sinh..."
              rows={3}
              className={styles.commentInput}
            />
            <span className={styles.charCount}>{editComment.length}/1000</span>
          </div>

          <div className={styles.editActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditCancel}
              disabled={saving}
            >
              Hủy
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={saving || !scoreValid}>
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {saving ? 'Đang lưu...' : 'Lưu điểm'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận thay đổi điểm</AlertDialogTitle>
                  <AlertDialogDescription>
                    Điểm câu {index + 1} sẽ được đổi từ{' '}
                    <strong>{qr.scoreEarned.toFixed(1)}</strong> thành{' '}
                    <strong>{editScore.toFixed(1)}</strong>/{qr.maxPoints}đ.
                    Hành động này sẽ chuyển câu hỏi sang trạng thái chấm thủ
                    công.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSave}>
                    Xác nhận lưu
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Card body */}
      <div className={styles.qContent}>
        <div
          className={styles.prompt}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(qr.content) }}
        />

        <div className={styles.codeSections}>
          <div className={`${styles.codeBlock} ${styles.student}`}>
            <label>Câu trả lời của SV</label>
            <pre>{qr.studentQuery || '/* Không nộp câu trả lời */'}</pre>
          </div>
          <div className={`${styles.codeBlock} ${styles.correct}`}>
            <label>Đáp án đúng (Mẫu)</label>
            <pre>{qr.correctQuery || '/* Không có đáp án mẫu */'}</pre>
          </div>
        </div>
      </div>

      {/* Phase 7: teacher comment section */}
      {qr.teacherComment && !isEditing && (
        <div className={styles.teacherComment}>
          <div className={styles.commentMeta}>
            <User className="h-3 w-3" />
            <span>{qr.gradedByName ?? 'Giáo viên'}</span>
            {qr.gradedAt && (
              <>
                <Clock className="h-3 w-3 ml-1" />
                <span>{formatDateTime(qr.gradedAt)}</span>
              </>
            )}
          </div>
          <p className={styles.commentText}>{qr.teacherComment}</p>
        </div>
      )}

      {/* Footer: result/error message */}
      {qr.errorMessage ? (
        <div className={styles.errorDetail}>
          <details>
            <summary className={styles.errorSummary}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              Lỗi chấm bài — bấm để xem chi tiết
            </summary>
            <div className={styles.errorContent}>
              {parseErrorSections(qr.errorMessage).map((section, i) => (
                <div key={i} className={styles.errorSection}>
                  <div className={styles.errorLabel}>{section.label}</div>
                  <pre>{section.content}</pre>
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : qr.isCorrect ? (
        <div className={`${styles.qFooter} ${styles.success}`}>
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Kết quả:</strong> Câu truy vấn thực thi chính xác.
            {qr.executionTimeMs && ` (Thực thi trong ${qr.executionTimeMs}ms)`}
          </span>
        </div>
      ) : (
        <div className={styles.qFooter}>
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Kết quả:</strong> Câu truy vấn KHÔNG CHÍNH XÁC hoặc không
            khớp kết quả mẫu.
          </span>
        </div>
      )}
    </div>
  )
}
