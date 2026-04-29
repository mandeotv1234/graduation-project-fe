import { getExamResults, getExamStatistics } from '@/lib/actions/teacher.action'
import { getTeacherExamDetail } from '@/lib/actions/exam.action'
import { ExamResultsView } from './components/exam-results-view'
import type { ExamStatistics } from '@/lib/types'

interface ExamResultsPageProps {
  params: Promise<{
    examId: string
  }>
}

export default async function ExamResultsPage({
  params
}: ExamResultsPageProps) {
  const { examId } = await params
  const id = Number(examId)

  const [resultsResponse, statsResponse, examResponse] = await Promise.all([
    getExamResults(id),
    getExamStatistics(id),
    getTeacherExamDetail(id)
  ])

  const initialResults = resultsResponse.data || []
  const initialPagination = resultsResponse.meta?.pagination
  const initialStats: ExamStatistics | null = statsResponse.data ?? null
  const examTitle = examResponse.data?.title || `Bài thi #${id}`

  return (
    <ExamResultsView
      examId={id}
      examTitle={examTitle}
      initialResults={initialResults}
      initialPagination={initialPagination}
      initialStats={initialStats}
    />
  )
}
