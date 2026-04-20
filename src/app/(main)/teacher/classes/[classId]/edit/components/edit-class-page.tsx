'use client'

import {
  AlertCircle,
  Download,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload
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

  const addStudent = () => {
    setStudents((prev) => [...prev, { studentId: '', fullName: '' }])
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

    if (mssvColIdx === -1 || nameColIdx === -1) {
      toast.error(
        'Cấu trúc file không hợp lệ! Vui lòng tải file mẫu để xem định dạng đúng.'
      )
      return
    }

    const currentMssvs = new Set(
      students.map((s) => s.studentId.trim()).filter(Boolean)
    )
    const rawExtracted: { mssv: string; name: string; _index: number }[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || !Array.isArray(row)) continue

      const rawMssvStr = String(row[mssvColIdx] || '').trim()
      const rawName = String(row[nameColIdx] || '').trim()

      if (!rawMssvStr && !rawName) continue

      rawExtracted.push({ mssv: rawMssvStr, name: rawName, _index: i })
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

      if (!item.mssv || !item.name) errors.push('missing')
      if (item.mssv && /\D/.test(item.mssv)) errors.push('invalid_format')
      if (item.mssv && fileMssvCounts[item.mssv] > 1)
        errors.push('duplicate_internal')
      if (item.mssv && currentMssvs.has(item.mssv))
        errors.push('duplicate_external')

      if (errors.length > 0) {
        conflicts.push({
          studentId: item.mssv,
          fullName: item.name,
          _index: item._index,
          errorType: errors
        })
      } else {
        valid.push({ studentId: item.mssv, fullName: item.name })
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
    const ws = XLSX.utils.aoa_to_sheet([
      ['STT', 'MSSV', 'Họ và tên'],
      ['1', '22120001', 'Nguyễn Văn A'],
      ['2', '22120002', 'Trần Thị B']
    ])
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
      const cleanName = item.fullName.trim()

      if (!cleanMssv || !cleanName) errors.push('missing')
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
          fullName: cleanName
        })
      } else {
        combinedPending.push({ studentId: cleanMssv, fullName: cleanName })
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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {classId ? 'Chỉnh sửa lớp học' : 'Tạo lớp học'}
          </h1>
          <p className="text-muted-foreground">
            {classId
              ? 'Cập nhật thông tin lớp và danh sách sinh viên'
              : 'Thêm lớp học mới và nhập sinh viên'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-5">
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

        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Danh sách sinh viên
                <Badge
                  variant="secondary"
                  className="ml-2 px-2 py-1 text-xs font-medium"
                >
                  {students.length}
                </Badge>
              </h2>
            </div>
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 flex-wrap pb-2 sm:pb-0">
              <div className="relative mr-auto sm:mr-0 shrink-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm MSSV, tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-[160px] lg:w-[220px] rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:border-outline focus:outline-none focus:ring-0 transition-colors"
                />
              </div>
              {selectedIndices.length > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="gap-1.5 shrink-0 bg-error hover:bg-error/90 text-on-error"
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
              <div className="relative group">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Nhập từ file
                </Button>
                <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50">
                  <div className="flex flex-col w-full min-w-[max-content] bg-surface-container-lowest border border-border rounded-md shadow-lg overflow-hidden">
                    <label
                      htmlFor="file-upload"
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-variant cursor-pointer text-on-surface transition-colors"
                    >
                      <Upload className="h-4 w-4 shrink-0" />
                      Tải file lên
                    </label>
                    <div
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-variant cursor-pointer border-t border-border text-on-surface transition-colors"
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

          <div className="overflow-y-auto scrollbar-thin border border-border bg-surface-container-lowest rounded-md">
            <Table>
              <TableHeader className="bg-surface-container-high">
                <TableRow className="border-b-0">
                  <TableHead className="w-[80px] text-center font-semibold text-on-surface-variant border-none align-middle px-0 group">
                    <div className="flex h-full w-full items-center justify-center">
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
                  <TableHead className="font-semibold text-on-surface-variant border-none">
                    MSSV
                  </TableHead>
                  <TableHead className="font-semibold text-on-surface-variant border-none">
                    Họ và tên
                  </TableHead>
                  <TableHead className="w-[80px] text-center font-semibold text-on-surface-variant border-none">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-none">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, localIndex) => {
                    const mssv = student.studentId.trim()
                    const isDuplicate = mssv !== '' && mssvCounts[mssv] > 1
                    const oIdx = student.originalIndex

                    return (
                      <TableRow
                        key={`student-row-${oIdx}`}
                        className={`${isDuplicate ? 'bg-error-container hover:bg-error-container opacity-80 border-none' : 'odd:bg-surface-container-lowest even:bg-surface-container-sub-low odd:hover:bg-surface-container-lowest even:hover:bg-surface-container-sub-low border-none transition-colors'}`}
                      >
                        <TableCell className="text-center align-middle font-normal text-sm text-on-surface-variant border-none px-0 group">
                          <div className="flex h-full w-full items-center justify-center">
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
                        <TableCell className="align-middle border-none">
                          <div className="flex items-center gap-2 pr-2">
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
                              className={`w-full bg-transparent border border-transparent focus:border-outline focus:outline-none focus:ring-0 px-3 py-2 -ml-3 rounded-md text-sm transition-colors text-on-surface-variant ${
                                isDuplicate
                                  ? 'text-on-error-container font-semibold'
                                  : ''
                              }`}
                            />
                            {isDuplicate && (
                              <span
                                title="Mã số sinh viên này đang bị trùng lặp"
                                className="flex items-center shrink-0 cursor-help"
                              >
                                <AlertCircle className="h-4 w-4 text-error" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle border-none">
                          <input
                            type="text"
                            value={student.fullName}
                            onChange={(e) =>
                              updateStudent(oIdx, 'fullName', e.target.value)
                            }
                            placeholder="Họ và tên"
                            className="w-full bg-transparent border border-transparent focus:border-outline focus:outline-none focus:ring-0 px-3 py-2 -ml-3 rounded-md text-sm text-on-surface transition-colors"
                          />
                        </TableCell>
                        <TableCell className="text-center align-middle border-none">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStudent(oIdx)}
                            className="h-8 w-8 text-outline hover:text-error transition-colors"
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
                      className="h-24 text-center text-muted-foreground border-none"
                    >
                      Không tìm thấy sinh viên nào phù hợp
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex justify-end gap-3 mt-4 py-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
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
              Có {conflictRows.length} dòng dữ liệu bị lỗi (thiếu thông tin, sai
              định dạng, hoặc bị trùng lặp). Vui lòng xử lý để tiếp tục.
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
                  <TableHead className="w-[180px] font-semibold text-on-surface-variant">
                    Họ và tên
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
                      <input
                        type="text"
                        value={row.fullName}
                        onChange={(e) =>
                          updateConflictRow(idx, 'fullName', e.target.value)
                        }
                        className="w-full bg-surface-container-lowest border border-border px-3 py-1 flex h-9 rounded-md text-sm focus:border-outline focus:ring-0 outline-none transition-colors text-on-surface"
                      />
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-col gap-1.5 text-[0.8rem] text-error font-medium">
                        {row.errorType.includes('missing') && (
                          <span>• Thiếu MSSV hoặc Tên</span>
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
