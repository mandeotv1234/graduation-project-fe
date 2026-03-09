import { getExamQuestions } from '@/lib/actions'
import ExamInterface from '@/app/(main)/exam/components/exam-interface'

const tables = [
  {
    name: 'Employees',
    columns: [
      { name: 'id', type: 'INTEGER (PK)' },
      { name: 'first_name', type: 'VARCHAR' },
      { name: 'last_name', type: 'VARCHAR' },
      { name: 'hire_date', type: 'DATE' },
      { name: 'department_id', type: 'INTEGER (FK)' }
    ]
  },
  {
    name: 'Departments',
    columns: [
      { name: 'id', type: 'INTEGER (PK)' },
      { name: 'department_name', type: 'VARCHAR' }
    ]
  }
]

export default async function ExamPage() {
  const questionRes = await getExamQuestions()

  // TODO: Get examId from route params and student info from session
  const examId = 1

  return (
    <ExamInterface
      examId={examId}
      questions={questionRes.data || []}
      tables={tables}
      studentId="SV001"
      studentName="Nguyễn Văn A"
    />
  )
}
