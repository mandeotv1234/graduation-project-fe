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
  Clock,
  ChevronDown,
  ChevronUp
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
import { GradingTraceSection } from './grading-trace-section'
import { SqlSyntaxHighlight } from '@/components/shared/sql-syntax-highlight'
import { SqlPlayground } from './sql-playground/sql-playground'
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

function getSqlLineCount(code: string) {
  const normalized = code.replace(/\s+$/, '')
  if (!normalized) return 0
  return normalized.split(/\r?\n/).length
}

type ErrorSection = { label: string; content: string }

function formatLegacyTestCaseError(content: string) {
  const normalized = content
    .replace(/\s*->\s*/g, ' → ')
    .replace(/\s*→\s*/g, ' → ')
    .replace(/\.\s+→\s*trừ\s+/gi, '\nThực trừ: ')

  const ruleMatch = normalized.match(
    /^(Rule\s+[^(]+\s*\([^)]+\):)\s*trừ\s+([^\n]+)([\s\S]*)$/i
  )
  if (!ruleMatch) {
    return normalized.trim()
  }

  return `${ruleMatch[1]}\nMức trừ theo rule: ${ruleMatch[2].trim()}${
    ruleMatch[3]
  }`.trim()
}

// Parse error message into structured sections without splitting test-case context.
function parseErrorSections(error: string): ErrorSection[] {
  // Split by " | " first (SQL error vs rubric detail)
  const parts = error.split(' | ').filter(Boolean)
  if (parts.length >= 2) {
    return [
      { label: 'Lỗi SQL', content: parts[0].trim() },
      { label: 'Chi tiết chấm điểm', content: parts.slice(1).join('\n') }
    ]
  }

  const testCaseBlocks = error.match(
    /\[TC_[^\]]+\][\s\S]*?(?=\s*\[TC_[^\]]+\]|$)/g
  )
  if (testCaseBlocks && testCaseBlocks.length > 0) {
    return testCaseBlocks.map((block, index) => {
      const match = block
        .trim()
        .match(/^\[(TC_[^\]]+)\]\s*([^:]+):\s*([\s\S]*)$/)

      if (!match) {
        return {
          label: `Test case ${index + 1}`,
          content: formatLegacyTestCaseError(block)
        }
      }

      const [, testCaseId, caseName, detail] = match
      return {
        label: `${testCaseId} - ${caseName.trim()}`,
        content: formatLegacyTestCaseError(detail)
      }
    })
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
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Reset edit form when entering edit mode (prevents stale values after regrade)
  React.useEffect(() => {
    if (isEditing) {
      setIsCollapsed(false)
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
  const testCaseResults = qr.testCaseResults ?? []
  const hasTestCaseResults = testCaseResults.length > 0
  const passedTestCases = testCaseResults.filter((tc) => tc.passed).length
  const studentCode = qr.studentQuery || '/* Không nộp câu trả lời */'
  const correctCode = qr.correctQuery || '/* Không có đáp án mẫu */'

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
              onClick={() => {
                setIsCollapsed(false)
                onEditStart()
              }}
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

          <Button
            variant="ghost"
            size="sm"
            className={styles.collapseBtn}
            onClick={() => setIsCollapsed((current) => !current)}
            disabled={isEditing}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
            {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
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
                <span className={styles.charCount}>
                  {editComment.length}/1000
                </span>
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
                      <AlertDialogTitle>
                        Xác nhận thay đổi điểm
                      </AlertDialogTitle>
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
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(qr.content)
              }}
            />

            <div className={styles.codeSections}>
              <div className={`${styles.codeBlock} ${styles.student}`}>
                <div className={styles.codeHeader}>
                  <div className={styles.codeTitle}>
                    <User className="h-3.5 w-3.5" />
                    <span>Câu trả lời của sinh viên</span>
                  </div>
                  <span className={styles.codeMeta}>
                    {getSqlLineCount(studentCode)} dòng
                  </span>
                </div>
                <SqlSyntaxHighlight code={studentCode} />
              </div>
              <div className={`${styles.codeBlock} ${styles.correct}`}>
                <div className={styles.codeHeader}>
                  <div className={styles.codeTitle}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Đáp án mẫu của giáo viên</span>
                  </div>
                  <span className={styles.codeMeta}>
                    {getSqlLineCount(correctCode)} dòng
                  </span>
                </div>
                <SqlSyntaxHighlight code={correctCode} />
              </div>
            </div>

            {/* SQL Playground */}
            <div className="mt-4">
              <SqlPlayground
                examId={examId}
                resultId={resultId}
                studentQuery={qr.studentQuery || ''}
                correctQuery={qr.correctQuery || ''}
              />
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

          {/* Footer: grading trace (preferred) or legacy fallback */}
          {qr.gradingTrace && (qr.gradingTrace.items?.length ?? 0) > 0 ? (
            <GradingTraceSection trace={qr.gradingTrace} />
          ) : qr.errorMessage || hasTestCaseResults ? (
            <div className={styles.errorDetail}>
              <details>
                <summary className={styles.errorSummary}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {hasTestCaseResults
                    ? 'Chi tiết kỹ thuật - bấm để xem'
                    : 'Lỗi chấm bài - bấm để xem chi tiết'}
                </summary>
                <div className={styles.errorContent}>
                  {hasTestCaseResults && (
                    <div className={styles.testCaseResults}>
                      <div className={styles.testCaseHeader}>
                        <span>Kết quả test case</span>
                        <span>
                          {passedTestCases}/{testCaseResults.length} đạt
                        </span>
                      </div>

                      <div className={styles.testCaseList}>
                        {testCaseResults.map((tc, tcIndex) => (
                          <div
                            key={tc.testCaseId ?? `${tc.caseName}-${tcIndex}`}
                            className={`${styles.testCaseRow} ${
                              tc.passed
                                ? styles.testCasePassed
                                : styles.testCaseFailed
                            }`}
                          >
                            <div className={styles.testCaseMain}>
                              {tc.passed ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                              ) : (
                                <AlertCircle className="h-4 w-4 shrink-0" />
                              )}
                              <div className={styles.testCaseText}>
                                <div className={styles.testCaseName}>
                                  Test case {tcIndex + 1}: {tc.caseName}
                                </div>
                                {!tc.passed && tc.message && (
                                  <pre className={styles.testCaseMessage}>
                                    {tc.message}
                                  </pre>
                                )}
                              </div>
                            </div>
                            <div className={styles.testCaseScore}>
                              Trừ {Number(tc.scoreEarned ?? 0).toFixed(2)} /{' '}
                              {Number(tc.maxPoints ?? 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {qr.errorMessage &&
                    parseErrorSections(qr.errorMessage).map((section, i) => (
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
                {qr.executionTimeMs &&
                  ` (Thực thi trong ${qr.executionTimeMs}ms)`}
              </span>
            </div>
          ) : (
            <div className={styles.qFooter}>
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Kết quả:</strong> Câu truy vấn KHÔNG CHÍNH XÁC hoặc
                không khớp kết quả mẫu.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
