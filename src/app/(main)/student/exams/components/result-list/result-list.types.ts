import { StudentExamResultResponse } from '@/lib/types'

export type ResultGroup = {
  examId: number
  examTitle: string
  attempts: StudentExamResultResponse[]
  latest: StudentExamResultResponse
}
