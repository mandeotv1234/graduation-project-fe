'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus } from 'lucide-react'
import { SampleDataRow } from '@/lib/types/create-exam.type'

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Dữ liệu mẫu</Label>
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

      <div className="border border-input rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-medium text-muted-foreground">
                  STUDENTID
                </th>
                <th className="text-left px-4 py-2 text-sm font-medium text-muted-foreground">
                  FIRSTNAME
                </th>
                <th className="text-left px-4 py-2 text-sm font-medium text-muted-foreground">
                  LASTNAME
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-background">
              {data.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-2">
                    <Input
                      value={row.studentId}
                      onChange={(e) =>
                        updateRow(index, 'studentId', e.target.value)
                      }
                      placeholder={String(index + 1)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={row.firstName}
                      onChange={(e) =>
                        updateRow(index, 'firstName', e.target.value)
                      }
                      placeholder="An"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={row.lastName}
                      onChange={(e) =>
                        updateRow(index, 'lastName', e.target.value)
                      }
                      placeholder="Nguyễn"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
