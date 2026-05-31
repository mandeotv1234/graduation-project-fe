import { Plus, Table as TableIcon, FileSpreadsheet, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBuilderContext } from './builder-context'

export function Sidebar() {
  const {
    tables,
    datasets,
    activeView,
    setActiveView,
    addTable,
    addDataset,
    deleteTable,
    deleteDataset
  } = useBuilderContext()

  return (
    <div className="w-64 bg-white border-r flex flex-col">
      <ScrollArea className="flex-1">
        {/* Schema Section */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-medium text-sm text-neutral-500 uppercase tracking-wider">
            Schema
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={addTable}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-2 space-y-1 border-b">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => setActiveView({ type: 'schema', id: table.id })}
              className={`group w-full flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer select-none ${
                activeView.type === 'schema' && activeView.id === table.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0 text-left pointer-events-none">
                <TableIcon className="w-4 h-4 opacity-50 shrink-0" />
                <span className="truncate">{table.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteTable(table.id)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-5 w-5 flex items-center justify-center rounded text-neutral-400 hover:text-red-500 hover:bg-red-50"
                title="Delete table"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Datasets Section */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-medium text-sm text-neutral-500 uppercase tracking-wider">
            Datasets
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={addDataset}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-2 space-y-1">
          {datasets.map((ds) => (
            <div
              key={ds.id}
              onClick={() => setActiveView({ type: 'dataset', id: ds.id })}
              className={`group w-full flex items-start gap-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer select-none ${
                activeView.type === 'dataset' && activeView.id === ds.id
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0 text-left pointer-events-none">
                <FileSpreadsheet className="mt-0.5 w-4 h-4 opacity-50 shrink-0" />
                <span className="min-w-0 break-words leading-snug">
                  {ds.name}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteDataset(ds.id)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-5 w-5 flex items-center justify-center rounded text-neutral-400 hover:text-red-500 hover:bg-red-50"
                title="Delete dataset"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
