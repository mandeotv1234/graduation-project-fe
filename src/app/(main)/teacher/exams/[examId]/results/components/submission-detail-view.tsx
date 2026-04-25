'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  TeacherExamResultDetail,
  QuestionResultDetail,
  PreviousScores
} from '@/lib/types'
import { regradeExamResult, getTeacherSubmissionDetail } from '@/lib/actions'
import { formatDateTime } from '@/lib/utils/time'
import { QuestionCard } from './question-card'
import styles from './submission-detail-view.module.scss'

interface SubmissionDetailViewProps {
  examId: number
  submissionId: number
  detail: TeacherExamResultDetail
}

// Grading type label in Vietnamese
const GRADING_TYPE_LABELS: Record<string, string> = {
  AUTO: 'Tự động',
  MANUAL: 'Thủ công',
  MIXED: 'Kết hợp'
}

export function SubmissionDetailView({
  examId,
  submissionId,
  detail: initialDetail
}: SubmissionDetailViewProps) {
  const router = useRouter()

  // Phase 8: mutable local copy of detail (for score override updates)
  const [detail, setDetail] = useState<TeacherExamResultDetail>(initialDetail)

  // Phase 8: which question is being edited (only one at a time)
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null
  )

  // Phase 9: re-grade state
  const [isRegrading, setIsRegrading] = useState(false)
  const [previousScores, setPreviousScores] = useState<PreviousScores | null>(
    null
  )
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollStartRef = useRef<number>(0)
  const POLL_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes max polling

  // Cleanup polling on unmount
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current)
    }
  }, [])

  // Phase 9: poll for re-grade completion (setTimeout loop — no overlapping requests)
  const startPolling = useCallback(() => {
    if (pollingRef.current) clearTimeout(pollingRef.current)
    pollStartRef.current = Date.now()

    async function poll() {
      // Timeout guard — stop after 5 minutes
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        pollingRef.current = null
        setIsRegrading(false)
        toast.error('Chấm lại quá thời gian chờ. Vui lòng tải lại trang.')
        return
      }

      try {
        const res = await getTeacherSubmissionDetail(examId, submissionId)
        if (res.data) {
          const status = res.data.status
          if (status === 'COMPLETED' || status === 'FAILED') {
            pollingRef.current = null
            setIsRegrading(false)

            if (status === 'COMPLETED') {
              setDetail(res.data)
              toast.success('Chấm lại hoàn tất!')
            } else {
              toast.error('Chấm lại thất bại. Vui lòng thử lại.')
            }
            return
          }
        }
      } catch {
        // Silently retry on network error
      }

      // Schedule next poll only after current finishes
      pollingRef.current = setTimeout(poll, 3000)
    }

    // Start first poll after 3s delay
    pollingRef.current = setTimeout(poll, 3000)
  }, [examId, submissionId])

  // Phase 9: trigger re-grade
  async function handleRegrade() {
    setEditingQuestionId(null) // Close any active edit form
    setIsRegrading(true)
    setPreviousScores(null)
    try {
      const res = await regradeExamResult(examId, submissionId)
      if (res.data) {
        setPreviousScores(res.data.previousScores)
        toast.info('Đang chấm lại... Vui lòng chờ.')
        startPolling()
      } else {
        setIsRegrading(false)
        toast.error(res.message ?? 'Không thể bắt đầu chấm lại')
      }
    } catch {
      setIsRegrading(false)
      toast.error('Lỗi kết nối khi bắt đầu chấm lại')
    }
  }

  // Phase 8: handle save success from QuestionCard
  function handleSaveSuccess(
    questionId: number,
    updated: Partial<QuestionResultDetail> & {
      updatedResult?: {
        totalScore: number
        correctCount: number
        gradingType: 'AUTO' | 'MANUAL' | 'MIXED'
      }
    }
  ) {
    setDetail((prev) => {
      const newQuestions = prev.questionResults.map((qr) =>
        qr.questionId === questionId ? { ...qr, ...updated } : qr
      )
      return {
        ...prev,
        questionResults: newQuestions,
        totalScore: updated.updatedResult?.totalScore ?? prev.totalScore,
        correctCount: updated.updatedResult?.correctCount ?? prev.correctCount,
        gradingType: updated.updatedResult?.gradingType ?? prev.gradingType
      }
    })
    setEditingQuestionId(null)
  }

  const canEdit = detail.status === 'COMPLETED'

  // Phase 9: map previousScores.details by questionId for quick lookup
  const prevScoreMap = previousScores
    ? Object.fromEntries(previousScores.details.map((d) => [d.questionId, d]))
    : {}

  const totalDelta = previousScores
    ? detail.totalScore - previousScores.totalScore
    : 0

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1>Chi tiết bài làm</h1>
            <p>
              Học sinh: {detail.studentName} · Mã lượt nộp #{submissionId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Phase 9: Re-grade button */}
          {canEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRegrading}
                  className={styles.regradeBtn}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 mr-1.5 ${isRegrading ? 'animate-spin' : ''}`}
                  />
                  {isRegrading ? 'Đang chấm lại...' : 'Chấm lại'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận chấm lại</AlertDialogTitle>
                  <AlertDialogDescription>
                    Chấm lại sẽ thực hiện lại quá trình chấm tự động. Kết quả
                    trước đó sẽ được lưu lại để so sánh. Các câu đã chấm thủ
                    công sẽ bị ghi đè.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegrade}>
                    Chấm lại ngay
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Status badge */}
          {detail.status === 'COMPLETED' ? (
            <span className={`${styles.statusBadge} ${styles.completed}`}>
              <CheckCircle2 className="h-3 w-3" />
              Hoàn tất
            </span>
          ) : detail.status === 'FAILED' ? (
            <span className={`${styles.statusBadge} ${styles.failed}`}>
              <AlertCircle className="h-3 w-3" />
              Thất bại
            </span>
          ) : (
            <span className={`${styles.statusBadge} ${styles.pending}`}>
              Đang chấm...
            </span>
          )}
        </div>
      </div>

      {/* Phase 9: comparison summary banner */}
      {previousScores && !isRegrading && (
        <div className={styles.comparisonBanner}>
          <TrendingUp className="h-4 w-4 shrink-0" />
          <span>
            Kết quả sau chấm lại: tổng điểm{' '}
            <strong>{previousScores.totalScore.toFixed(1)}</strong> →{' '}
            <strong>{detail.totalScore.toFixed(1)}</strong>
            <span
              className={`${styles.totalDelta} ${totalDelta > 0 ? styles.deltaPositive : totalDelta < 0 ? styles.deltaNegative : styles.deltaNeutral}`}
            >
              {totalDelta > 0
                ? ` (+${totalDelta.toFixed(1)})`
                : totalDelta < 0
                  ? ` (${totalDelta.toFixed(1)})`
                  : ' (không đổi)'}
            </span>
          </span>
        </div>
      )}

      {/* Overview Cards */}
      <div className={styles.overviewCard}>
        <div className={styles.statItem}>
          <span className={styles.label}>Học sinh</span>
          <span className={styles.value}>{detail.studentName}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
            <Mail className="h-3 w-3" />
            {detail.studentEmail}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>Thời gian nộp</span>
          <span className={styles.value}>
            {formatDateTime(detail.submittedAt)}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
            <Calendar className="h-3 w-3" />
            Lần thi {detail.attemptNumber}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>Tổng điểm</span>
          <h2
            className={`${styles.value} ${detail.totalScore >= 5 ? 'text-green-600' : 'text-red-600'}`}
          >
            {detail.totalScore.toFixed(1)} / {detail.maxScore}
          </h2>
          <span className="text-xs text-muted-foreground mt-0.5">
            Đúng {detail.correctCount}/{detail.totalQuestions} câu
          </span>
        </div>
        {/* Phase 7: grading type in overview */}
        <div className={styles.statItem}>
          <span className={styles.label}>Phương thức chấm</span>
          <span className={styles.value}>
            {GRADING_TYPE_LABELS[detail.gradingType] ?? detail.gradingType}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            Mã nộp bài #{submissionId}
          </span>
        </div>
      </div>

      {/* Questions Breakdown */}
      <h3 className="text-lg font-semibold mb-4 text-slate-700">
        Chi tiết từng câu hỏi
      </h3>
      <div className={styles.questionList}>
        {detail.questionResults.map((qr, index) => (
          <QuestionCard
            key={qr.questionId}
            qr={qr}
            index={index}
            examId={examId}
            resultId={submissionId}
            isEditing={editingQuestionId === qr.questionId}
            isRegrading={isRegrading}
            canEdit={canEdit}
            previousScore={prevScoreMap[qr.questionId] ?? null}
            onEditStart={() => setEditingQuestionId(qr.questionId)}
            onEditCancel={() => setEditingQuestionId(null)}
            onSaveSuccess={(updated) =>
              handleSaveSuccess(qr.questionId, updated)
            }
          />
        ))}
      </div>
    </div>
  )
}
