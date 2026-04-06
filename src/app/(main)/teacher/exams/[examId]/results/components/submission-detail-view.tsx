'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TeacherExamResultDetail } from '@/lib/types'
import styles from './submission-detail-view.module.scss'

interface SubmissionDetailViewProps {
  examId: number
  submissionId: number
  detail: TeacherExamResultDetail
}

export function SubmissionDetailView({
  examId,
  submissionId,
  detail
}: SubmissionDetailViewProps) {
  const router = useRouter()

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
            {new Date(detail.submittedAt).toLocaleString('vi-VN')}
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
        <div className={styles.statItem}>
          <span className={styles.label}>Mã nộp bài</span>
          <span className={styles.value}>#{submissionId}</span>
          <span className="text-xs text-muted-foreground mt-0.5">
            ID Bài thi {examId}
          </span>
        </div>
      </div>

      {/* Questions Breakdown */}
      <h3 className="text-lg font-semibold mb-4 text-slate-700">
        Chi tiết từng câu hỏi
      </h3>
      <div className={styles.questionList}>
        {detail.questionResults.map((qr, index) => (
          <div
            key={qr.questionId}
            className={`${styles.questionCard} ${qr.isCorrect ? styles.correct : styles.incorrect}`}
          >
            <div className={styles.qHeader}>
              <span className={styles.qTitle}>Câu hỏi {index + 1}</span>
              <span
                className={`${styles.qScore} ${qr.isCorrect ? styles.passed : styles.failed}`}
              >
                {qr.scoreEarned.toFixed(1)}/{qr.maxPoints} đ
              </span>
            </div>

            <div className={styles.qContent}>
              <div className={styles.prompt}>{qr.content}</div>

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

            {qr.errorMessage ? (
              <div className={styles.qFooter}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Lỗi hệ thống:</strong> {qr.errorMessage}
                </span>
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
          </div>
        ))}
      </div>
    </div>
  )
}
