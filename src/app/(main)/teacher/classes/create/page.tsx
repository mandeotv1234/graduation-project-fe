'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { createClass } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { CreateClassStudentInfo } from '@/lib/types'

export default function CreateClassPage() {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [classCode, setClassCode] = useState('')
  const [semester, setSemester] = useState('')
  const [students, setStudents] = useState<CreateClassStudentInfo[]>([
    { studentId: '', fullName: '' }
  ])

  const addStudent = () => {
    setStudents((prev) => [...prev, { studentId: '', fullName: '' }])
  }

  const removeStudent = (index: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== index))
  }

  const updateStudent = (
    index: number,
    field: keyof CreateClassStudentInfo,
    value: string
  ) => {
    setStudents((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!classCode.trim() || !semester.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin lớp học')
      return
    }

    const validStudents = students.filter(
      (s) => s.studentId.trim() && s.fullName.trim()
    )

    const result = await callApi(
      createClass({
        classCode: classCode.trim(),
        semester: semester.trim(),
        students: validStudents
      })
    )

    if (result.data) {
      router.push(PATH.TEACHER_CLASS_DETAIL(result.data.id))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={PATH.TEACHER_CLASSES}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tạo lớp học mới
          </h1>
          <p className="text-muted-foreground">
            Nhập thông tin lớp và danh sách sinh viên
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Class info */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">
            Thông tin lớp học
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mã lớp <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="VD: 22120-CSDL-01"
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Học kỳ <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="VD: HK2 2025-2026"
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
          </div>
        </div>

        {/* Students */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Danh sách sinh viên ({students.length})
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStudent}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Thêm
            </Button>
          </div>

          <div className="space-y-3">
            {students.map((student, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={student.studentId}
                  onChange={(e) =>
                    updateStudent(index, 'studentId', e.target.value)
                  }
                  placeholder="MSSV (VD: 22120201)"
                  className="flex h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  type="text"
                  value={student.fullName}
                  onChange={(e) =>
                    updateStudent(index, 'fullName', e.target.value)
                  }
                  placeholder="Họ và tên"
                  className="flex h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStudent(index)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={students.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="gap-2 px-6">
            <Save className="h-4 w-4" />
            {isLoading ? 'Đang tạo...' : 'Tạo lớp học'}
          </Button>
        </div>
      </form>
    </div>
  )
}
