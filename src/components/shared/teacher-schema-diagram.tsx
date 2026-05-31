'use client'

import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Background,
  Handle,
  type Edge,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type EdgeChange,
  applyEdgeChanges
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { ExecuteSqlResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

type HandleSide = 'left' | 'right'
export type EdgeConfig = {
  source: string
  target: string
  sourceKey: string
  targetKey: string
}

export type TableColumn = {
  name: string
  type: string
  key?: boolean
  handleType?: 'source' | 'target'
}

export type TableNodeData = {
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
      className="key-icon"
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
            {column.handleType && (
              <Handle
                type={column.handleType}
                position={Position.Right}
                id={`${column.name}-right`}
                className={
                  column.handleType === 'source'
                    ? 'right-handle source-handle'
                    : 'right-handle target-handle'
                }
              />
            )}
            {column.handleType && (
              <Handle
                type={column.handleType}
                position={Position.Left}
                id={`${column.name}-left`}
                className={
                  column.handleType === 'source'
                    ? 'left-handle source-handle'
                    : 'left-handle target-handle'
                }
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

export function calcSide(sourceX: number, targetX: number): HandleSide {
  return sourceX <= targetX ? 'right' : 'left'
}

export function computeEdges(nodes: Node[], edgeConfigs: EdgeConfig[]): Edge[] {
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
      sourceHandle: `${cfg.sourceKey}-${sourceSide}`,
      targetHandle: `${cfg.targetKey}-${targetSide}`,
      type: 'smoothstep',
      markerEnd: 'url(#hasOne)',
      className: 'has-one-edge'
    })
  }

  return edges
}

export function buildInitialSchemaDiagram(
  schemaMeta: ExecuteSqlResponse['schema']
) {
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

  const handleByTable = new Map<string, Map<string, 'source' | 'target'>>()
  for (const e of edgeConfigs) {
    if (!handleByTable.has(e.source)) handleByTable.set(e.source, new Map())
    if (!handleByTable.has(e.target)) handleByTable.set(e.target, new Map())
    handleByTable.get(e.source)!.set(e.sourceKey, 'source')
    handleByTable.get(e.target)!.set(e.targetKey, 'target')
  }

  const nodes: Node[] = schemaMeta.map((t, idx) => {
    const col = idx % 3
    const row = Math.floor(idx / 3)
    const handleMap = handleByTable.get(t.tableName) ?? new Map()
    const columns: TableColumn[] = (t.columns ?? []).map((c) => ({
      name: c.columnName,
      type: c.dataType,
      key: c.primaryKey,
      handleType: handleMap.get(c.columnName)
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

export type SchemaDiagramData = {
  nodes: Node[]
  edges: Edge[]
  edgeConfigs: EdgeConfig[]
}

export interface TeacherSchemaDiagramProps {
  diagramData: string
  onChange?: (data: string) => void
  readOnly?: boolean
  className?: string
}

export function TeacherSchemaDiagram({
  diagramData,
  onChange,
  readOnly = false,
  className
}: TeacherSchemaDiagramProps) {
  const parsedData = useMemo<SchemaDiagramData | null>(() => {
    try {
      if (!diagramData) return null
      return JSON.parse(diagramData) as SchemaDiagramData
    } catch {
      return null
    }
  }, [diagramData])

  const [nodes, setNodes, onNodesChange] = useNodesState(
    parsedData?.nodes ?? []
  )
  const [edges, setEdges] = useEdgesState(parsedData?.edges ?? [])

  const edgeConfigsRef = useRef<EdgeConfig[]>(parsedData?.edgeConfigs ?? [])

  useEffect(() => {
    if (parsedData) {
      setNodes(parsedData.nodes)
      setEdges(parsedData.edges)
      edgeConfigsRef.current = parsedData.edgeConfigs
    } else {
      setNodes([])
      setEdges([])
      edgeConfigsRef.current = []
    }
  }, [parsedData, setNodes, setEdges])

  const onNodeDragStop = useCallback(() => {
    if (readOnly || !onChange) return

    setNodes((currentNodes) => {
      const newEdges = computeEdges(currentNodes, edgeConfigsRef.current)
      setEdges(newEdges)

      onChange(
        JSON.stringify({
          nodes: currentNodes,
          edges: newEdges,
          edgeConfigs: edgeConfigsRef.current
        })
      )

      return currentNodes
    })
  }, [onChange, readOnly, setEdges, setNodes])

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) return
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [readOnly, setEdges]
  )

  return (
    <div
      className={cn(
        'Flow w-full h-[500px] border border-border rounded-md bg-muted/20 relative',
        className
      )}
    >
      <Markers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView={!parsedData}
        snapToGrid={true}
        snapGrid={[16, 16]}
        nodesConnectable={false}
        nodesDraggable={!readOnly}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        minZoom={0.2}
      >
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  )
}
