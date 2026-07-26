'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Plus, Trash2, Save, UserPlus, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  CLASS_CODE_MAX_LENGTH,
  isValidStudentCode,
  PATH,
  SEMESTER_MAX_LENGTH,
  STUDENT_CODE_LENGTH
} from '@/lib/constants'
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
    if (data.length < 1) {
      toast.error('File không có dữ liệu hợp lệ')
      return
    }

    let headerRowIdx = 0
    let mssvColIdx = -1
    let hasHeader = false

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
      })

      if (mssvColIdx !== -1) {
        headerRowIdx = i
        hasHeader = true
        break
      }
    }

    if (mssvColIdx === -1) {
      // Fallback mặc định cột 0 là MSSV nếu không tìm thấy header rõ ràng
      mssvColIdx = 0
    }

    const newStudents: CreateClassStudentInfo[] = []

    const firstDataRowIdx = hasHeader ? headerRowIdx + 1 : 0
    for (let i = firstDataRowIdx; i < data.length; i++) {
      const row = data[i]
      if (!row || !Array.isArray(row)) continue

      const mssv = String(row[mssvColIdx] || '').trim()

      if (mssv) {
        newStudents.push({ studentId: mssv, fullName: '' })
      }
    }

    if (newStudents.length > 0) {
      const invalidStudentIds = newStudents.filter(
        (student) => !isValidStudentCode(student.studentId)
      )
      if (invalidStudentIds.length > 0) {
        toast.error(
          `MSSV phải gồm đúng ${STUDENT_CODE_LENGTH} chữ số: ${invalidStudentIds
            .slice(0, 3)
            .map((student) => student.studentId)
            .join(', ')}`
        )
        return
      }

      setStudents((prev) => {
        // Khử trùng lặp và loại bỏ các trường rỗng
        const currentValid = prev.filter((s) => s.studentId)

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
        error: () => {
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
        } catch {
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

    if (classCode.trim().length > CLASS_CODE_MAX_LENGTH) {
      toast.error(`Mã lớp không được vượt quá ${CLASS_CODE_MAX_LENGTH} ký tự`)
      return
    }

    if (semester.trim().length > SEMESTER_MAX_LENGTH) {
      toast.error(`Học kỳ không được vượt quá ${SEMESTER_MAX_LENGTH} ký tự`)
      return
    }

    const validStudents = students
      .map((s) => ({
        studentId: s.studentId.trim(),
        fullName: s.fullName.trim()
      }))
      .filter((s) => s.studentId)

    const invalidStudentIds = validStudents.filter(
      (student) => !isValidStudentCode(student.studentId)
    )
    if (invalidStudentIds.length > 0) {
      toast.error(
        `MSSV phải gồm đúng ${STUDENT_CODE_LENGTH} chữ số: ${invalidStudentIds
          .slice(0, 3)
          .map((student) => student.studentId)
          .join(', ')}`
      )
      return
    }

    const uniqueStudentIds = new Set(validStudents.map((s) => s.studentId))
    if (uniqueStudentIds.size !== validStudents.length) {
      toast.error(
        'Có mã số sinh viên (MSSV) bị trùng lặp. Vui lòng kiểm tra lại!'
      )
      return
    }

    // Optional: add debug log if needed but eslint complains

    const result = await callApi(
      createClass({
        classCode: classCode.trim(),
        semester: semester.trim(),
        students: validStudents
      })
    )

    if (result.data) {
      toast.success('Tạo lớp học thành công!')
      router.push(PATH.TEACHER_CLASS_DETAIL(result.data.id))
    }
  }

  return (
    <div className="space-y-8">
      <div>
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
                maxLength={CLASS_CODE_MAX_LENGTH}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
              <p className="text-xs text-muted-foreground">
                Tối đa {CLASS_CODE_MAX_LENGTH} ký tự ({classCode.length}/
                {CLASS_CODE_MAX_LENGTH})
              </p>
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
                maxLength={SEMESTER_MAX_LENGTH}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
              <p className="text-xs text-muted-foreground">
                Tối đa {SEMESTER_MAX_LENGTH} ký tự ({semester.length}/
                {SEMESTER_MAX_LENGTH})
              </p>
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
                Thêm MSSV
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
                File của bạn chỉ cần cột MSSV. Hệ thống sẽ tự nhận diện cột
                MSSV, các cột khác nếu có sẽ được bỏ qua.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                ✓ Các tên cột được hỗ trợ:
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs text-amber-800 dark:text-amber-300">
                <div>
                  <span className="font-semibold">Cột MSSV:</span>
                  <div className="pl-2 space-y-0.5">
                    <div>• MSSV</div>
                    <div>• Mã SV</div>
                    <div>• Mã sinh viên</div>
                    <div>• ID</div>
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
                    </tr>
                  </thead>
                  <tbody className="text-[10px]">
                    <tr>
                      <td className="px-2 py-0.5">22120201</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-0.5">22120202</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-0.5">22120203</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-amber-800 dark:text-amber-300">
              💡 <span className="font-semibold">Mẹo:</span> Hệ thống sẽ bỏ qua
              dòng trống và tự động phát hiện header. Nếu file có thêm cột khác,
              hệ thống chỉ lấy dữ liệu từ cột MSSV.
            </p>
          </div>

          <div className="space-y-3">
            {students.map((student, index) => {
              const studentCode = student.studentId.trim()
              const isInvalid =
                studentCode !== '' && !isValidStudentCode(studentCode)

              return (
                <div
                  key={`student-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={STUDENT_CODE_LENGTH}
                      value={student.studentId}
                      onChange={(e) =>
                        updateStudent(
                          index,
                          'studentId',
                          e.target.value.replace(/\D/g, '')
                        )
                      }
                      placeholder="MSSV (VD: 22120201)"
                      className={`flex h-9 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isInvalid
                          ? 'border-destructive text-destructive'
                          : 'border-border'
                      }`}
                    />
                    {isInvalid && (
                      <p className="text-xs text-destructive">
                        MSSV phải gồm đúng {STUDENT_CODE_LENGTH} chữ số
                      </p>
                    )}
                  </div>
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
              )
            })}
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
