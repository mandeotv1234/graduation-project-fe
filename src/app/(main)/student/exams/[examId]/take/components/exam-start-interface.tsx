'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Hash, BookOpen } from 'lucide-react'

import { StudentExamDetail } from '@/lib/types'

import { startExamSession } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface ExamStartInterfaceProps {
  exam: StudentExamDetail
}

export function ExamStartInterface({ exam }: ExamStartInterfaceProps) {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const handleStartExam = async () => {
    if (!agreed) return

    setIsStarting(true)
    const res = await startExamSession(exam.examId)
    setIsStarting(false)

    if (res.code === '200' || res.code === 'OK') {
      router.push(PATH.STUDENT_EXAM_DOING(exam.examId))
    } else {
      toast.error('Không thể bắt đầu', {
        description: res.message || 'Có lỗi xảy ra'
      })
    }
  }

  const { settings, durationMinutes, maxAttempts, description } = exam

  return (
    <main className="pt-4 pb-4 px-4 min-h-screen flex flex-col items-center bg-muted/20">
      {/* Content Container */}
      <div className="w-full max-w-3xl">
        {/* Main Paper-like Container */}
        <div className="bg-background border border-border/60 rounded-2xl p-6 sm:p-10 shadow-md space-y-5 relative overflow-hidden">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {exam.title}
          </h1>

          {/* Exam Information Grid */}
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 bg-muted/30 p-5 rounded-xl border border-border/40">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-tighter flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Thời gian làm bài
                </p>
                <p className="text-lg font-bold text-foreground">
                  {durationMinutes
                    ? `${durationMinutes} Phút`
                    : 'Không giới hạn'}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-tighter flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Số lượt cho phép
                </p>
                <p className="text-lg font-bold text-foreground">
                  {maxAttempts ? `${maxAttempts} Lượt` : '1 Lượt'}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-tighter flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Lớp học
                </p>
                <p
                  className="text-lg font-bold text-foreground truncate max-w-[200px]"
                  title={exam.className || `Mã Lớp: ${exam.classId}`}
                >
                  {exam.className || `Mã: ${exam.classId}`}
                </p>
              </div>
            </div>
          </section>

          {/* Decorative element */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

          {description && (
            <section className="space-y-4">
              <h2 className="text-base font-bold text-foreground tracking-wide ps-5">
                Mô tả bài thi
              </h2>
              <div
                className="space-y-3.5 text-sm text-foreground/80 ps-5"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </section>
          )}

          {/* Exam Rules */}
          <section>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-xl p-5">
              <h2 className="text-base font-bold text-foreground tracking-wide mb-4">
                Nội quy trực tuyến & Giám sát
              </h2>
              <ul className="space-y-3.5 text-sm text-foreground/80 list-disc pl-5 marker:text-amber-500">
                {settings?.preventCopyPaste && (
                  <li>
                    Không được phép sử dụng chức năng{' '}
                    <strong className="text-foreground font-semibold">
                      Copy-Paste
                    </strong>{' '}
                    trong suốt quá trình làm bài.
                  </li>
                )}
                {settings?.forceFullscreen && (
                  <li>
                    Chế độ{' '}
                    <strong className="text-foreground font-semibold">
                      toàn màn hình
                    </strong>{' '}
                    là bắt buộc. Hệ thống sẽ ghi nhận vi phạm lưu vào lịch sử
                    nếu bạn thoát hoặc thu nhỏ trình duyệt.
                  </li>
                )}
                {settings?.trackTabSwitch && (
                  <li>
                    Việc{' '}
                    <strong className="text-foreground font-semibold">
                      chuyển đổi thẻ (Tab) hoặc ứng dụng
                    </strong>{' '}
                    sẽ bị giám sát chặt chẽ bằng thuật toán.
                  </li>
                )}
                {settings?.autoSubmitOnViolation && (
                  <li>
                    Các vi phạm nghiêm trọng hoặc lặp lại nhiều lần sẽ dẫn đến
                    việc hệ thống tự động
                    <strong className="text-destructive font-semibold">
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
                    <li className="list-none text-muted-foreground -ml-5">
                      Bài thi này không áp dụng các quy định giám sát tự động
                      nghiêm ngặt. Vui lòng tuân thủ quy chế thi của nhà trường.
                    </li>
                  )}
              </ul>
            </div>
            <label className="flex items-start sm:items-center gap-3 cursor-pointer group bg-background py-4">
              <Checkbox
                checked={agreed}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  setAgreed(checked === true)
                }
                className="mt-0.5 sm:mt-0 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm text-foreground font-medium select-none group-hover:text-primary transition-colors leading-tight">
                Tôi đã đọc, hiểu và cam kết tuân thủ các quy định thi trực tuyến
                một cách nghiêm túc.
              </span>
            </label>
          </section>
          {/* Action Section */}
          <div className="flex flex-col items-center space-y-6">
            <Button
              size="lg"
              className="w-full sm:w-auto px-16 py-6 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
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
