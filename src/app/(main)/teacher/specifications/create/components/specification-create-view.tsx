'use client'

import { FileText } from 'lucide-react'
import DatabaseBuilder from '../../components/database-builder'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'

export function SpecificationCreateView() {
  const [specificationInfo, setSpecificationInfo] = useState({
    name: '',
    description: ''
  })

  return (
    <div className="space-y-6 rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tạo đặc tả CSDL
          </h1>
          <p className="text-muted-foreground">
            Nhập thông tin chung và cấu trúc dữ liệu cho đặc tả mới.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Tên đặc tả CSDL <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="VD: Quản lý sinh viên"
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
              value={specificationInfo.name}
              onChange={(e) =>
                setSpecificationInfo({
                  ...specificationInfo,
                  name: e.target.value
                })
              }
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Mô tả</label>
            <Textarea
              placeholder="Mô tả ngắn về đặc tả CSDL..."
              rows={3}
              value={specificationInfo.description}
              onChange={(e) =>
                setSpecificationInfo({
                  ...specificationInfo,
                  description: e.target.value
                })
              }
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DatabaseBuilder specificationInfo={specificationInfo} />
      </div>
    </div>
  )
}
