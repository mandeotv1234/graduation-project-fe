import { StudentExamResultResponse } from '@/lib/types'

type ResultTone = 'positive' | 'negative' | 'neutral'

export function scorePercent(result: StudentExamResultResponse) {
  if (!result.maxScore) return 0
  return (result.totalScore / result.maxScore) * 100
}

export function formatScore(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}

export function formatImprovement(value: number) {
  if (Math.abs(value) < 0.01) return '0%'
  return `${value > 0 ? '+' : ''}${Math.round(value)}%`
}

export function getResultTone(improvement: number): ResultTone {
  if (improvement > 0) return 'positive'
  if (improvement < 0) return 'negative'
  return 'neutral'
}
