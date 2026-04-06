import { getExamResults } from '@/lib/actions/teacher.action'
import { ExamResultsView } from './components/exam-results-view'

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

  const response = await getExamResults(id)
  const initialResults = response.data || []

  return <ExamResultsView examId={id} initialResults={initialResults} />
}
