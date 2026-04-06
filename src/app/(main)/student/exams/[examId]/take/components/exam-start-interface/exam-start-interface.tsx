'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Hash, BookOpen } from 'lucide-react'
import {
  StudentExamDetail,
  StartExamSessionResponse,
  ApiResponse
} from '@/lib/types'
import { getMe } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { WaitingApprovalOverlay } from '@/app/(main)/exam/components/waiting-approval-overlay/waiting-approval-overlay'
import styles from './exam-start-interface.module.scss'

interface ExamStartInterfaceProps {
  exam: StudentExamDetail
}

/**
 * Client-side fetch to the Next.js proxy route that forwards requests to the
 * backend WITH the real browser IP and User-Agent.
 */
async function callStartSession(
  examId: number
): Promise<ApiResponse<StartExamSessionResponse>> {
  try {
    const res = await fetch(`/api/exams/${examId}/start-session`, {
      method: 'POST',
      credentials: 'include'
    })
    const body = (await res.json()) as ApiResponse<StartExamSessionResponse>
    if (!res.ok) {
      return {
        code: body.code ?? String(res.status),
        message: body.message ?? 'Failed to start session',
        data: undefined as unknown as StartExamSessionResponse
      }
    }
    return body
  } catch {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error — could not reach server',
      data: undefined as unknown as StartExamSessionResponse
    }
  }
}

export function ExamStartInterface({ exam }: ExamStartInterfaceProps) {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<number | undefined>()
  const [pendingConflict, setPendingConflict] = useState<{
    conflictId: string
  } | null>(null)

  // Fetch studentId for WaitingApprovalOverlay
  useEffect(() => {
    getMe().then((res) => {
      if (res.data) setStudentId(res.data.id)
    })
  }, [])

  const handleStartExam = async () => {
    if (!agreed) return
    setIsStarting(true)
    setError(null)

    try {
      const result = await callStartSession(exam.examId)

      if (result.data) {
        // Conflict pending — student must wait for teacher approval
        if (result.data.conflictPending && result.data.conflictId) {
          setPendingConflict({ conflictId: result.data.conflictId })
          setIsStarting(false)
          return
        }

        if (!result.data.sessionStarted) {
          setError(
            result.data.message ||
              'Không thể bắt đầu phiên thi. Có thể bạn đã dùng hết lượt.'
          )
          setIsStarting(false)
          return
        }

        // Session started successfully → navigate to exam
        router.push(PATH.STUDENT_EXAM_DOING(exam.examId))
      } else {
        setError(
          result.message || 'Không nhận được phân hồi hợp lệ từ máy chủ.'
        )
        setIsStarting(false)
      }
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.')
      setIsStarting(false)
    }
  }

  const { settings, durationMinutes, maxAttempts, description } = exam

  // Show waiting overlay if conflict is pending
  if (pendingConflict && studentId) {
    return (
      <WaitingApprovalOverlay
        examId={exam.examId}
        studentId={studentId}
        conflictId={pendingConflict.conflictId}
        examEndTime={exam.endTime}
        onApproved={async () => {
          setPendingConflict(null)
          setError(null)
          // Retry startSession — session is now force-overridden by teacher
          const result = await callStartSession(exam.examId)
          if (result.data?.sessionStarted) {
            router.push(PATH.STUDENT_EXAM_DOING(exam.examId))
          } else {
            setError('Không thể kết nối lại phiên thi. Vui lòng thử lại.')
          }
        }}
        onRejected={(reason: string) => {
          setPendingConflict(null)
          setError(reason)
        }}
      />
    )
  }

  return (
    <main className={styles.container}>
      {/* Content Container */}
      <div className={styles.contentWrapper}>
        {/* Main Paper-like Container */}
        <div className={styles.card}>
          <h1 className={styles.title}>{exam.title}</h1>

          {/* Exam Information Grid */}
          <section>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <p className={styles.label}>
                  <Clock className="w-3.5 h-3.5" /> Thời gian làm bài
                </p>
                <p className={styles.value}>
                  {durationMinutes
                    ? `${durationMinutes} Phút`
                    : 'Không giới hạn'}
                </p>
              </div>

              <div className={styles.infoItem}>
                <p className={styles.label}>
                  <Hash className="w-3.5 h-3.5" /> Số lượt cho phép
                </p>
                <p className={styles.value}>
                  {maxAttempts ? `${maxAttempts} Lượt` : '1 Lượt'}
                </p>
              </div>

              <div className={styles.infoItem}>
                <p className={styles.label}>
                  <BookOpen className="w-3.5 h-3.5" /> Lớp học
                </p>
                <p
                  className={`${styles.value} ${styles.truncateValue}`}
                  title={exam.className || `Mã Lớp: ${exam.classId}`}
                >
                  {exam.className || `Mã: ${exam.classId}`}
                </p>
              </div>
            </div>
          </section>

          {/* Decorative element */}
          <div className={styles.decorativeTopBar} />

          {description && (
            <section className="space-y-4">
              <h2 className={styles.sectionTitle}>Mô tả bài thi</h2>
              <div
                className={styles.descriptionBox}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </section>
          )}

          {/* Exam Rules */}
          <section>
            <div className={styles.rulesCard}>
              <h2 className={styles.rulesTitle}>
                Nội quy trực tuyến & Giám sát
              </h2>
              <ul className={styles.rulesList}>
                {settings?.preventCopyPaste && (
                  <li>
                    Không được phép sử dụng chức năng{' '}
                    <strong>Copy-Paste</strong> trong suốt quá trình làm bài.
                  </li>
                )}
                {settings?.forceFullscreen && (
                  <li>
                    Chế độ <strong>toàn màn hình</strong> là bắt buộc. Hệ thống
                    sẽ ghi nhận vi phạm lưu vào lịch sử nếu bạn thoát hoặc thu
                    nhỏ trình duyệt.
                  </li>
                )}
                {settings?.trackTabSwitch && (
                  <li>
                    Việc <strong>chuyển đổi thẻ (Tab) hoặc ứng dụng</strong> sẽ
                    bị giám sát chặt chẽ bằng thuật toán.
                  </li>
                )}
                {settings?.autoSubmitOnViolation && (
                  <li>
                    Các vi phạm nghiêm trọng hoặc lặp lại nhiều lần sẽ dẫn đến
                    việc hệ thống tự động
                    <strong className="text-destructive">
                      {' '}
                      nộp bài và kết thúc phiên thi ngay lập tức
                    </strong>
                    .
                  </li>
                )}
                {!settings?.allowReview && (
                  <li>
                    Không được phép xem lại kết quả chi tiết sau khi đã nộp bài.
                  </li>
                )}
                {!settings?.preventCopyPaste &&
                  !settings?.forceFullscreen &&
                  !settings?.trackTabSwitch &&
                  !settings?.autoSubmitOnViolation &&
                  settings?.allowReview !== false && (
                    <li className={styles.noRules}>
                      Bài thi này không áp dụng các quy định giám sát tự động
                      nghiêm ngặt. Vui lòng tuân thủ quy chế thi của nhà trường.
                    </li>
                  )}
              </ul>
            </div>
            <label className={styles.agreementLabel}>
              <Checkbox
                checked={agreed}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  setAgreed(checked === true)
                }
                className={styles.checkbox}
              />
              <span className={styles.text}>
                Tôi đã đọc, hiểu và cam kết tuân thủ các quy định thi trực tuyến
                một cách nghiêm túc.
              </span>
            </label>
          </section>

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Action Section */}
          <div className={styles.actionSection}>
            <Button
              size="lg"
              className={styles.startButton}
              disabled={!agreed || isStarting}
              onClick={handleStartExam}
            >
              {isStarting
                ? 'Đang chuẩn bị phiên thi...'
                : 'Bắt đầu làm bài thi'}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
