import { getExamResults, getExamStatistics } from '@/lib/actions/teacher.action'
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

  const [resultsResponse, statsResponse] = await Promise.all([
    getExamResults(id),
    getExamStatistics(id)
  ])

  const initialResults = resultsResponse.data || []
  const initialStats: ExamStatistics | null = statsResponse.data ?? null

  return (
    <ExamResultsView
      examId={id}
      initialResults={initialResults}
      initialStats={initialStats}
    />
  )
}
