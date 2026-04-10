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
  const [scriptDraft, setScriptDraft] = useState('')
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    datasets,
    selectedDatasetForSQL,
    setSelectedDatasetForSQL,
    handleGenerateSQL: generateSQL,
    handleSyncSchemaFromDdlScript,
    handleVerifyAndCreate,
    handleGenerateByAiAssist,
    isAiGenerating,
    isSyncingFromScript,
    isEditMode
  } = useBuilderContext()

  const generatedScript = generateSQL()
  useEffect(() => {
    setScriptDraft(generatedScript)
  }, [generatedScript])

  return (
    <div className="bg-white border-b shrink-0">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              Database Schema Builder
            </h1>
            <p className="text-sm text-neutral-500">
              Thiết kế Schema và tạo các Dataset độc lập.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 mr-4 border-r pr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
              View SQL Script
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[90vw] w-[90vw] max-h-[92vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Generated SQL Script</DialogTitle>
                <DialogDescription>
                  Có thể chỉnh sửa script và đồng bộ ngược lại UI builder.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-3 py-2">
                <Label>Include Data from Dataset:</Label>
                <Select
                  value={selectedDatasetForSQL}
                  onValueChange={(val) => val && setSelectedDatasetForSQL(val)}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Schema Only)</SelectItem>
                    {datasets.map((ds) => (
                      <SelectItem key={ds.id} value={ds.id}>
                        {ds.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="min-h-0 h-[60vh] max-h-[60vh] bg-neutral-950 text-neutral-50 p-4 rounded-md font-mono text-sm">
                <Textarea
                  value={scriptDraft}
                  onChange={(e) => setScriptDraft(e.target.value)}
                  className="min-h-[58vh] resize-none border-0 bg-transparent font-mono text-xs text-neutral-100 focus-visible:ring-0"
                />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => handleSyncSchemaFromDdlScript(scriptDraft)}
                  disabled={isSyncingFromScript || !scriptDraft.trim()}
                >
                  {isSyncingFromScript
                    ? 'Đang đồng bộ...'
                    : 'Áp dụng script vào UI'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={handleVerifyAndCreate} className="gap-2">
            <Play className="w-4 h-4" />
            {isEditMode ? 'Verify & Update' : 'Verify & Create'}
          </Button>
        </div>
      </header>

      <div className="bg-linear-to-r from-blue-50/60 to-indigo-50/40 px-6 py-4">
        <div className="flex w-full items-center gap-3 rounded-lg bg-white/80 p-2">
          <Input
            placeholder="Mô tả yêu cầu để AI cập nhật schema..."
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
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
            <Sparkles className="w-4 h-4" />
            {isAiGenerating ? 'Đang xử lý...' : 'Sinh schema'}
          </Button>
        </div>
      </div>
    </div>
  )
}
