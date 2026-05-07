import { FeedbackList } from '@/app/(main)/admin/feedbacks/components/feedback-list/feedback-list'

export default function AdminFeedbacksPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          Xem phản hồi của sinh viên sau khi nộp bài thi
        </p>
      </div>
      <FeedbackList />
    </div>
  )
}
