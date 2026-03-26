'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus } from 'lucide-react'
import { SampleDataRow } from '@/lib/types/create-exam.type'
import styles from '@/app/(main)/create-exam/components/exam-sample-data-table/exam-sample-data-table.module.scss'

interface ExamSampleDataTableProps {
  data: SampleDataRow[]
  onDataChange: (data: SampleDataRow[]) => void
}

export default function ExamSampleDataTable({
  data,
  onDataChange
}: ExamSampleDataTableProps) {
  const addRow = () => {
    onDataChange([
      ...data,
      {
        studentId: '',
        firstName: '',
        lastName: ''
      }
    ])
  }

  const removeRow = (index: number) => {
    onDataChange(data.filter((_, i) => i !== index))
  }

  const updateRow = (
    index: number,
    field: keyof SampleDataRow,
    value: string
  ) => {
    const newData = [...data]
    newData[index][field] = value
    onDataChange(newData)
  }

  return (
    <div className={styles.dataTableContainer}>
      <div className="flex items-center justify-between">
        <Label className={styles.sectionTitle}>Dữ liệu mẫu</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={addRow}
          className="gap-2"
          type="button"
        >
          <Plus className="h-4 w-4" />
          Thêm dòng
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        <div className="overflow-x-auto">
          <table className={styles.dataTable}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.headerCell}>STUDENTID</th>
                <th className={styles.headerCell}>FIRSTNAME</th>
                <th className={styles.headerCell}>LASTNAME</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {data.map((row, index) => (
                <tr key={index} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <Input
                      value={row.studentId}
                      onChange={(e) =>
                        updateRow(index, 'studentId', e.target.value)
                      }
                      placeholder={String(index + 1)}
                      className={styles.cellInput}
                    />
                  </td>
                  <td className={styles.tableCell}>
                    <Input
                      value={row.firstName}
                      onChange={(e) =>
                        updateRow(index, 'firstName', e.target.value)
                      }
                      placeholder="An"
                      className={styles.cellInput}
                    />
                  </td>
                  <td className={styles.tableCell}>
                    <Input
                      value={row.lastName}
                      onChange={(e) =>
                        updateRow(index, 'lastName', e.target.value)
                      }
                      placeholder="Nguyễn"
                      className={styles.cellInput}
                    />
                  </td>
                  <td className={styles.tableCell}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableActions}>
          <span className={styles.tableInfo}>
            {data.length} dòng dữ liệu mẫu
          </span>
          <div className={styles.actionButtons}>
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              className={styles.addRowButton}
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm dòng
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDataChange([])}
              className={styles.clearButton}
            >
              Xóa tất cả
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
