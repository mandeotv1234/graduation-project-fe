'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import {
  Plus,
  Trash2,
  Save,
  UserPlus,
  Upload,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { updateClass, getClassDetail, getStudentsInClass } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { CreateClassStudentInfo } from '@/lib/types'

interface EditClassPageProps {
  classId: number
}

export function EditClassPage({ classId }: EditClassPageProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [classCode, setClassCode] = useState('')
  const [semester, setSemester] = useState('')
  const [students, setStudents] = useState<CreateClassStudentInfo[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classRes, studentsRes] = await Promise.all([
          getClassDetail(classId),
          getStudentsInClass(classId, 1, 1000) // Load large page to get all students for editing
        ])

        if (classRes.data) {
          setClassCode(classRes.data.classCode)
          setSemester(classRes.data.semester)
        }

        if (studentsRes.data) {
          setStudents(
            studentsRes.data.map((s) => ({
              studentId: s.email.split('@')[0], // Extract ID from email
              fullName: s.fullName
            }))
          )
        }
      } catch {
        // Handle error silently or via toast
        toast.error('Không thể tải thông tin lớp học')
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadData()
  }, [classId])

  const addStudent = () => {
    setStudents((prev) => [...prev, { studentId: '', fullName: '' }])
  }

  const removeStudent = (index: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== index))
  }

  const processData = (data: unknown[]) => {
    if (data.length < 2) {
      toast.error('File không có dữ liệu hợp lệ')
      return
    }

    let mssvColIdx = -1
    let nameColIdx = -1

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      if (!row || !Array.isArray(row)) continue

      row.forEach((cell, colIdx) => {
        const val = String(cell || '')
          .toLowerCase()
          .trim()
        if (
          val.includes('mssv') ||
          val.includes('mã sv') ||
          val.includes('mã sinh viên') ||
          val === 'id'
        ) {
          mssvColIdx = colIdx
        }
        if (
          val.includes('tên') ||
          val.includes('họ và tên') ||
          val.includes('họ tên') ||
          val === 'name'
        ) {
          nameColIdx = colIdx
        }
      })

      if (mssvColIdx !== -1 && nameColIdx !== -1) break
    }

    if (mssvColIdx === -1) mssvColIdx = 0
    if (nameColIdx === -1) nameColIdx = 1

    const newStudents: CreateClassStudentInfo[] = []
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || !Array.isArray(row)) continue
      const mssv = String(row[mssvColIdx] || '').trim()
      const name = String(row[nameColIdx] || '').trim()
      if (mssv && name) newStudents.push({ studentId: mssv, fullName: name })
    }

    if (newStudents.length > 0) {
      setStudents((prev) => {
        const currentValid = prev.filter((s) => s.studentId && s.fullName)
        const map = new Map(currentValid.map((s) => [s.studentId, s]))
        newStudents.forEach((s) => map.set(s.studentId, s))
        return Array.from(map.values())
      })
      toast.success(`Đã thêm ${newStudents.length} sinh viên từ file`)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''

    if (fileExt === 'csv') {
      Papa.parse(file, {
        complete: (results) => processData(results.data as unknown[]),
        skipEmptyLines: true,
        encoding: 'UTF-8'
      })
    } else {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const arrayBuffer = evt.target?.result
        const wb = XLSX.read(arrayBuffer, { type: 'array', codepage: 65001 })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })
        processData(data)
      }
      reader.readAsArrayBuffer(file)
    }
    e.target.value = ''
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
      updateClass(classId, {
        classCode: classCode.trim(),
        semester: semester.trim(),
        students: validStudents.map((s) => ({
          studentId: s.studentId.trim(),
          fullName: s.fullName.trim()
        }))
      })
    )

    if (result.data) {
      toast.success('Cập nhật lớp học thành công!')
      router.push(PATH.TEACHER_CLASS_DETAIL(classId))
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Đang tải thông tin lớp học...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Chỉnh sửa lớp học
          </h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin lớp và danh sách sinh viên
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Danh sách sinh viên ({students.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Nhập tay hoặc tải lên file dữ liệu (.xlsx, .csv)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="gap-1.5 cursor-pointer"
              >
                <label htmlFor="file-upload">
                  <Upload className="h-4 w-4" />
                  Nhập từ file
                </label>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStudent}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Thêm 1
              </Button>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
            {students.map((student, index) => (
              <div
                key={`student-${index}-${student.studentId}`}
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
                  className="flex h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  type="text"
                  value={student.fullName}
                  onChange={(e) =>
                    updateStudent(index, 'fullName', e.target.value)
                  }
                  placeholder="Họ và tên"
                  className="flex h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2 px-6">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
