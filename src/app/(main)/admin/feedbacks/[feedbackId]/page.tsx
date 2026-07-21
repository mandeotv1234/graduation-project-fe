import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Lightbulb,
  Mail,
  Star,
  UserRound
} from 'lucide-react'

import { getAdminFeedback } from '@/lib/actions/admin.action'
import { PATH } from '@/lib/constants'
import type { FeedbackItem } from '@/lib/types/admin.type'
import { cn } from '@/lib/utils'

interface AdminFeedbackDetailPageProps {
  params: Promise<{ feedbackId: string }>
}

export default async function AdminFeedbackDetailPage({
  params
}: AdminFeedbackDetailPageProps) {
  const { feedbackId } = await params
  const parsedFeedbackId = Number(feedbackId)

  if (!Number.isInteger(parsedFeedbackId) || parsedFeedbackId <= 0) {
    notFound()
  }

  let feedback: FeedbackItem | undefined
  try {
    const response = await getAdminFeedback(parsedFeedbackId)
    feedback = response.data
  } catch {
    notFound()
  }

  if (!feedback) {
    notFound()
  }

  const submittedAt = new Date(feedback.createdAt).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Link
        href={PATH.ADMIN_FEEDBACKS}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Danh sách feedback
      </Link>

      <header className="flex flex-col justify-between gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">
            Feedback #{feedback.id}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Chi tiết phản hồi
          </h1>
          <p className="text-sm text-muted-foreground">
            Nội dung sinh viên gửi sau khi hoàn thành bài thi
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          <time dateTime={feedback.createdAt}>{submittedAt}</time>
        </div>
      </header>

      <section
        aria-label="Thông tin feedback"
        className="grid gap-4 border-b border-border/60 pb-6 md:grid-cols-3"
      >
        <InfoItem
          icon={UserRound}
          label="Sinh viên"
          value={feedback.studentName}
        />
        <InfoItem icon={Mail} label="Email" value={feedback.studentEmail} />
        <InfoItem
          icon={FileText}
          label="Mã đề thi"
          value={`#${feedback.examId}`}
        />
      </section>

      <section aria-labelledby="ratings-title" className="space-y-3">
        <h2 id="ratings-title" className="text-base font-semibold">
          Đánh giá
        </h2>
        <div className="grid overflow-hidden rounded-lg border border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-border/60">
          <RatingItem label="Trải nghiệm UI/UX">
            <StarRating value={feedback.uiUxRating} />
          </RatingItem>
          <RatingItem label="Độ tin cậy hệ thống">
            <StarRating value={feedback.systemReliabilityRating} />
          </RatingItem>
          <RatingItem label="Mức độ giới thiệu">
            <span
              className={cn(
                'inline-flex w-fit rounded-full px-2.5 py-1 text-sm font-semibold',
                feedback.npsScore >= 9
                  ? 'bg-emerald-100 text-emerald-700'
                  : feedback.npsScore >= 7
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
              )}
            >
              {feedback.npsScore}/10
            </span>
          </RatingItem>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <FeedbackContent
          icon={Lightbulb}
          title="Tính năng mong muốn"
          content={feedback.featureRequests}
        />
        <FeedbackContent
          icon={FileText}
          title="Nhận xét chung"
          content={feedback.generalFeedback}
        />
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}

function RatingItem({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} trên 5 sao`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            'h-4 w-4',
            index < value
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/30'
          )}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{value}/5</span>
    </div>
  )
}

function FeedbackContent({
  icon: Icon,
  title,
  content
}: {
  icon: typeof FileText
  title: string
  content?: string | null
}) {
  return (
    <section className="rounded-lg border border-border/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <p
        className={cn(
          'whitespace-pre-wrap break-words text-sm leading-6',
          content ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {content || 'Không có nội dung'}
      </p>
    </section>
  )
}
