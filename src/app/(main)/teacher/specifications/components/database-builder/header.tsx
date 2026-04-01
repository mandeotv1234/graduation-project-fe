import { Database, Play, Undo2, Redo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

export function Header() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    datasets,
    selectedDatasetForSQL,
    setSelectedDatasetForSQL,
    handleGenerateSQL: generateSQL,
    handleVerifyAndCreate,
    isEditMode
  } = useBuilderContext()

  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
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
                This script is generated from your visual configuration and will
                be sent to the backend.
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
              <pre className="whitespace-pre-wrap wrap-break-word">
                {generateSQL()}
              </pre>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <Button onClick={handleVerifyAndCreate} className="gap-2">
          <Play className="w-4 h-4" />
          {isEditMode ? 'Verify & Update' : 'Verify & Create'}
        </Button>
      </div>
    </header>
  )
}
