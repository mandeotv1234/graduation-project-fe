/**
 * Utility to download exam answers as a backup file
 * Use this when submission fails due to network errors
 */
export function downloadAnswersBackup(
  examTitle: string,
  studentName: string,
  studentId: string,
  answers: Record<number, string>,
  questions: { id: number; content?: string; title?: string }[]
) {
  const timestamp = new Date().toISOString()
  const data = {
    examTitle,
    studentName,
    studentId,
    timestamp,
    backupVersion: '1.0',
    answers: Object.entries(answers).map(([id, content]) => {
      const q = questions.find((q) => q.id === Number(id))
      return {
        questionId: Number(id),
        questionTitle: q?.content || q?.title || `Question ${id}`,
        studentAnswer: content
      }
    })
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
