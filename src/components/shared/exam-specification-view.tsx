'use client'

import { ExamSpecification, SpecAttribute, SpecEntity } from '@/lib/types'
import { ChevronDown, ChevronUp, Database, Key, Link2 } from 'lucide-react'
import { useState } from 'react'

interface ExamSpecificationViewProps {
  specification: ExamSpecification
  compact?: boolean
  showDatasets?: boolean
  inferRelations?: boolean
}

// ---------------------------------------------------------------------------
// Data-type colour tokens
// ---------------------------------------------------------------------------
const DT_COLOR: Record<string, string> = {
  INT: 'text-blue-600 dark:text-blue-400',
  INTEGER: 'text-blue-600 dark:text-blue-400',
  BIGINT: 'text-blue-500 dark:text-blue-300',
  SMALLINT: 'text-blue-600 dark:text-blue-400',
  TINYINT: 'text-blue-600 dark:text-blue-400',
  VARCHAR: 'text-emerald-600 dark:text-emerald-400',
  CHAR: 'text-emerald-600 dark:text-emerald-400',
  NVARCHAR: 'text-emerald-600 dark:text-emerald-400',
  NCHAR: 'text-emerald-600 dark:text-emerald-400',
  TEXT: 'text-emerald-600 dark:text-emerald-400',
  NTEXT: 'text-emerald-600 dark:text-emerald-400',
  DECIMAL: 'text-violet-600 dark:text-violet-400',
  NUMERIC: 'text-violet-600 dark:text-violet-400',
  FLOAT: 'text-violet-600 dark:text-violet-400',
  REAL: 'text-violet-600 dark:text-violet-400',
  MONEY: 'text-violet-600 dark:text-violet-400',
  DATE: 'text-amber-600 dark:text-amber-400',
  DATETIME: 'text-amber-600 dark:text-amber-400',
  TIME: 'text-amber-600 dark:text-amber-400',
  BIT: 'text-pink-600 dark:text-pink-400',
  BOOLEAN: 'text-pink-600 dark:text-pink-400'
}

function dtColor(dt: string): string {
  const base = dt.toUpperCase().split('(')[0].trim()
  return DT_COLOR[base] || 'text-muted-foreground'
}

// ---------------------------------------------------------------------------
// Relationship detection — heuristic: attribute name in table A matches the
// PK attribute name of table B (case-insensitive), or ends with the PK name.
// ---------------------------------------------------------------------------
interface Relation {
  fromEntity: string // entity that has the FK column
  fromAttr: string
  toEntity: string // entity whose PK is referenced
  toAttr: string
}

function detectRelations(entities: SpecEntity[]): Relation[] {
  const relations: Relation[] = []
  // Map entityName -> primary keys
  const pkMap: Record<string, string[]> = {}
  for (const e of entities) {
    pkMap[e.entityName] = (e.attributes ?? [])
      .filter((a) => a.isPrimaryKey)
      .map((a) => a.attributeName.toUpperCase())
  }

  for (const entity of entities) {
    for (const attr of entity.attributes ?? []) {
      if (attr.isPrimaryKey) continue // PK is never a FK in our heuristic
      const attrUp = attr.attributeName.toUpperCase()
      for (const other of entities) {
        if (other.entityName === entity.entityName) continue
        for (const pk of pkMap[other.entityName] ?? []) {
          if (attrUp === pk || attrUp.endsWith(pk)) {
            relations.push({
              fromEntity: entity.entityName,
              fromAttr: attr.attributeName,
              toEntity: other.entityName,
              toAttr: attr.attributeName
            })
          }
        }
      }
    }
  }
  return relations
}

// ---------------------------------------------------------------------------
// FK badge helpers
// ---------------------------------------------------------------------------
function isForeignKey(
  attr: SpecAttribute,
  entityName: string,
  relations: Relation[]
): Relation | undefined {
  return relations.find(
    (r) => r.fromEntity === entityName && r.fromAttr === attr.attributeName
  )
}

// ---------------------------------------------------------------------------
// Single entity card — ERD style
// ---------------------------------------------------------------------------
function EntityCard({
  entity,
  relations,
  compact
}: {
  entity: SpecEntity
  relations: Relation[]
  compact: boolean
}) {
  const attrs = [...(entity.attributes ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )

  return (
    <div className="rounded-xs border-2 border-border bg-card overflow-hidden">
      {/* ── Table header bar ── */}
      <div className="flex items-center gap-2 bg-primary/10 dark:bg-primary/15 px-3 py-2 border-b-2 border-primary/20">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/20">
          <Database className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="font-bold text-sm text-primary font-mono tracking-wide">
          {entity.entityName}
        </span>
        {entity.displayName && entity.displayName !== entity.entityName && (
          <span className="ml-1 text-xs text-muted-foreground font-sans font-normal">
            {entity.displayName}
          </span>
        )}
      </div>

      {/* ── Entity description ── */}
      {entity.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-b border-border italic leading-relaxed">
          {entity.description}
        </div>
      )}

      {/* ── Attributes ── */}
      {attrs.length > 0 && (
        <div className="divide-y divide-border/60">
          {attrs.map((attr) => {
            const fk = isForeignKey(attr, entity.entityName, relations)
            const isPK = attr.isPrimaryKey
            const rowBg = isPK
              ? 'bg-amber-50/80 dark:bg-amber-900/10'
              : fk
                ? 'bg-blue-50/50 dark:bg-blue-900/10'
                : ''

            return (
              <div
                key={attr.id ?? attr.attributeName}
                className={`flex items-start gap-2 px-3 py-1.5 ${rowBg}`}
              >
                {/* Icon column */}
                <div className="flex w-4 shrink-0 items-center justify-center pt-0.5">
                  {isPK ? (
                    <Key className="h-3 w-3 text-amber-500" />
                  ) : fk ? (
                    <Link2 className="h-3 w-3 text-blue-500" />
                  ) : (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-border" />
                  )}
                </div>

                <div className="grid min-w-0 flex-1 grid-cols-[minmax(120px,1.2fr)_minmax(120px,0.9fr)_minmax(140px,1fr)_auto] items-start gap-2 text-[11px]">
                  <span
                    className={`min-w-0 font-mono text-xs font-semibold ${
                      isPK
                        ? 'text-amber-700 dark:text-amber-400 underline decoration-dotted underline-offset-2'
                        : fk
                          ? 'text-blue-700 dark:text-blue-400 underline decoration-dotted underline-offset-2'
                          : 'text-foreground'
                    }`}
                  >
                    {attr.attributeName}
                  </span>

                  <span
                    className={`min-w-0 font-mono ${dtColor(attr.dataType)}`}
                  >
                    {attr.dataType}
                  </span>

                  <span className="min-w-0 leading-relaxed text-muted-foreground">
                    {attr.description || '-'}
                  </span>

                  {attr.isNullable === false && (
                    <span className="shrink-0 rounded px-1 py-0 text-[9px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                      NN
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FK legend lines at bottom of card ── */}
      {!compact &&
        (() => {
          const outgoing = relations.filter(
            (r) => r.fromEntity === entity.entityName
          )
          if (outgoing.length === 0) return null
          return (
            <div className="border-t border-dashed border-border/60 bg-muted/20 px-3 py-1.5 space-y-0.5">
              {outgoing.map((r) => (
                <p
                  key={r.fromAttr}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground"
                >
                  <Link2 className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                  <span className="font-mono text-blue-700 dark:text-blue-400">
                    {r.fromAttr}
                  </span>
                  <span>→</span>
                  <span className="font-mono text-primary">{r.toEntity}</span>
                </p>
              ))}
            </div>
          )
        })()}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Collapsible Section Helper
// ---------------------------------------------------------------------------
function CollapsibleSection({
  title,
  children,
  defaultOpen = false
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xs shadow-sm bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-muted/20 px-4 py-2.5 hover:bg-muted/80 transition-colors"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 border-t border-border/50 animate-in fade-in slide-in-from-top-1">
          {children}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------
export function ExamSpecificationView({
  specification,
  compact = false,
  showDatasets = true,
  inferRelations = true
}: ExamSpecificationViewProps) {
  const mappedEntities = specification.entities ?? []
  let relations: Relation[] = []

  if (inferRelations) {
    relations = detectRelations(mappedEntities)
  }

  const sorted = [...mappedEntities].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
  )

  const hasPrimaryKeys = sorted.some((entity) =>
    (entity.attributes ?? []).some((attribute) => attribute.isPrimaryKey)
  )
  const hasNotNull = sorted.some((entity) =>
    (entity.attributes ?? []).some(
      (attribute) => attribute.isNullable === false
    )
  )

  return (
    <div className="space-y-4">
      {/* ── Spec header ── */}
      <div className="px-4 py-3 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-foreground leading-tight">
            {specification.name}
          </h3>
        </div>
        {specification.description && (
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {specification.description}
          </p>
        )}
      </div>

      {showDatasets && !!specification.datasets?.length && (
        <CollapsibleSection
          title={`Datasets (${specification.datasets.length})`}
        >
          <div className="space-y-2">
            {specification.datasets
              ?.slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((dataset, index) => (
                <div
                  key={`${dataset.name}-${dataset.orderIndex}-${index}`}
                  className="rounded-md border border-border bg-muted/20 p-2 space-y-1"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-foreground">
                      {dataset.name}
                    </span>
                    <span className="text-muted-foreground">
                      #{dataset.orderIndex}
                    </span>
                    {!dataset.isActive && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                  {dataset.dataScript && (
                    <pre className="max-h-40 overflow-auto rounded bg-background p-2 text-[11px] font-mono whitespace-pre-wrap text-foreground">
                      {dataset.dataScript}
                    </pre>
                  )}
                </div>
              ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Relation summary legend ── */}
      {relations.length > 0 && !compact && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 px-3 py-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
            Liên kết bảng
          </p>
          {relations.map((r) => (
            <div
              key={`${r.fromEntity}-${r.fromAttr}`}
              className="flex items-center gap-1 text-[11px]"
            >
              <span className="font-mono font-semibold text-primary">
                {r.fromEntity}
              </span>
              <span className="font-mono text-blue-500">({r.fromAttr})</span>
              <span className="text-muted-foreground mx-1">→</span>
              <span className="font-mono font-semibold text-primary">
                {r.toEntity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Entity cards grid ── */}
      <div className={compact ? 'space-y-3' : 'grid gap-4 sm:grid-cols-2'}>
        {sorted.map((entity) => (
          <EntityCard
            key={entity.id ?? entity.entityName}
            entity={entity}
            relations={relations}
            compact={compact}
          />
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mr-1">
          Chú thích:
        </span>
        {hasPrimaryKeys && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Key className="h-3 w-3 text-amber-500" /> Khóa chính (PK)
          </span>
        )}
        {relations.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Link2 className="h-3 w-3 text-blue-500" /> Khóa ngoại (FK)
          </span>
        )}
        {hasNotNull && (
          <span className="flex items-center gap-1 text-[11px]">
            <span className="rounded px-1 text-[9px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              NN
            </span>
            <span className="text-muted-foreground">NOT NULL</span>
          </span>
        )}
      </div>
    </div>
  )
}
