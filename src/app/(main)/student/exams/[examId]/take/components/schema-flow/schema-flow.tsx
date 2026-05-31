'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  Handle,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  Position,
  ReactFlow,
  applyNodeChanges,
  useEdgesState,
  useNodesState
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { ExecuteSqlResponse } from '@/lib/types'
import { executeSql } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/shared/spinner'
import { Eye, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/schema-flow/schema-flow.module.scss'

type HandleSide = 'left' | 'right'
type EdgeConfig = {
  source: string
  target: string
  sourceKey: string
  targetKey: string
}

type TableColumn = {
  name: string
  type: string
  key?: boolean
  hasSourceHandle?: boolean
  hasTargetHandle?: boolean
}

type TableNodeData = {
  name: string
  schema?: string
  schemaColor: string
  columns: TableColumn[]
}

function hashToColor(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  const hue = hash % 360
  return `hsl(${hue} 85% 80%)`
}

export function Markers() {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <marker
          id="hasOne"
          viewBox="0 0 6 6"
          markerHeight="6"
          markerWidth="6"
          refX="6"
          refY="3"
          fill="none"
        >
          <circle cx="3" cy="3" r="3" fill="#B1B1B6" />
        </marker>
      </defs>
      <defs>
        <marker
          id="hasOneSelected"
          viewBox="0 0 6 6"
          markerHeight="6"
          markerWidth="6"
          refX="6"
          refY="3"
          fill="none"
        >
          <circle cx="3" cy="3" r="3" fill="#2186EB" />
        </marker>
      </defs>
    </svg>
  )
}

export function KeyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={12}
      height={12}
      fill="#000"
      version="1.1"
      viewBox="0 0 485.017 485.017"
      xmlSpace="preserve"
      className={cn('key-icon', styles.keyIcon)}
    >
      <path d="M361.205 68.899c-14.663 0-28.447 5.71-38.816 16.078-21.402 21.403-21.402 56.228 0 77.631 10.368 10.368 24.153 16.078 38.815 16.078s28.447-5.71 38.816-16.078c21.402-21.403 21.402-56.228 0-77.631-10.368-10.368-24.153-16.078-38.815-16.078zm17.602 72.495c-4.702 4.702-10.953 7.292-17.603 7.292s-12.901-2.59-17.603-7.291c-9.706-9.706-9.706-25.499 0-35.205 4.702-4.702 10.953-7.291 17.603-7.291s12.9 2.589 17.603 7.291c9.706 9.706 9.706 25.498 0 35.204z"></path>
      <path d="M441.961 43.036C414.21 15.284 377.311 0 338.064 0c-39.248 0-76.146 15.284-103.897 43.036-42.226 42.226-54.491 105.179-32.065 159.698L.254 404.584l-.165 80.268 144.562.165v-55.722h55.705V373.59h55.705v-64.492l26.212-26.212c17.615 7.203 36.698 10.976 55.799 10.976 39.244 0 76.14-15.282 103.889-43.032 57.289-57.289 57.289-150.505 0-207.794zm-21.213 186.581c-22.083 22.083-51.445 34.245-82.676 34.245-18.133 0-36.237-4.265-52.353-12.333l-9.672-4.842-49.986 49.985v46.918h-55.705v55.705h-55.705v55.688l-84.5-.096.078-37.85L238.311 208.95l-4.842-9.672c-22.572-45.087-13.767-99.351 21.911-135.029C277.466 42.163 306.83 30 338.064 30c31.234 0 60.598 12.163 82.684 34.249 45.592 45.592 45.592 119.776 0 165.368z"></path>
    </svg>
  )
}

const TableNode = memo(({ data }: NodeProps<Node<TableNodeData>>) => {
  return (
    <div className="table table--interactive">
      <div
        className="table__name"
        style={{ backgroundColor: data.schemaColor }}
      >
        {data.schema ? `${data.schema}.${data.name}` : data.name}
      </div>
      <div className="table__columns">
        {data.columns.map((column) => (
          <div key={column.name} className="column-name">
            {column.hasSourceHandle && (
              <Handle
                type="source"
                position={Position.Right}
                id={`${column.name}-source-right`}
                className="right-handle source-handle"
              />
            )}
            {column.hasTargetHandle && (
              <Handle
                type="target"
                position={Position.Right}
                id={`${column.name}-target-right`}
                className="right-handle target-handle"
              />
            )}
            {column.hasSourceHandle && (
              <Handle
                type="source"
                position={Position.Left}
                id={`${column.name}-source-left`}
                className="left-handle source-handle"
              />
            )}
            {column.hasTargetHandle && (
              <Handle
                type="target"
                position={Position.Left}
                id={`${column.name}-target-left`}
                className="left-handle target-handle"
              />
            )}

            <div className="column-name__inner">
              <div className="column-name__name">
                {column.key && <KeyIcon />}
                {column.name}
              </div>
              <div className="column-name__type">{column.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
TableNode.displayName = 'TableNode'

const nodeTypes = { table: TableNode }

function calcSide(sourceX: number, targetX: number): HandleSide {
  return sourceX <= targetX ? 'right' : 'left'
}

function computeEdges(nodes: Node[], edgeConfigs: EdgeConfig[]): Edge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const edges: Edge[] = []

  for (const cfg of edgeConfigs) {
    const sourceNode = byId.get(cfg.source)
    const targetNode = byId.get(cfg.target)
    if (!sourceNode || !targetNode) continue

    const sourceSide = calcSide(sourceNode.position.x, targetNode.position.x)
    const targetSide: HandleSide = sourceSide === 'right' ? 'left' : 'right'

    edges.push({
      id: `${cfg.source}.${cfg.sourceKey}->${cfg.target}.${cfg.targetKey}`,
      source: cfg.source,
      target: cfg.target,
      sourceHandle: `${cfg.sourceKey}-source-${sourceSide}`,
      targetHandle: `${cfg.targetKey}-target-${targetSide}`,
      type: 'smoothstep',
      markerEnd: 'url(#hasOne)',
      className: 'has-one-edge'
    })
  }

  return edges
}

function buildInitial(schemaMeta: ExecuteSqlResponse['schema']) {
  if (!schemaMeta || schemaMeta.length === 0) {
    return {
      nodes: [] as Node[],
      edges: [] as Edge[],
      edgeConfigs: [] as EdgeConfig[]
    }
  }

  const edgeConfigs: EdgeConfig[] = []
  const tableNames = new Set(schemaMeta.map((t) => t.tableName))

  for (const t of schemaMeta) {
    for (const c of t.columns) {
      if (!c.foreignKey) continue
      if (!c.referencesTable || !c.referencesColumn) continue
      if (!tableNames.has(c.referencesTable)) continue
      edgeConfigs.push({
        source: t.tableName,
        target: c.referencesTable,
        sourceKey: c.columnName,
        targetKey: c.referencesColumn
      })
    }
  }

  const handleByTable = new Map<
    string,
    Map<string, { hasSource: boolean; hasTarget: boolean }>
  >()
  for (const e of edgeConfigs) {
    if (!handleByTable.has(e.source)) handleByTable.set(e.source, new Map())
    if (!handleByTable.has(e.target)) handleByTable.set(e.target, new Map())

    const sourceMap = handleByTable.get(e.source)!
    const targetMap = handleByTable.get(e.target)!

    const sourceHandle = sourceMap.get(e.sourceKey) ?? {
      hasSource: false,
      hasTarget: false
    }
    sourceHandle.hasSource = true
    sourceMap.set(e.sourceKey, sourceHandle)

    const targetHandle = targetMap.get(e.targetKey) ?? {
      hasSource: false,
      hasTarget: false
    }
    targetHandle.hasTarget = true
    targetMap.set(e.targetKey, targetHandle)
  }

  const nodes: Node[] = schemaMeta.map((t, idx) => {
    const col = idx % 3
    const row = Math.floor(idx / 3)
    const handleMap = handleByTable.get(t.tableName) ?? new Map()
    const columns: TableColumn[] = t.columns.map((c) => ({
      name: c.columnName,
      type: c.dataType,
      key: c.primaryKey,
      hasSourceHandle: Boolean(handleMap.get(c.columnName)?.hasSource),
      hasTargetHandle: Boolean(handleMap.get(c.columnName)?.hasTarget)
    }))

    return {
      id: t.tableName,
      type: 'table',
      position: { x: col * 340, y: row * 220 },
      data: {
        name: t.tableName,
        schema: undefined,
        schemaColor: hashToColor(t.tableName),
        columns
      }
    } satisfies Node
  })

  const edges = computeEdges(nodes, edgeConfigs)
  return { nodes, edges, edgeConfigs }
}

export function SchemaFlow({
  schemaMeta,
  examId,
  onSchemaMetaChange
}: {
  schemaMeta: ExecuteSqlResponse['schema']
  examId: number
  onSchemaMetaChange: (schema: ExecuteSqlResponse['schema']) => void
}) {
  const initial = useMemo(() => buildInitial(schemaMeta), [schemaMeta])
  const [nodes, setNodes] = useNodesState(initial.nodes)
  const [edges, setEdges] = useEdgesState(initial.edges)

  const { callApi } = useApi()

  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [rowsError, setRowsError] = useState<string | null>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [rowCount, setRowCount] = useState(0)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function escapeMsIdentifier(identifier: string) {
    return identifier.replaceAll(']', ']]')
  }

  function quoteMsTableName(tableName: string) {
    return `[${escapeMsIdentifier(tableName)}]`
  }

  function buildSelectTopSql(tableName: string, limit: number) {
    return `SELECT TOP ${limit} * FROM ${quoteMsTableName(tableName)}`
  }

  function buildDropSql(tableName: string) {
    return `DROP TABLE IF EXISTS ${quoteMsTableName(tableName)}`
  }

  const refreshRows = useCallback(
    async (tableName: string) => {
      setRowsLoading(true)
      setRowsError(null)
      setRows([])
      setColumns([])
      setRowCount(0)

      try {
        const sql = buildSelectTopSql(tableName, 50)
        const response = await callApi(executeSql(examId, { sql }), false)

        if (!response.data) {
          setRowsError(response.message || 'Không có dữ liệu')
          return
        }

        if (response.data.errorMessage) {
          setRowsError(response.data.errorMessage)
          return
        }

        const nextRows = response.data.resultSet ?? []
        setRows(nextRows)
        setRowCount(response.data.rowCount ?? nextRows.length)
        if (nextRows.length > 0) {
          setColumns(Object.keys(nextRows[0]))
        } else {
          setColumns([])
        }
      } finally {
        setRowsLoading(false)
      }
    },
    [callApi, examId]
  )

  useEffect(() => {
    if (!tableDialogOpen || !selectedTable) return

    let cancelled = false

    ;(async () => {
      try {
        await refreshRows(selectedTable)
      } catch (err) {
        if (cancelled) return
        if (err instanceof Error) setRowsError(err.message)
        else setRowsError('Không thể tải dữ liệu bảng')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [refreshRows, selectedTable, tableDialogOpen])

  useEffect(() => {
    setNodes(initial.nodes)
    setEdges(initial.edges)
  }, [initial.nodes, initial.edges, setNodes, setEdges])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds)
        setEdges(computeEdges(next, initial.edgeConfigs))
        return next
      })
    },
    [initial.edgeConfigs, setEdges, setNodes]
  )

  return (
    <div className={cn('Flow', styles.container)}>
      <Markers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid={true}
        snapGrid={[16, 16]}
        nodesConnectable={false}
        onNodesChange={onNodesChange}
        onNodeClick={(event, node) => {
          event.stopPropagation()
          const id = String(node.id)
          setSelectedTable(id)
          setDeleteDialogOpen(false)
          setTableDialogOpen(true)
        }}
      >
        <Background color="#aaa" gap={16} />
      </ReactFlow>

      <Dialog
        open={tableDialogOpen}
        onOpenChange={(open) => {
          setTableDialogOpen(open)
          if (!open) {
            setSelectedTable(null)
            setRowsError(null)
            setDeleteDialogOpen(false)
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] p-4 sm:w-full sm:max-w-[min(72rem,calc(100vw-2rem))] sm:p-6">
          <DialogHeader className="pr-10 sm:pr-8">
            <DialogTitle className="font-mono text-base">
              {selectedTable ?? 'Table'}
            </DialogTitle>
            <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (!selectedTable) return
                  void refreshRows(selectedTable)
                }}
                disabled={rowsLoading}
              >
                <RotateCcw className="h-4 w-4" />
                Làm mới
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={rowsLoading}
              >
                <Trash2 className="h-4 w-4" />
                Xóa bảng
              </Button>
            </div>
            <DialogDescription>
              Xem tối đa 50 dòng trong bảng.
            </DialogDescription>
          </DialogHeader>

          {rowsLoading ? (
            <div className="flex items-center gap-3 py-6">
              <Spinner />
              <span className="text-sm text-muted-foreground">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : rowsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <Eye className="mt-0.5 h-5 w-5 text-destructive" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Lỗi tải dữ liệu
                  </p>
                  <pre className="whitespace-pre-wrap text-xs text-destructive/80">
                    {rowsError}
                  </pre>
                </div>
              </div>
            </div>
          ) : columns.length > 0 ? (
            <ScrollArea className="mt-3 h-[min(420px,calc(100dvh-18rem))] rounded-md border border-border/60 bg-background">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {columns.map((c) => (
                      <th
                        key={c}
                        className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap sticky top-0 z-10 bg-muted/70 backdrop-blur"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border/50 transition-colors hover:bg-muted/30"
                    >
                      {columns.map((c) => (
                        <td
                          key={c}
                          className="px-3 py-2 whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis"
                          title={String(row[c] ?? '')}
                        >
                          {row[c] === null || row[c] === undefined ? (
                            <span className="italic text-muted-foreground">
                              NULL
                            </span>
                          ) : (
                            String(row[c])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          ) : (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Không có dữ liệu (hoặc bảng trống).
              {rowCount > 0 ? ` Tổng dòng: ${rowCount}.` : ''}
            </div>
          )}

          <div className="mt-3 text-[11px] text-muted-foreground">
            Dòng hiển thị: {rows.length} / {Math.max(rowCount, rows.length)}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bảng trong DB?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ chạy lệnh SQL DROP TABLE trong schema thi của
              bạn. Nếu không thành công, hệ thống sẽ báo lỗi.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting || !selectedTable}
              onClick={async () => {
                if (!selectedTable) return

                setDeleting(true)

                try {
                  const sql = buildDropSql(selectedTable)
                  const response = await callApi(
                    executeSql(examId, { sql }),
                    false
                  )

                  if (!response.data) {
                    const msg = response.message || 'Không thể xóa bảng'
                    toast.error(msg)
                    return
                  }

                  if (response.data.errorMessage) {
                    const msg = response.data.errorMessage
                    toast.error(msg)
                    return
                  }

                  onSchemaMetaChange(response.data.schema ?? null)
                  setDeleteDialogOpen(false)
                  setTableDialogOpen(false)
                  setSelectedTable(null)
                } catch (err) {
                  let msg = 'Không thể xóa bảng'
                  if (err instanceof Error) msg = err.message
                  toast.error(msg)
                } finally {
                  setDeleting(false)
                }
              }}
            >
              {deleting ? 'Đang xóa...' : 'Xóa thật'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
