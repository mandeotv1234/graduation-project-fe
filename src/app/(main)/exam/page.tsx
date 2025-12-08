import { getExamQuestions } from '@/lib/actions'
import ExamInterface from './components/exam-interface'

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
  return <ExamInterface questions={questionRes.data || []} tables={tables} />
}
