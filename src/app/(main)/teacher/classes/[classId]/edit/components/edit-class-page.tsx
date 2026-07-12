'use client'

import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  Download,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useApi } from '@/hooks/use-api'
import { createClass, updateClass } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { CreateClassStudentInfo } from '@/lib/types'

interface EditClassPageProps {
  classId?: number
  initialClassCode?: string
  initialSemester?: string
  initialStudents?: CreateClassStudentInfo[]
}

type ConflictErrorType =
  | 'missing'
  | 'duplicate_internal'
  | 'duplicate_external'
  | 'invalid_format'

interface ConflictRow extends CreateClassStudentInfo {
  _index: number
  errorType: ConflictErrorType[]
}

const CLASS_CODE_MAX_LENGTH = 20
type AddStudentMode = 'single' | 'bulk'

export function EditClassPage({
  classId,
  initialClassCode = '',
  initialSemester = '',
  initialStudents = []
}: EditClassPageProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [classCode, setClassCode] = useState(initialClassCode)
  const [semester, setSemester] = useState(initialSemester)
  const [students, setStudents] =
    useState<CreateClassStudentInfo[]>(initialStudents)

  // Search & Select states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  // Conflict modal states
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [conflictRows, setConflictRows] = useState<ConflictRow[]>([])
  const [pendingValidRows, setPendingValidRows] = useState<
    CreateClassStudentInfo[]
  >([])
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false)
  const [addStudentMode, setAddStudentMode] = useState<AddStudentMode>('single')
  const [addStudentInput, setAddStudentInput] = useState('')

  const addStudent = () => {
    setAddStudentMode('single')
    setAddStudentInput('')
    setAddStudentModalOpen(true)
  }

  const removeStudent = (index: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== index))
    setSelectedIndices((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    )
  }

  const handleBulkDelete = () => {
    setStudents((prev) => prev.filter((_, i) => !selectedIndices.includes(i)))
    setSelectedIndices([])
  }

  const processData = (data: unknown[]) => {
    if (data.length < 1) {
      toast.error('File không có dữ liệu hợp lệ')
      return
    }

    let headerRowIdx = 0
    let mssvColIdx = -1
    let hasHeader = false
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
      mssvColIdx = 0
    }

    const currentMssvs = new Set(
      students.map((s) => s.studentId.trim()).filter(Boolean)
    )
    const rawExtracted: { mssv: string; _index: number }[] = []

    const firstDataRowIdx = hasHeader ? headerRowIdx + 1 : 0
    for (let i = firstDataRowIdx; i < data.length; i++) {
      const row = data[i]
      if (!row || !Array.isArray(row)) continue

      const rawMssvStr = String(row[mssvColIdx] || '').trim()

      if (!rawMssvStr) continue

      rawExtracted.push({ mssv: rawMssvStr, _index: i })
    }

    const fileMssvCounts = rawExtracted.reduce(
      (acc, curr) => {
        if (curr.mssv) acc[curr.mssv] = (acc[curr.mssv] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const valid: CreateClassStudentInfo[] = []
    const conflicts: ConflictRow[] = []

    rawExtracted.forEach((item) => {
      const errors: ConflictErrorType[] = []

      if (!item.mssv) errors.push('missing')
      if (item.mssv && /\D/.test(item.mssv)) errors.push('invalid_format')
      if (item.mssv && fileMssvCounts[item.mssv] > 1)
        errors.push('duplicate_internal')
      if (item.mssv && currentMssvs.has(item.mssv))
        errors.push('duplicate_external')

      if (errors.length > 0) {
        conflicts.push({
          studentId: item.mssv,
          fullName: '',
          _index: item._index,
          errorType: errors
        })
      } else {
        valid.push({ studentId: item.mssv, fullName: '' })
      }
    })

    if (conflicts.length > 0) {
      setPendingValidRows(valid)
      setConflictRows(conflicts)
      setConflictModalOpen(true)
    } else {
      if (valid.length > 0) {
        setStudents((prev) => [...prev, ...valid])
        toast.success(`Đã nhập thành công ${valid.length} sinh viên từ file`)
      } else {
        toast.info('Không có dữ liệu sinh viên nào mới để nhập.')
      }
    }
  }

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['MSSV'], ['22120001'], ['22120002']])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'Danh_sach_sinh_vien_mau.xlsx')
  }

  const updateConflictRow = (
    index: number,
    field: keyof CreateClassStudentInfo,
    value: string
  ) => {
    setConflictRows((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeConflictRow = (index: number) => {
    setConflictRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleResolveConflicts = () => {
    const currentMssvs = new Set(
      students.map((s) => s.studentId).filter(Boolean)
    )
    const combinedPending = [...pendingValidRows]

    let hasStillErrors = false
    const newConflicts: ConflictRow[] = []

    const newFileCounts = conflictRows.reduce(
      (acc, curr) => {
        const cleanMssv = curr.studentId.trim()
        if (cleanMssv) acc[cleanMssv] = (acc[cleanMssv] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    pendingValidRows.forEach((v) => {
      const m = v.studentId.trim()
      if (m) newFileCounts[m] = (newFileCounts[m] || 0) + 1
    })

    conflictRows.forEach((item) => {
      const errors: ConflictErrorType[] = []
      const cleanMssv = item.studentId.trim()

      if (!cleanMssv) errors.push('missing')
      if (cleanMssv && /\D/.test(cleanMssv)) errors.push('invalid_format')
      if (cleanMssv && newFileCounts[cleanMssv] > 1)
        errors.push('duplicate_internal')
      if (cleanMssv && currentMssvs.has(cleanMssv))
        errors.push('duplicate_external')

      if (errors.length > 0) {
        hasStillErrors = true
        newConflicts.push({
          ...item,
          errorType: errors,
          studentId: cleanMssv,
          fullName: ''
        })
      } else {
        combinedPending.push({ studentId: cleanMssv, fullName: '' })
      }
    })

    if (hasStillErrors) {
      setConflictRows(newConflicts)
      toast.error(
        'Vẫn còn dòng bị lỗi. Vui lòng xử lý triệt để hoặc Xóa dòng lỗi.'
      )
    } else {
      setStudents((prev) => [...prev, ...combinedPending])
      setConflictModalOpen(false)
      toast.success(`Đã nhập thêm ${combinedPending.length} sinh viên`)
      setConflictRows([])
      setPendingValidRows([])
    }
  }

  const importOnlyValid = () => {
    if (pendingValidRows.length > 0) {
      setStudents((prev) => [...prev, ...pendingValidRows])
      toast.success(
        `Đã nhập thành công ${pendingValidRows.length} sinh viên hợp lệ. Đã bỏ qua các dòng lỗi.`
      )
    } else {
      toast.info('Không có sinh viên hợp lệ nào để nhập thêm.')
    }
    handleCancelImport()
  }

  const handleCancelImport = () => {
    setConflictModalOpen(false)
    setConflictRows([])
    setPendingValidRows([])
  }

  const closeAddStudentModal = () => {
    setAddStudentModalOpen(false)
    setAddStudentInput('')
    setAddStudentMode('single')
  }

  const parseStudentCodes = (value: string) =>
    value
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.split('@')[0])

  const handleAddStudentsFromModal = () => {
    const parsedCodes = parseStudentCodes(addStudentInput)

    if (parsedCodes.length === 0) {
      toast.error('Vui lòng nhập MSSV cần thêm')
      return
    }

    if (addStudentMode === 'single' && parsedCodes.length > 1) {
      toast.error('Chế độ thêm 1 sinh viên chỉ nhận một MSSV')
      return
    }

    const invalidCodes = parsedCodes.filter((code) => !/^\d+$/.test(code))
    if (invalidCodes.length > 0) {
      toast.error(
        `MSSV chỉ được chứa chữ số: ${invalidCodes.slice(0, 3).join(', ')}`
      )
      return
    }

    const codeCounts = parsedCodes.reduce(
      (acc, code) => {
        acc[code] = (acc[code] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    const duplicateInInput = Object.entries(codeCounts)
      .filter(([, count]) => count > 1)
      .map(([code]) => code)
    if (duplicateInInput.length > 0) {
      toast.error(
        `MSSV bị trùng trong danh sách nhập: ${duplicateInInput
          .slice(0, 3)
          .join(', ')}`
      )
      return
    }

    const existingCodes = new Set(
      students.map((student) => student.studentId.trim()).filter(Boolean)
    )
    const duplicateExisting = parsedCodes.filter((code) =>
      existingCodes.has(code)
    )
    if (duplicateExisting.length > 0) {
      toast.error(
        `MSSV đã có trong lớp: ${duplicateExisting.slice(0, 3).join(', ')}`
      )
      return
    }

    const firstNewIndex = students.length
    const newStudents = parsedCodes.map((studentId) => ({
      studentId,
      fullName: ''
    }))
    setStudents((prev) => [...prev, ...newStudents])
    closeAddStudentModal()
    toast.success(`Đã thêm ${newStudents.length} sinh viên`)

    setTimeout(() => {
      const row = document.getElementById(`student-row-${firstNewIndex}`)
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''

    if (fileExt === 'csv') {
      Papa.parse(file, {
        complete: (results) => processData(results.data as unknown[]),
        error: () => {
          toast.error('Lỗi khi đọc file CSV. Vui lòng kiểm tra lại định dạng.')
        },
        skipEmptyLines: true,
        encoding: 'UTF-8'
      })
    } else {
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const arrayBuffer = evt.target?.result
          const wb = XLSX.read(arrayBuffer, { type: 'array', codepage: 65001 })
          const ws = wb.Sheets[wb.SheetNames[0]]
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

    const validStudents = students
      .map((s) => ({
        studentId: s.studentId.trim(),
        fullName: s.fullName.trim()
      }))
      .filter((s) => s.studentId)

    const uniqueStudentIds = new Set(
      validStudents.map((s) => s.studentId.trim())
    )
    if (uniqueStudentIds.size !== validStudents.length) {
      toast.error(
        'Có mã số sinh viên (MSSV) bị trùng lặp. Vui lòng kiểm tra lại!'
      )
      return
    }

    const payload = {
      classCode: classCode.trim(),
      semester: semester.trim(),
      students: validStudents.map((s) => ({
        studentId: s.studentId.trim(),
        fullName: s.fullName.trim()
      }))
    }

    const action = classId
      ? updateClass(classId, payload)
      : createClass(payload)
    const result = await callApi(action)

    if (result.data) {
      router.push(
        classId ? PATH.TEACHER_CLASS_DETAIL(classId) : PATH.TEACHER_CLASSES
      )
    }
  }

  const mssvCounts = students.reduce(
    (acc, curr) => {
      const val = curr.studentId.trim()
      if (val) {
        acc[val] = (acc[val] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>
  )

  const filteredStudents = students
    .map((student, idx) => ({ ...student, originalIndex: idx }))
    .filter((student) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase().trim()
      return (
        student.studentId.toLowerCase().includes(query) ||
        student.fullName.toLowerCase().includes(query)
      )
    })

  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIndices.includes(s.originalIndex))
  const validStudentCount = students.filter((student) =>
    student.studentId.trim()
  ).length
  const duplicateStudentCount = Object.values(mssvCounts).reduce(
    (total, count) => total + (count > 1 ? count : 0),
    0
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelections = new Set([
        ...selectedIndices,
        ...filteredStudents.map((s) => s.originalIndex)
      ])
      setSelectedIndices(Array.from(newSelections))
    } else {
      const filteredIndices = filteredStudents.map((s) => s.originalIndex)
      setSelectedIndices((prev) =>
        prev.filter((idx) => !filteredIndices.includes(idx))
      )
    }
  }

  const handleSelectRow = (originalIndex: number, checked: boolean) => {
    if (checked) {
      setSelectedIndices((prev) => [...prev, originalIndex])
    } else {
      setSelectedIndices((prev) => prev.filter((i) => i !== originalIndex))
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0 text-muted-foreground"
              onClick={() => router.back()}
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <Badge variant="secondary" className="mb-3 rounded-full">
                {classId ? 'Chỉnh sửa lớp' : 'Tạo lớp mới'}
              </Badge>
              <h1 className="truncate text-3xl font-bold tracking-tight text-foreground">
                {classId ? classCode || 'Chỉnh sửa lớp học' : 'Tạo lớp học'}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {classId
                  ? 'Cập nhật thông tin lớp và danh sách sinh viên trong một màn hình.'
                  : 'Thiết lập thông tin lớp và nhập danh sách sinh viên ban đầu.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tổng SV
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {students.length}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hợp lệ
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {validStudentCount}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Trùng
              </p>
              <p
                className={`mt-1 text-xl font-bold ${
                  duplicateStudentCount > 0
                    ? 'text-destructive'
                    : 'text-foreground'
                }`}
              >
                {duplicateStudentCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <BookOpenCheck className="h-5 w-5 text-primary" />
              Thông tin lớp học
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mã lớp và học kỳ sẽ hiển thị cho giáo viên trong trang quản lý.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2">
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
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Users className="h-5 w-5 text-primary" />
                Danh sách sinh viên
                <Badge variant="secondary" className="rounded-full">
                  {students.length}
                </Badge>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tìm kiếm, thêm nhanh hoặc nhập danh sách từ file Excel/CSV.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <div className="relative min-w-[220px] flex-1 lg:flex-none">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm MSSV, họ tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm transition-colors focus:border-outline focus:outline-none focus:ring-0 lg:w-[240px]"
                />
              </div>
              {selectedIndices.length > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="shrink-0 gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa ({selectedIndices.length})
                </Button>
              )}
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="group relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  Nhập file
                </Button>
                <div className="absolute left-0 top-full z-50 hidden pt-1 group-hover:block">
                  <div className="flex w-full min-w-[max-content] flex-col overflow-hidden rounded-md border border-border bg-surface-container-lowest shadow-lg">
                    <label
                      htmlFor="file-upload"
                      className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-variant"
                    >
                      <Upload className="h-4 w-4 shrink-0" />
                      Tải file lên
                    </label>
                    <div
                      onClick={handleDownloadTemplate}
                      className="flex cursor-pointer items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-variant"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      Tải file mẫu
                    </div>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStudent}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Thêm sinh viên
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border">
                  <TableHead className="w-[76px] px-0 text-center font-semibold text-muted-foreground">
                    <div className="group flex h-full w-full items-center justify-center">
                      <span
                        className={
                          isAllSelected ? 'hidden' : 'group-hover:hidden'
                        }
                      >
                        STT
                      </span>
                      <div
                        className={
                          isAllSelected ? 'flex' : 'hidden group-hover:flex'
                        }
                      >
                        <Checkbox
                          className="bg-card"
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground">
                    MSSV
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground">
                    Họ và tên
                  </TableHead>
                  <TableHead className="w-[90px] text-right font-semibold text-muted-foreground">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, localIndex) => {
                    const mssv = student.studentId.trim()
                    const isDuplicate = mssv !== '' && mssvCounts[mssv] > 1
                    const oIdx = student.originalIndex
                    const displayName = student.fullName.trim()
                    const hasRealName = displayName && displayName !== mssv

                    return (
                      <TableRow
                        key={`student-row-${oIdx}`}
                        id={`student-row-${oIdx}`}
                        className={
                          isDuplicate
                            ? 'border-border bg-destructive/10 hover:bg-destructive/15'
                            : 'border-border/60 hover:bg-muted/30'
                        }
                      >
                        <TableCell className="px-0 text-center align-middle text-sm text-muted-foreground">
                          <div className="group flex h-full w-full items-center justify-center">
                            <span
                              className={
                                selectedIndices.includes(oIdx)
                                  ? 'hidden'
                                  : 'group-hover:hidden'
                              }
                            >
                              {localIndex + 1}
                            </span>
                            <div
                              className={
                                selectedIndices.includes(oIdx)
                                  ? 'flex'
                                  : 'hidden group-hover:flex'
                              }
                            >
                              <Checkbox
                                checked={selectedIndices.includes(oIdx)}
                                onCheckedChange={(checked) =>
                                  handleSelectRow(oIdx, checked as boolean)
                                }
                                aria-label="Select row"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={student.studentId}
                              onChange={(e) => {
                                const onlyNumbers = e.target.value.replace(
                                  /\D/g,
                                  ''
                                )
                                updateStudent(oIdx, 'studentId', onlyNumbers)
                              }}
                              placeholder="MSSV (VD: 22120201)"
                              className={`h-9 w-full rounded-md border border-transparent bg-background/60 px-3 text-sm text-foreground transition-colors focus:border-outline focus:outline-none focus:ring-0 ${
                                isDuplicate
                                  ? 'font-semibold text-destructive'
                                  : ''
                              }`}
                            />
                            {isDuplicate && (
                              <span
                                title="Mã số sinh viên này đang bị trùng lặp"
                                className="flex shrink-0 cursor-help items-center"
                              >
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          {hasRealName ? (
                            <span className="text-sm font-medium text-foreground">
                              {displayName}
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-sm text-muted-foreground">
                                Chưa có tên
                              </span>
                              <p className="text-xs text-muted-foreground/80">
                                Sẽ cập nhật khi sinh viên đăng nhập Microsoft
                              </p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStudent(oIdx)}
                            className="h-8 w-8 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            disabled={students.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Không tìm thấy sinh viên nào phù hợp
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <div className="sticky bottom-0 z-10 flex justify-end gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-sm backdrop-blur">
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
                {classId ? 'Lưu thay đổi' : 'Tạo lớp học'}
              </>
            )}
          </Button>
        </div>
      </form>

      <Dialog
        open={addStudentModalOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            closeAddStudentModal()
            return
          }
          setAddStudentModalOpen(true)
        }}
      >
        <DialogContent className="max-w-lg bg-surface-container-lowest border-border">
          <DialogHeader>
            <DialogTitle>Thêm sinh viên bằng MSSV</DialogTitle>
            <DialogDescription>
              Chỉ cần nhập MSSV. Họ tên sẽ hiển thị nếu sinh viên đã có tài
              khoản hoặc sẽ tự cập nhật sau khi đăng nhập Microsoft.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-1">
              <Button
                type="button"
                variant={addStudentMode === 'single' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setAddStudentMode('single')
                  setAddStudentInput('')
                }}
              >
                Thêm 1
              </Button>
              <Button
                type="button"
                variant={addStudentMode === 'bulk' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setAddStudentMode('bulk')
                  setAddStudentInput('')
                }}
              >
                Thêm nhiều
              </Button>
            </div>

            {addStudentMode === 'single' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  MSSV
                </label>
                <input
                  type="text"
                  value={addStudentInput}
                  onChange={(event) =>
                    setAddStudentInput(event.target.value.replace(/\D/g, ''))
                  }
                  placeholder="VD: 22120201"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-outline focus:outline-none focus:ring-0"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Danh sách MSSV
                </label>
                <textarea
                  value={addStudentInput}
                  onChange={(event) => setAddStudentInput(event.target.value)}
                  placeholder={'22120201\n22120202\n22120203'}
                  rows={7}
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-outline focus:outline-none focus:ring-0"
                />
                <p className="text-xs text-muted-foreground">
                  Mỗi MSSV một dòng, hoặc ngăn cách bằng dấu phẩy/khoảng trắng.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeAddStudentModal}
            >
              Hủy
            </Button>
            <Button type="button" onClick={handleAddStudentsFromModal}>
              <Plus className="h-4 w-4" />
              Thêm vào lớp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Conflict Modal */}
      <Dialog
        open={conflictModalOpen}
        onOpenChange={(open: boolean) => !open && handleCancelImport()}
      >
        <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] flex flex-col bg-surface-container-lowest border-border">
          <DialogHeader>
            <DialogTitle className="text-error flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Phát hiện dữ liệu bất thường
            </DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              Có {conflictRows.length} dòng MSSV bị lỗi (thiếu MSSV, sai định
              dạng, hoặc bị trùng lặp). Vui lòng xử lý để tiếp tục.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-[300px] border border-border rounded-md bg-surface-container-lowest">
            <Table>
              <TableHeader className="bg-surface-container-high sticky top-0 z-10 shadow-sm">
                <TableRow className="border-border">
                  <TableHead className="w-[60px] text-center font-semibold text-on-surface-variant">
                    Dòng
                  </TableHead>
                  <TableHead className="w-[120px] font-semibold text-on-surface-variant">
                    MSSV
                  </TableHead>
                  <TableHead className="font-semibold text-on-surface-variant">
                    Chi tiết lỗi
                  </TableHead>
                  <TableHead className="w-[60px] text-center font-semibold text-on-surface-variant">
                    Xóa
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflictRows.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className="bg-error-container/20 border-border"
                  >
                    <TableCell className="text-center font-medium text-sm align-middle text-on-surface">
                      {row._index}
                    </TableCell>
                    <TableCell className="align-middle">
                      <input
                        type="text"
                        value={row.studentId}
                        onChange={(e) =>
                          updateConflictRow(
                            idx,
                            'studentId',
                            e.target.value.replace(/\D/g, '')
                          )
                        }
                        className="w-full bg-surface-container-lowest border border-border px-3 py-1 flex h-9 rounded-md text-sm focus:border-outline focus:ring-0 outline-none transition-colors text-on-surface"
                      />
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-col gap-1.5 text-[0.8rem] text-error font-medium">
                        {row.errorType.includes('missing') && (
                          <span>• Thiếu MSSV</span>
                        )}
                        {row.errorType.includes('invalid_format') && (
                          <span>• MSSV chứa ký tự chữ (chỉ nhận số)</span>
                        )}
                        {row.errorType.includes('duplicate_internal') && (
                          <span>• MSSV trùng với dòng khác trong file</span>
                        )}
                        {row.errorType.includes('duplicate_external') && (
                          <span>• MSSV đã có trong lớp</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeConflictRow(idx)}
                        className="h-8 w-8 text-error hover:bg-error-container hover:text-error transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <div className="flex w-full flex-col sm:flex-row sm:w-auto justify-between items-center sm:justify-start gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelImport}
                className="w-full sm:w-auto"
              >
                Hủy bỏ
              </Button>
              {pendingValidRows.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={importOnlyValid}
                  className="w-full sm:w-auto"
                >
                  Chỉ nhập {pendingValidRows.length} hợp lệ
                </Button>
              )}
              <Button
                type="button"
                onClick={handleResolveConflicts}
                className="w-full sm:w-auto bg-primary text-primary-foreground"
              >
                Kiểm tra & Nhập tất cả
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
