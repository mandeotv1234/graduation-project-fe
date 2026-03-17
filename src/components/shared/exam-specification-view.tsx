'use client'

import { ExamSpecification, SpecAttribute, SpecEntity } from '@/lib/types'
import { Database, Key, Link2 } from 'lucide-react'

interface ExamSpecificationViewProps {
  specification: ExamSpecification
  compact?: boolean
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
    <div className="rounded-xl border-2 border-border bg-card shadow-sm overflow-hidden">
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

                {/* Attribute name */}
                <span
                  className={`min-w-0 shrink-0 font-mono text-xs font-semibold ${
                    isPK
                      ? 'text-amber-700 dark:text-amber-400 underline decoration-dotted underline-offset-2'
                      : fk
                        ? 'text-blue-700 dark:text-blue-400 underline decoration-dotted underline-offset-2'
                        : 'text-foreground'
                  }`}
                >
                  {attr.attributeName}
                </span>

                {/* Spacer */}
                <span className="flex-1" />

                {/* Data type chip */}
                <span
                  className={`shrink-0 font-mono text-[11px] ${dtColor(attr.dataType)}`}
                >
                  {attr.dataType}
                </span>

                {/* NOT NULL / NULL tag */}
                {!attr.isNullable && (
                  <span className="shrink-0 rounded px-1 py-0 text-[9px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                    NN
                  </span>
                )}
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
// Main exported component
// ---------------------------------------------------------------------------
export function ExamSpecificationView({
  specification,
  compact = false
}: ExamSpecificationViewProps) {
  const sorted = [...(specification.entities ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )
  const relations = detectRelations(sorted)

  return (
    <div className="space-y-4">
      {/* ── Spec header ── */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-bold text-sm text-foreground leading-tight">
            {specification.name ?? specification.title}
          </h3>
        </div>
        {specification.description && (
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap pl-6">
            {specification.description}
          </p>
        )}
      </div>

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
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mr-1">
          Chú thích:
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Key className="h-3 w-3 text-amber-500" /> Khóa chính (PK)
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Link2 className="h-3 w-3 text-blue-500" /> Khóa ngoại (FK)
        </span>
        <span className="flex items-center gap-1 text-[11px]">
          <span className="rounded px-1 text-[9px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
            NN
          </span>
          <span className="text-muted-foreground">NOT NULL</span>
        </span>
      </div>
    </div>
  )
}
