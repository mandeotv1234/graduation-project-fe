import { Database, Play, Undo2, Redo2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useBuilderContext } from './builder-context'
import { useEffect, useState } from 'react'

export function Header() {
  const [aiDescription, setAiDescription] = useState('')
  const [schemaScriptDraft, setSchemaScriptDraft] = useState('')
  const [datasetScriptDraft, setDatasetScriptDraft] = useState('')
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    datasets,
    selectedDatasetForSQL,
    setSelectedDatasetForSQL,
    handleGenerateSchemaSQL: generateSchemaSQL,
    handleGenerateDatasetSQL: generateDatasetSQL,
    handleSyncSchemaFromDdlScript,
    handleSyncDatasetFromDmlScript,
    handleVerifyAndCreate,
    handleGenerateByAiAssist,
    isAiGenerating,
    isSyncingFromScript,
    isEditMode
  } = useBuilderContext()

  const generatedSchemaScript = generateSchemaSQL()
  const generatedDatasetScript = generateDatasetSQL()
  const selectedDataset = datasets.find(
    (dataset) => dataset.id === selectedDatasetForSQL
  )

  useEffect(() => {
    setSchemaScriptDraft(generatedSchemaScript)
  }, [generatedSchemaScript])

  useEffect(() => {
    setDatasetScriptDraft(generatedDatasetScript)
  }, [generatedDatasetScript])

  return (
    <div className="shrink-0 border-b bg-white">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              Database Schema Builder
            </h1>
            <p className="text-sm text-neutral-500">
              Thiết kế schema và tạo các dataset độc lập.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="mr-4 flex items-center gap-1 border-r pr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <Dialog>
            <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              View Schema SQL
            </DialogTrigger>
            <DialogContent className="flex max-h-[92vh] w-[90vw] max-w-[90vw] flex-col sm:max-w-[90vw]">
              <DialogHeader>
                <DialogTitle>Schema SQL Script</DialogTitle>
                <DialogDescription>
                  Script DDL dùng để tạo bảng. Có thể chỉnh sửa và đồng bộ ngược
                  lại UI builder.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="min-h-0 h-[60vh] max-h-[60vh] rounded-md bg-neutral-950 p-4 font-mono text-sm text-neutral-50">
                <Textarea
                  value={schemaScriptDraft}
                  onChange={(event) => setSchemaScriptDraft(event.target.value)}
                  className="min-h-[58vh] resize-none border-0 bg-transparent font-mono text-xs text-neutral-100 focus-visible:ring-0"
                />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() =>
                    handleSyncSchemaFromDdlScript(schemaScriptDraft)
                  }
                  disabled={isSyncingFromScript || !schemaScriptDraft.trim()}
                >
                  {isSyncingFromScript
                    ? 'Đang đồng bộ...'
                    : 'Áp dụng script vào UI'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              View Dataset SQL
            </DialogTrigger>
            <DialogContent className="flex max-h-[92vh] w-[90vw] max-w-[90vw] flex-col sm:max-w-[90vw]">
              <DialogHeader>
                <DialogTitle>Dataset SQL Script</DialogTitle>
                <DialogDescription>
                  Script DML dùng để nạp dữ liệu cho dataset đang chọn. Có thể
                  chỉnh sửa và lưu làm script riêng của dataset.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-3 py-2">
                <Label>Dataset:</Label>
                <Select
                  value={selectedDatasetForSQL}
                  onValueChange={(value) =>
                    value && setSelectedDatasetForSQL(value)
                  }
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        {dataset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="min-h-0 h-[60vh] max-h-[60vh] rounded-md bg-neutral-950 p-4 font-mono text-sm text-neutral-50">
                <Textarea
                  value={datasetScriptDraft}
                  onChange={(event) =>
                    setDatasetScriptDraft(event.target.value)
                  }
                  placeholder="Chưa có dataset hoặc dataset chưa có dữ liệu."
                  className="min-h-[58vh] resize-none border-0 bg-transparent font-mono text-xs text-neutral-100 focus-visible:ring-0"
                />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() =>
                    handleSyncDatasetFromDmlScript(datasetScriptDraft)
                  }
                  disabled={!selectedDataset || !datasetScriptDraft.trim()}
                >
                  Áp dụng script cho dataset
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleVerifyAndCreate} className="gap-2">
            <Play className="h-4 w-4" />
            {isEditMode ? 'Verify & Update' : 'Verify & Create'}
          </Button>
        </div>
      </header>

      <div className="bg-linear-to-r from-blue-50/60 to-indigo-50/40 px-6 py-4">
        <div className="flex w-full items-center gap-3 rounded-lg bg-white/80 p-2">
          <Input
            placeholder="Mô tả yêu cầu để AI cập nhật schema..."
            value={aiDescription}
            onChange={(event) => setAiDescription(event.target.value)}
            className="h-10 border-0 bg-white focus-visible:ring-blue-300"
          />
          <Button
            onClick={async () => {
              await handleGenerateByAiAssist(aiDescription)
              setAiDescription('')
            }}
            disabled={isAiGenerating || !aiDescription.trim()}
            className="h-10 gap-2 bg-blue-600 px-4 text-white hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            {isAiGenerating ? 'Đang xử lý...' : 'Sinh schema'}
          </Button>
        </div>
      </div>
    </div>
  )
}
