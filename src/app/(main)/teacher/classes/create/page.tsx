'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  UserPlus,
  Upload,
  Loader2
} from 'lucide-react'
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

  const processData = (data: unknown[]) => {
    if (data.length < 2) {
      toast.error('File không có dữ liệu hợp lệ')
      return
    }

    let headerRowIdx = 0
    let mssvColIdx = -1
    let nameColIdx = -1

    // Tìm dòng header
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

      if (mssvColIdx !== -1 && nameColIdx !== -1) {
        headerRowIdx = i
        break
      }
    }

    if (mssvColIdx === -1 || nameColIdx === -1) {
      // Fallback mặc định cột 0 là MSSV, cột 1 là Họ Tên nếu không tìm thấy header rõ ràng
      mssvColIdx = 0
      nameColIdx = 1
    }

    const newStudents: CreateClassStudentInfo[] = []

    for (let i = headerRowIdx + 1; i < data.length; i++) {
      const row = data[i]
      if (!row || !Array.isArray(row)) continue

      const mssv = String(row[mssvColIdx] || '').trim()
      const name = String(row[nameColIdx] || '').trim()

      if (mssv && name) {
        newStudents.push({ studentId: mssv, fullName: name })
      }
    }

    if (newStudents.length > 0) {
      setStudents((prev) => {
        // Khử trùng lặp và loại bỏ các trường rỗng
        const currentValid = prev.filter((s) => s.studentId && s.fullName)

        // Chỉ thêm những sinh viên chưa có trong danh sách (dựa vào MSSV)
        const map = new Map(currentValid.map((s) => [s.studentId, s]))
        newStudents.forEach((s) => map.set(s.studentId, s))

        return Array.from(map.values())
      })
      toast.success(`Đã nhập ${newStudents.length} sinh viên từ file`)
    } else {
      toast.error('Không tìm thấy dữ liệu sinh viên hợp lệ trong file')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''

    if (fileExt === 'csv') {
      Papa.parse(file, {
        complete: (results) => {
          processData(results.data as unknown[])
        },
        error: (error) => {
          console.error('Lỗi phân tích CSV:', error)
          toast.error('Lỗi khi đọc file CSV. Vui lòng kiểm tra lại định dạng.')
        },
        skipEmptyLines: true,
        encoding: 'UTF-8' // Đảm bảo đọc chuẩn font cho CSV
      })
    } else {
      // Cho file xlsx, xls
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const arrayBuffer = evt.target?.result
          // Đảm bảo đọc chuẩn font UTF-8 cho file Excel (tương tự CSV)
          const wb = XLSX.read(arrayBuffer, { type: 'array', codepage: 65001 })
          const wsname = wb.SheetNames[0]
          const ws = wb.Sheets[wsname]
          const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })

          processData(data)
        } catch (error) {
          console.error('Lỗi khi đọc file Excel:', error)
          toast.error(
            'Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.'
          )
        }
      }
      reader.readAsArrayBuffer(file)
    }

    // Reset file input
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

          {/* File Import Guide */}
          <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                📋 Hướng dẫn nhập file CSV hoặc Excel
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                File của bạn phải có 2 cột với header (dòng đầu tiên). Hệ thống
                sẽ tự nhận diện cột MSSV và Họ tên.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                ✓ Các tên cột được hỗ trợ:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-800 dark:text-amber-300">
                <div>
                  <span className="font-semibold">Cột MSSV:</span>
                  <div className="pl-2 space-y-0.5">
                    <div>• MSSV</div>
                    <div>• Mã SV</div>
                    <div>• Mã sinh viên</div>
                    <div>• ID</div>
                  </div>
                </div>
                <div>
                  <span className="font-semibold">Cột Họ tên:</span>
                  <div className="pl-2 space-y-0.5">
                    <div>• Tên</div>
                    <div>• Họ và tên</div>
                    <div>• Họ tên</div>
                    <div>• Name</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                📊 Ví dụ định dạng file:
              </p>
              <div className="bg-white dark:bg-zinc-900 rounded p-3 overflow-x-auto text-[11px] font-mono text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-amber-200 dark:border-amber-800">
                      <td className="px-2 py-1 font-semibold">MSSV</td>
                      <td className="px-2 py-1 font-semibold">Họ và tên</td>
                    </tr>
                  </thead>
                  <tbody className="text-[10px]">
                    <tr>
                      <td className="px-2 py-0.5">22120201</td>
                      <td className="px-2 py-0.5">Nguyễn Văn A</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-0.5">22120202</td>
                      <td className="px-2 py-0.5">Trần Thị B</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-0.5">22120203</td>
                      <td className="px-2 py-0.5">Lê Hoàng C</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-amber-800 dark:text-amber-300">
              💡 <span className="font-semibold">Mẹo:</span> Hệ thống sẽ bỏ qua
              dòng trống và tự động phát hiện header. Nếu file có thêm cột khác,
              hệ thống chỉ lấy dữ liệu từ 2 cột MSSV và Họ tên.
            </p>
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
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Tạo lớp học
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
