'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Trophy,
  CheckCircle2,
  FileText,
  ArrowLeft,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Loader2
} from 'lucide-react'
import { SubmitExamResponse } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/submit-result-dialog/submit-result-dialog.module.scss'
import { FeedbackDialog } from './feedback-dialog'

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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const totalScore =
    typeof result.totalScore === 'number' && Number.isFinite(result.totalScore)
      ? result.totalScore
      : null
  const maxScore =
    typeof result.maxScore === 'number' && Number.isFinite(result.maxScore)
      ? result.maxScore
      : null

  if (result.status !== 'COMPLETED') {
    return (
      <div className={styles.dialogOverlay}>
        <div className={cn(styles.resultCard, 'max-w-xl p-12 text-center')}>
          <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-primary" />
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Hệ thống đang chấm bài...
          </h2>
          <p className="text-muted-foreground">
            Bài làm đã được ghi nhận. Kết quả sẽ hiển thị ngay khi chấm xong.
          </p>
        </div>
      </div>
    )
  }

  // Handle case where result is restricted
  if (!showResult) {
    return (
      <>
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
              Hệ thống đã ghi nhận bài làm của bạn. Kết quả chi tiết sẽ được
              công bố sau khi giáo viên phê duyệt.
            </p>
            <Button
              onClick={onBack}
              size="lg"
              className="w-full sm:w-auto px-10 py-6 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
            >
              Quay về danh sách bài thi
            </Button>

            <Button
              onClick={() => setShowFeedbackModal(true)}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-10 py-6 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 mt-4 sm:ml-4 sm:mt-0"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Đánh giá hệ thống
            </Button>
          </div>
        </div>
        {showFeedbackModal && (
          <FeedbackDialog
            examId={result.examId}
            onClose={() => setShowFeedbackModal(false)}
          />
        )}
      </>
    )
  }

  if (totalScore === null || maxScore === null) {
    return (
      <div className={styles.dialogOverlay}>
        <div className={cn(styles.resultCard, 'max-w-xl p-12 text-center')}>
          <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-primary" />
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Đang đồng bộ kết quả...
          </h2>
          <p className="text-muted-foreground">
            Hệ thống đã chấm xong và đang tải điểm bài làm của bạn.
          </p>
        </div>
      </div>
    )
  }

  const isSuccess = maxScore > 0 && totalScore >= maxScore * 0.5

  return (
    <>
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
                <span className={styles.big}>{totalScore}</span>
                <span className={styles.small}>/{maxScore}</span>
              </div>
              <span className={styles.label}>Điểm số</span>
            </div>

            <div className={styles.statItem}>
              <div className={styles.value}>
                <span className={styles.big}>
                  {maxScore ? ((totalScore / maxScore) * 100).toFixed(1) : 0}
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
            {result.resultId && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className={styles.viewDetailsBtn}
              >
                <Link href={PATH.STUDENT_EXAM_RESULT(result.resultId)}>
                  <FileText className="h-5 w-5 mr-2" />
                  Chi tiết bài làm
                </Link>
              </Button>
            )}

            {result.resultId && result.status === 'COMPLETED' && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className={cn(
                  styles.viewDetailsBtn,
                  'ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:text-primary'
                )}
              >
                <Link href={PATH.STUDENT_EXAM_RESULT_FEEDBACK(result.resultId)}>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Feedback AI bài làm
                </Link>
              </Button>
            )}

            <Button
              onClick={() => setShowFeedbackModal(true)}
              variant="outline"
              size="lg"
              className={cn(
                styles.viewDetailsBtn,
                'ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:text-primary'
              )}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Đánh giá hệ thống
            </Button>
          </div>

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

      {showFeedbackModal && (
        <FeedbackDialog
          examId={result.examId}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </>
  )
}
