'use client'

import { ArrowDown, ArrowUp, Plus, Table2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SpecificationEntity, SpecificationEntityAttribute } from '@/lib/types'

interface EntitiesEditorProps {
  entities: SpecificationEntity[]
  onAddEntity: () => void
  onRemoveEntity: (entityIndex: number) => void
  onMoveEntity: (entityIndex: number, direction: -1 | 1) => void
  onUpdateEntity: (
    entityIndex: number,
    field: keyof SpecificationEntity,
    value: string
  ) => void
  onAddAttribute: (entityIndex: number) => void
  onUpdateAttribute: (
    entityIndex: number,
    attributeIndex: number,
    field: keyof SpecificationEntityAttribute,
    value: string | boolean | number
  ) => void
  onRemoveAttribute: (entityIndex: number, attributeIndex: number) => void
}

export function EntitiesEditor({
  entities,
  onAddEntity,
  onRemoveEntity,
  onMoveEntity,
  onUpdateEntity,
  onAddAttribute,
  onUpdateAttribute,
  onRemoveAttribute
}: EntitiesEditorProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border/80 bg-background/30 p-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Table2 className="h-4 w-4 text-primary" />
            Entities
          </label>
          <p className="text-xs text-muted-foreground">
            Tạo cấu trúc bảng và các thuộc tính.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddEntity}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm entity
        </Button>
      </div>

      {entities.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
          Chưa có entity nào. Hãy thêm entity đầu tiên để định nghĩa cấu trúc
          bảng.
        </p>
      ) : (
        <div className="space-y-4">
          {entities.map((entity, entityIndex) => (
            <article
              key={`${entityIndex}-${entity.orderIndex}`}
              className="space-y-3 rounded-xl border border-border/80 bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  Entity #{entityIndex + 1}
                </span>
                <input
                  type="text"
                  value={entity.entityName}
                  onChange={(e) =>
                    onUpdateEntity(entityIndex, 'entityName', e.target.value)
                  }
                  placeholder="entityName"
                  className="flex h-9 min-w-[190px] flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  type="text"
                  value={entity.displayName ?? ''}
                  onChange={(e) =>
                    onUpdateEntity(entityIndex, 'displayName', e.target.value)
                  }
                  placeholder="displayName"
                  className="flex h-9 min-w-[190px] flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onMoveEntity(entityIndex, -1)}
                  disabled={entityIndex === 0}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onMoveEntity(entityIndex, 1)}
                  disabled={entityIndex === entities.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onRemoveEntity(entityIndex)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <textarea
                value={entity.description ?? ''}
                onChange={(e) =>
                  onUpdateEntity(entityIndex, 'description', e.target.value)
                }
                rows={2}
                placeholder="description"
                className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                {(entity.attributes ?? []).map((attribute, attributeIndex) => (
                  <div
                    key={`${entityIndex}-${attributeIndex}`}
                    className="space-y-2 rounded-md border border-border bg-background p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={attribute.attributeName}
                        onChange={(e) =>
                          onUpdateAttribute(
                            entityIndex,
                            attributeIndex,
                            'attributeName',
                            e.target.value
                          )
                        }
                        placeholder="attributeName"
                        className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <input
                        type="text"
                        value={attribute.dataType}
                        onChange={(e) =>
                          onUpdateAttribute(
                            entityIndex,
                            attributeIndex,
                            'dataType',
                            e.target.value
                          )
                        }
                        placeholder="dataType"
                        className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <input
                      type="text"
                      value={attribute.description ?? ''}
                      onChange={(e) =>
                        onUpdateAttribute(
                          entityIndex,
                          attributeIndex,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder="description"
                      className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={attribute.isPrimaryKey}
                            onChange={(e) =>
                              onUpdateAttribute(
                                entityIndex,
                                attributeIndex,
                                'isPrimaryKey',
                                e.target.checked
                              )
                            }
                          />
                          PK
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={attribute.isNullable}
                            onChange={(e) =>
                              onUpdateAttribute(
                                entityIndex,
                                attributeIndex,
                                'isNullable',
                                e.target.checked
                              )
                            }
                          />
                          NULL
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() =>
                          onRemoveAttribute(entityIndex, attributeIndex)
                        }
                        disabled={(entity.attributes ?? []).length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddAttribute(entityIndex)}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm attribute
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
