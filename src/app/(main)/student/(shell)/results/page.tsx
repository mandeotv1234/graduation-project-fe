import { ResultList } from '@/app/(main)/student/exams/components/result-list/result-list'

export default function StudentResultsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Kết quả học tập
        </h1>
        <p className="text-muted-foreground">
          Theo dõi điểm số và xem lại các bài thi đã thực hiện
        </p>
      </div>

      <div className="mt-6">
        <ResultList />
      </div>
    </div>
  )
}
