'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock,
  Hash,
  BookOpen,
  Shield,
  Maximize,
  Loader2,
  ChevronLeft
} from 'lucide-react'
import {
  StudentExamDetail,
  StartExamSessionResponse,
  ApiResponse
} from '@/lib/types'
import { getMe } from '@/lib/actions'
import { IS_PRODUCTION_ENV, PATH } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { WaitingApprovalOverlay } from '@/app/(main)/exam/components/waiting-approval-overlay/waiting-approval-overlay'
import {
  resetAntiCheat,
  setFullscreen
} from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch } from '@/lib/redux/hooks'
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

/** Localize known backend error messages to Vietnamese. */
function localizeError(message: string): string {
  if (/already ended|exam has ended|đã kết thúc/i.test(message)) {
    return 'Bài thi đã kết thúc.'
  }
  return message
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
  const [countdownStr, setCountdownStr] = useState<string | null>(null)
  const [examEnded, setExamEnded] = useState(() =>
    exam.endTime ? new Date(exam.endTime).getTime() <= Date.now() : false
  )
  // Student has used up all allowed attempts
  const attemptsExhausted =
    exam.maxAttempts != null && (exam.usedAttempts ?? 0) >= exam.maxAttempts
  // The exam can no longer be started for any reason
  const cannotStart = examEnded || attemptsExhausted
  const [canStart, setCanStart] = useState(() => {
    if (exam.maxAttempts === 1 && exam.startTime) {
      return new Date(exam.startTime).getTime() <= Date.now()
    }
    return true
  })
  const hasAutoStarted = useRef(false)

  const dispatch = useAppDispatch()
  const antiCheatEnabled = IS_PRODUCTION_ENV
  const forceFullscreenRequired =
    antiCheatEnabled && exam.settings?.forceFullscreen === true

  // Fetch studentId for WaitingApprovalOverlay
  useEffect(() => {
    getMe().then((res) => {
      if (res.data) setStudentId(res.data.id)
    })
  }, [])

  const doStartSession = useCallback(async () => {
    try {
      const result = await callStartSession(exam.examId)

      if (result.data) {
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
          if (document.fullscreenElement) {
            await document.exitFullscreen()
          }
          dispatch(setFullscreen(false))
          setIsStarting(false)
          return
        }

        dispatch(resetAntiCheat())
        router.push(PATH.STUDENT_EXAM_DOING(exam.examId))
      } else {
        if (result.code === 'STUDENT_BANNED') {
          setError(result.message)
        } else {
          setError(
            result.message || 'Không nhận được phản hồi hợp lệ từ máy chủ.'
          )
        }
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
        dispatch(setFullscreen(false))
        setIsStarting(false)
      }
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.')
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      dispatch(setFullscreen(false))
      setIsStarting(false)
    }
  }, [exam.examId, router, dispatch])

  const handleStartExam = async () => {
    if (!agreed) return
    const ended = exam.endTime
      ? new Date(exam.endTime).getTime() <= Date.now()
      : false
    const noAttemptsLeft =
      exam.maxAttempts != null && (exam.usedAttempts ?? 0) >= exam.maxAttempts
    if (ended || noAttemptsLeft) return
    setIsStarting(true)
    setError(null)

    if (forceFullscreenRequired) {
      try {
        await document.documentElement.requestFullscreen()
        dispatch(setFullscreen(true))
      } catch {
        setError('Bạn cần cấp quyền chế độ toàn màn hình để bắt đầu bài thi.')
        setIsStarting(false)
        return
      }
    }

    await doStartSession()
  }

  // Keep examEnded in sync while the page stays open
  useEffect(() => {
    if (!exam.endTime) return
    const endObj = new Date(exam.endTime).getTime()
    if (endObj <= Date.now()) {
      setExamEnded(true)
      return
    }
    const intervalId = setInterval(() => {
      if (Date.now() >= endObj) {
        setExamEnded(true)
        clearInterval(intervalId)
      }
    }, 1000)
    return () => clearInterval(intervalId)
  }, [exam.endTime])

  useEffect(() => {
    if (!exam.startTime || exam.maxAttempts !== 1) return
    const startObj = new Date(exam.startTime).getTime()

    const updateCountdown = () => {
      const now = Date.now()
      const diff = startObj - now
      if (diff > 0) {
        setCanStart(false)
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        const text =
          h > 0
            ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        setCountdownStr(text)
      } else {
        setCanStart(true)
        setCountdownStr(null)
      }
    }

    updateCountdown()
    const intervalId = setInterval(updateCountdown, 1000)
    return () => clearInterval(intervalId)
  }, [exam.startTime, exam.maxAttempts])

  useEffect(() => {
    if (
      canStart &&
      !cannotStart &&
      !hasAutoStarted.current &&
      exam.maxAttempts === 1 &&
      exam.startTime
    ) {
      if (!forceFullscreenRequired) {
        hasAutoStarted.current = true
        setIsStarting(true)
        doStartSession()
      }
    }
  }, [
    canStart,
    cannotStart,
    exam.maxAttempts,
    exam.startTime,
    forceFullscreenRequired,
    doStartSession
  ])

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
            dispatch(resetAntiCheat())
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
          <div className="-mt-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground -ml-3"
              onClick={() => router.push(PATH.STUDENT_EXAMS)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách bài
              thi
            </Button>
          </div>
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
                  {maxAttempts
                    ? `${exam.usedAttempts ?? 0}/${maxAttempts} Lượt`
                    : '1 Lượt'}
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
                {antiCheatEnabled && settings?.preventCopyPaste && (
                  <li>
                    Không được phép sử dụng chức năng{' '}
                    <strong>Copy-Paste</strong> trong suốt quá trình làm bài.
                  </li>
                )}
                {forceFullscreenRequired && (
                  <li>
                    Chế độ <strong>toàn màn hình</strong> là bắt buộc. Hệ thống
                    sẽ ghi nhận vi phạm lưu vào lịch sử nếu bạn thoát hoặc thu
                    nhỏ trình duyệt.
                  </li>
                )}
                {antiCheatEnabled && settings?.trackTabSwitch && (
                  <li>
                    Việc <strong>chuyển đổi cửa sổ hoặc ứng dụng</strong> sẽ bị
                    giám sát chặt chẽ bằng thuật toán.
                  </li>
                )}
                {antiCheatEnabled && settings?.autoSubmitOnViolation && (
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
                {(!antiCheatEnabled ||
                  (!settings?.preventCopyPaste &&
                    !settings?.forceFullscreen &&
                    !settings?.trackTabSwitch &&
                    !settings?.autoSubmitOnViolation)) &&
                  settings?.allowReview !== false && (
                    <li className={styles.noRules}>
                      Bài thi này không áp dụng các quy định giám sát tự động
                      nghiêm ngặt. Vui lòng tuân thủ quy chế thi của nhà trường.
                    </li>
                  )}
              </ul>
              {forceFullscreenRequired && (
                <div className="mt-5 p-4 bg-background/50 rounded-lg border border-amber-200/40">
                  <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" /> Chế độ thi an
                    toàn
                  </p>
                  <p className="text-sm text-foreground/80">
                    Hệ thống yêu cầu chế độ toàn màn hình để đảm bảo tính công
                    bằng. Bạn không được chuyển cửa sổ, mở DevTools, hay sử dụng
                    các phím tắt bị cấm. Mọi vi phạm sẽ được ghi nhận lại và bài
                    thi sẽ bị tự động nộp nếu vi phạm quá số lần.
                  </p>
                </div>
              )}
            </div>
            {!cannotStart &&
              (!exam.startTime ||
                exam.maxAttempts !== 1 ||
                forceFullscreenRequired) && (
                <label className={styles.agreementLabel}>
                  <Checkbox
                    checked={agreed}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      setAgreed(checked === true)
                    }
                    className={styles.checkbox}
                  />
                  <span className={styles.text}>
                    Tôi đã đọc, hiểu và cam kết tuân thủ các quy định thi trực
                    tuyến một cách nghiêm túc.
                  </span>
                </label>
              )}
          </section>

          {/* Error message */}
          {(error || cannotStart) && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
              {error
                ? localizeError(error)
                : examEnded
                  ? 'Bài thi đã kết thúc.'
                  : 'Bạn đã hết lượt làm bài.'}
            </div>
          )}

          {/* Action Section */}
          <div className={styles.actionSection}>
            <Button
              size="lg"
              className={styles.startButton}
              disabled={
                cannotStart ||
                !canStart ||
                (!agreed &&
                  (!exam.startTime ||
                    exam.maxAttempts !== 1 ||
                    forceFullscreenRequired)) ||
                isStarting
              }
              onClick={handleStartExam}
            >
              {examEnded ? (
                'Bài thi đã kết thúc'
              ) : attemptsExhausted ? (
                'Bạn đã hết lượt làm bài'
              ) : isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang chuẩn bị phiên thi...
                </>
              ) : !canStart && countdownStr ? (
                `Bắt đầu sau ${countdownStr}`
              ) : forceFullscreenRequired ? (
                <>
                  <Maximize className="w-4 h-4 mr-2" />
                  Bật toàn màn hình & Bắt đầu
                </>
              ) : (
                'Bắt đầu làm bài thi'
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
