import { getEnrolledExams } from '@/lib/actions'
import { ExamList } from '@/app/(main)/student/exams/components/exam-list/exam-list'

export default async function StudentExamsPage() {
  const response = await getEnrolledExams()
  const exams = response.data || []

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bài thi của bạn
        </h1>
        <p className="text-muted-foreground">
          Danh sách các bài thi SQL thuộc lớp bạn đang đăng ký
        </p>
      </div>

      <ExamList exams={exams} />
    </div>
  )
}
