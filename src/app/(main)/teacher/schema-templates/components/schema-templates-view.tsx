'use client'

import { useState } from 'react'
import { Plus, Database, Save, X, Calendar, Code, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { createSchemaTemplate } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { SchemaTemplate } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface SchemaTemplatesViewProps {
  initialTemplates: SchemaTemplate[]
}

export function SchemaTemplatesView({
  initialTemplates
}: SchemaTemplatesViewProps) {
  const { callApi, isLoading } = useApi()
  const [templates, setTemplates] = useState(initialTemplates)
  const [showForm, setShowForm] = useState(false)

  // Form
  const [name, setName] = useState('')
  const [ddlScript, setDdlScript] = useState('')
  const [defaultDataScript, setDefaultDataScript] = useState('')

  const resetForm = () => {
    setName('')
    setDdlScript('')
    setDefaultDataScript('')
    setShowForm(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !ddlScript.trim()) {
      toast.error('Vui lòng nhập tên và DDL script')
      return
    }

    const result = await callApi(
      createSchemaTemplate({
        name: name.trim(),
        ddlScript,
        defaultDataScript: defaultDataScript || undefined
      })
    )

    if (result.data) {
      setTemplates((prev) => [...prev, result.data!])
      resetForm()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Schema Templates
          </h1>
          <p className="text-muted-foreground">
            Quản lý các template CSDL cho bài thi
          </p>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo template
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border-2 border-primary/30 bg-card p-6 space-y-5 shadow-md"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Tạo Schema Template mới
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetForm}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tên template <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Quản lý sinh viên"
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              DDL Script <span className="text-destructive">*</span>
            </label>
            <textarea
              value={ddlScript}
              onChange={(e) => setDdlScript(e.target.value)}
              rows={8}
              placeholder="CREATE TABLE students (&#10;  id SERIAL PRIMARY KEY,&#10;  ..."
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Default Data Script (tùy chọn)
            </label>
            <textarea
              value={defaultDataScript}
              onChange={(e) => setDefaultDataScript(e.target.value)}
              rows={5}
              placeholder="INSERT INTO students VALUES ..."
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Tạo template
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Templates list */}
      {templates.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Database className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Chưa có template nào
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tạo schema template đầu tiên để sử dụng trong bài thi.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {t.name}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(t.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <details className="mt-3 group/details">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Xem DDL Script
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs font-mono text-foreground">
                  {t.ddlScript}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
