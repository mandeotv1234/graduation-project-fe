'use client'

import React, { useState } from 'react'
import {
  Trophy,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import { SubmitExamResponse } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog/submit-result-dialog.module.scss'

interface SubmitResultDialogProps {
  result: SubmitExamResponse
  showResult?: boolean
  onBack: () => void
}

export function SubmitResultDialog({
  result,
  showResult = true,
  onBack
}: SubmitResultDialogProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<
    Record<number, boolean>
  >({})
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const toggleExpand = (id: number) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Handle case where result is restricted
  if (!showResult) {
    return (
      <div className={styles.dialogOverlay}>
        <div className={cn(styles.resultCard, 'max-w-xl text-center p-12')}>
          <div className={styles.header}>
            <div className={cn(styles.trophyIcon, 'mb-8')}>
              <CheckCircle2 className="h-12 w-12" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4">
            Nộp bài thành công!
          </h2>
          <p className="text-muted-foreground mb-10 leading-relaxed text-lg">
            Hệ thống đã ghi nhận bài làm của bạn. Kết quả chi tiết sẽ được công
            bố sau khi giáo viên phê duyệt.
          </p>
          <Button
            onClick={onBack}
            size="lg"
            className="w-full sm:w-auto px-10 py-6 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
          >
            Quay về danh sách bài thi
          </Button>
        </div>
      </div>
    )
  }

  const hasValidScores =
    typeof result.totalScore === 'number' &&
    typeof result.maxScore === 'number' &&
    result.maxScore > 0

  const isSuccess =
    hasValidScores &&
    result.totalScore !== undefined &&
    result.maxScore !== undefined
      ? result.totalScore >= result.maxScore * 0.5
      : false

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.resultCard}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.decorativeBg} />

          <div className={styles.trophyIcon}>
            {isSuccess ? (
              <Trophy className="h-10 w-10" />
            ) : (
              <AlertCircle className="h-10 w-10" />
            )}
          </div>

          <h2 className={styles.title}>
            {isSuccess ? 'Tuyệt vời!' : 'Cố gắng lên!'}
          </h2>
          <p className={styles.subtitle}>
            Bạn đã nộp bài thành công, hãy xem lại các câu chưa đạt nhé.
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.value}>
              <span className={styles.big}>{result.totalScore || 0}</span>
              <span className={styles.small}>/{result.maxScore || 0}</span>
            </div>
            <span className={styles.label}>Điểm số</span>
          </div>

          <div className={styles.statItem}>
            <div className={styles.value}>
              <span className={styles.big}>
                {result.maxScore
                  ? (
                      ((result.totalScore || 0) / result.maxScore) *
                      100
                    ).toFixed(1)
                  : 0}
              </span>
              <span className={styles.small}>%</span>
            </div>
            <span className={styles.label}>Tỷ lệ</span>
          </div>

          <div className={styles.statItem}>
            <div className={styles.value}>
              <span className={styles.big}>{result.correctCount || 0}</span>
              <span className={styles.small}>
                /{result.totalQuestions || 0}
              </span>
            </div>
            <span className={styles.label}>Câu đúng</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.mainActions}>
          <Button
            onClick={() => setShowDetailsModal(true)}
            variant="outline"
            size="lg"
            className={styles.viewDetailsBtn}
          >
            <FileText className="h-5 w-5 mr-2" />
            Chi tiết bài làm
          </Button>
        </div>

        {/* Details Modal */}
        {showDetailsModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.titleInfo}>
                  <FileText className="h-5 w-5 text-primary" />
                  <h3>Chi tiết bài làm</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetailsModal(false)}
                  className={styles.closeBtn}
                >
                  <XCircle className="h-6 w-6" />
                </Button>
              </div>

              <div className={styles.modalScrollArea}>
                <div className={styles.questionsGrid}>
                  {(result.details || []).map((detail, index) => {
                    const qr = result.questionResults?.find(
                      (q) => q.questionId === detail.questionId
                    )
                    const orderIndex = qr?.orderIndex || index + 1
                    const isExpanded = !!expandedQuestions[detail.questionId]
                    const isCorrect = qr?.isCorrect ?? false

                    return (
                      <div
                        key={detail.questionId}
                        className={cn(
                          styles.questionCard,
                          isCorrect ? styles.correct : styles.incorrect
                        )}
                      >
                        <button
                          onClick={() => toggleExpand(detail.questionId)}
                          className={styles.header}
                        >
                          <div className={styles.left}>
                            <div className={styles.index}>{orderIndex}</div>
                            <span className={styles.text}>
                              {detail.studentQuery || '(Không có câu trả lời)'}
                            </span>
                          </div>

                          <div className={styles.right}>
                            <div className={styles.points}>
                              {qr?.scoreEarned ?? 0}/
                              {qr?.maxPoints || detail.points} đ
                            </div>
                            <div
                              className={cn(
                                styles.status,
                                isCorrect ? styles.correct : styles.incorrect
                              )}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className={styles.content}>
                            <div className={styles.promptTitle}>
                              <FileText className="h-3 w-3" /> Đề bài
                            </div>
                            <div
                              className={styles.promptBody}
                              dangerouslySetInnerHTML={{
                                __html: detail.content
                              }}
                            />

                            <div className={styles.sqlTitle}>
                              <CheckCircle2 className="h-3 w-3" /> Câu truy vấn
                              đã viết
                            </div>
                            <pre className={styles.sqlBlock}>
                              <code>{detail.studentQuery || '-- Trống'}</code>
                            </pre>

                            {qr?.errorMessage && (
                              <div className={styles.errorBlock}>
                                <AlertCircle className="h-4 w-4 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-bold mb-1">
                                    Lỗi chấm điểm
                                  </p>
                                  <p className="leading-normal">
                                    {qr.errorMessage}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className={styles.metrics}>
                              <div className={styles.metric}>
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  Hiệu năng:{' '}
                                  <span className={styles.val}>
                                    {qr?.executionTimeMs ?? 0}ms
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full sm:w-auto px-8"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className={styles.backButton}
          >
            <ArrowLeft className="h-5 w-5" />
            Về danh sách bài thi
          </Button>
        </div>
      </div>
    </div>
  )
}
