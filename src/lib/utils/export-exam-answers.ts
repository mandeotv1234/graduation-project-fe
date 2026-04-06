import { ExamQuestionItem } from '@/lib/types'

export function downloadAnswersBackup(
  examTitle: string,
  studentName: string,
  studentId: string,
  answers: Record<number, string>,
  questions: ExamQuestionItem[]
) {
  const timestamp = new Date().toISOString()
  const data = {
    examTitle,
    studentName,
    studentId,
    timestamp,
    backupVersion: '1.0',
    answers: questions.map((q) => ({
      questionId: q.id,
      questionTitle: q.content
        ? q.content
            .replace(/<[^>]*>/g, '')
            .substring(0, 100)
            .trim()
        : `Câu hỏi ${q.id}`,
      studentAnswer: answers[q.id] || ''
    }))
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  const fileName = `Backup_${studentId}_${examTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.json`
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
