'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  BookOpenCheck,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  Play,
  Save,
  Table2,
  Trash2
} from 'lucide-react'

import { DatasetTableView } from '@/components/shared/dataset-table-view'
import { EntitiesEditor } from '@/components/shared/entities-editor'
import { RichTextEditor } from '@/components/shared/rich-text-editor'
import { TeacherSchemaDiagram } from '@/components/shared/teacher-schema-diagram'
import { TeacherSqlEditor } from '@/components/shared/teacher-sql-editor'
import {
  type AttachmentItem,
  BLOCK_REGISTRY,
  type BlockKind,
  createBlockId,
  createBlocksFromSpecification,
  createEmptyAttribute,
  createEmptyEntity,
  createInitialBlocks,
  formatFileSize,
  normalizeEntities,
  type ExamBlock,
  type RichTextBlock,
  type SqlDdlBlock,
  type SqlDmlBlock,
  type TableDescriptionBlock,
  type SchemaDiagramBlock
} from './common-part-blocks'
import { mapDatasetBlocksToSavePayload } from './common-part-export.domain'
import { ScriptPickerDialog } from './script-picker-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApi } from '@/hooks/use-api'
import { executeSql, saveExamSpecification } from '@/lib/actions'
import {
  ExamSpecification,
  SaveExamSpecificationRequest,
  SpecificationEntity,
  SpecificationEntityAttribute
} from '@/lib/types'
import { toast } from 'sonner'
import { useSchemaExport } from '../hooks/use-schema-export'
import { useDatasetExport } from '../hooks/use-dataset-export'

interface CreateExamFormProps {
  examId?: number
  initialSpecification?: ExamSpecification | null
}

export default function CreateExamForm({
  examId,
  initialSpecification
}: CreateExamFormProps) {
  const { callApi } = useApi()
  const normalizedExamId =
    typeof examId === 'number' && Number.isFinite(examId) && examId > 0
      ? examId
      : null
  const hasValidExamId = normalizedExamId !== null
  const [showStudentPreview, setShowStudentPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<ExamBlock[]>(() =>
    initialSpecification
      ? createBlocksFromSpecification(initialSpecification)
      : createInitialBlocks()
  )

  const executeSqlInCurrentExam = useCallback(
    async (sql: string) => {
      if (!hasValidExamId || normalizedExamId === null) {
        return undefined
      }

      const result = await callApi(executeSql(normalizedExamId, { sql }), false)
      return result.data
    },
    [hasValidExamId, normalizedExamId, callApi]
  )

  const schemaExport = useSchemaExport({
    blocks,
    executeSqlInExam: executeSqlInCurrentExam,
    setBlocks
  })

  const datasetExport = useDatasetExport({
    blocks,
    executeSqlInExam: executeSqlInCurrentExam,
    setBlocks
  })

  const visibleBlocks = useMemo(() => {
    if (!showStudentPreview) {
      return blocks
    }

    return blocks.filter((block) => block.visibleToStudent)
  }, [blocks, showStudentPreview])

  const updateBlockById = (
    blockId: string,
    updater: (block: ExamBlock) => ExamBlock
  ) => {
    setBlocks((prev) =>
      prev.map((item) => (item.id === blockId ? updater(item) : item))
    )
  }

  const addBlock = (kind: BlockKind) => {
    const definition = BLOCK_REGISTRY.find((item) => item.kind === kind)
    if (!definition) {
      return
    }

    setBlocks((prev) => [...prev, definition.createBlock()])
    toast.success(`Đã thêm: ${definition.label}`)
  }

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((item) => item.id !== blockId))
    toast.success('Đã xóa khối nội dung')
  }

  const addAttachmentFiles = (blockId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return
    }

    const newItems: AttachmentItem[] = Array.from(fileList).map((file) => ({
      id: createBlockId(),
      name: file.name,
      size: file.size,
      type: file.type
    }))

    updateBlockById(blockId, (block) => {
      if (block.kind !== 'attachment') {
        return block
      }

      return {
        ...block,
        data: {
          files: [...block.data.files, ...newItems]
        }
      }
    })
  }

  const removeAttachment = (blockId: string, attachmentId: string) => {
    updateBlockById(blockId, (block) => {
      if (block.kind !== 'attachment') {
        return block
      }

      return {
        ...block,
        data: {
          files: block.data.files.filter((item) => item.id !== attachmentId)
        }
      }
    })
  }

  const updateTableBlockEntities = (
    blockId: string,
    updater: (entities: SpecificationEntity[]) => SpecificationEntity[]
  ) => {
    updateBlockById(blockId, (block) => {
      if (block.kind !== 'table-description') {
        return block
      }

      return {
        ...block,
        data: {
          entities: normalizeEntities(updater(block.data.entities))
        }
      }
    })
  }

  const addTableEntity = (blockId: string) => {
    updateTableBlockEntities(blockId, (entities) => [
      ...entities,
      createEmptyEntity(entities.length + 1)
    ])
  }

  const removeTableEntity = (blockId: string, entityIndex: number) => {
    updateTableBlockEntities(blockId, (entities) =>
      entities.filter((_, index) => index !== entityIndex)
    )
  }

  const moveTableEntity = (
    blockId: string,
    entityIndex: number,
    direction: -1 | 1
  ) => {
    updateTableBlockEntities(blockId, (entities) => {
      const target = entityIndex + direction
      if (target < 0 || target >= entities.length) {
        return entities
      }

      const next = [...entities]
      ;[next[entityIndex], next[target]] = [next[target], next[entityIndex]]
      return next
    })
  }

  const updateTableEntity = (
    blockId: string,
    entityIndex: number,
    field: keyof SpecificationEntity,
    value: string
  ) => {
    updateTableBlockEntities(blockId, (entities) =>
      entities.map((entity, index) =>
        index === entityIndex ? { ...entity, [field]: value } : entity
      )
    )
  }

  const addTableAttribute = (blockId: string, entityIndex: number) => {
    updateTableBlockEntities(blockId, (entities) =>
      entities.map((entity, index) => {
        if (index !== entityIndex) {
          return entity
        }

        return {
          ...entity,
          attributes: [
            ...(entity.attributes ?? []),
            createEmptyAttribute((entity.attributes ?? []).length + 1)
          ]
        }
      })
    )
  }

  const updateTableAttribute = (
    blockId: string,
    entityIndex: number,
    attributeIndex: number,
    field: keyof SpecificationEntityAttribute,
    value: string | boolean | number
  ) => {
    updateTableBlockEntities(blockId, (entities) =>
      entities.map((entity, eIndex) => {
        if (eIndex !== entityIndex) {
          return entity
        }

        return {
          ...entity,
          attributes: (entity.attributes ?? []).map((attribute, aIndex) =>
            aIndex === attributeIndex
              ? { ...attribute, [field]: value }
              : attribute
          )
        }
      })
    )
  }

  const removeTableAttribute = (
    blockId: string,
    entityIndex: number,
    attributeIndex: number
  ) => {
    updateTableBlockEntities(blockId, (entities) =>
      entities.map((entity, index) => {
        if (index !== entityIndex) {
          return entity
        }

        const nextAttributes = (entity.attributes ?? []).filter(
          (_, aIndex) => aIndex !== attributeIndex
        )

        return {
          ...entity,
          attributes: nextAttributes
        }
      })
    )
  }

  const saveCommonPart = async () => {
    if (!hasValidExamId || normalizedExamId === null) {
      toast.error('Không tìm thấy examId để lưu phần đề chung')
      return
    }

    const hasUnsupportedAttachments = blocks.some(
      (block) => block.kind === 'attachment' && block.data.files.length > 0
    )

    if (hasUnsupportedAttachments) {
      toast.error(
        'Khối Hình ảnh/Tài liệu chưa hỗ trợ lưu xuống DB. Vui lòng xóa trước khi lưu.'
      )
      return
    }

    const ddlBlock = blocks.find(
      (block): block is SqlDdlBlock => block.kind === 'sql-ddl'
    )
    const ddlScript = ddlBlock?.data.sql?.trim() ?? ''

    if (!ddlScript) {
      toast.error('Vui lòng nhập SQL DDL trước khi lưu')
      return
    }

    const richTextDescription = blocks
      .filter((block): block is RichTextBlock => block.kind === 'rich-text')
      .map((block) => block.data.content?.trim())
      .filter((content): content is string => Boolean(content))
      .join('\n\n')

    const tableEntities = blocks
      .filter(
        (block): block is TableDescriptionBlock =>
          block.kind === 'table-description'
      )
      .flatMap((block) => block.data.entities ?? [])

    const normalizedTableEntities = normalizeEntities(tableEntities)

    const sanitizedEntities = normalizedTableEntities
      .map((entity) => ({
        ...entity,
        entityName: entity.entityName?.trim() ?? '',
        displayName: entity.displayName?.trim() ?? '',
        description: entity.description?.trim() ?? '',
        attributes: (entity.attributes ?? []).map((attribute) => ({
          ...attribute,
          attributeName: attribute.attributeName?.trim() ?? '',
          dataType: attribute.dataType?.trim() ?? '',
          description: attribute.description?.trim() ?? ''
        }))
      }))
      .filter((entity) => {
        const allAttributesEmpty = (entity.attributes ?? []).every(
          (attribute) => !attribute.attributeName && !attribute.dataType
        )
        return entity.entityName.length > 0 || !allAttributesEmpty
      })

    const hasInvalidEntity = sanitizedEntities.some(
      (entity) =>
        !entity.entityName ||
        (entity.attributes ?? []).length === 0 ||
        (entity.attributes ?? []).some(
          (attribute) => !attribute.attributeName || !attribute.dataType
        )
    )

    if (hasInvalidEntity) {
      toast.error('Vui lòng điền đầy đủ tên bảng, cột và kiểu dữ liệu')
      return
    }

    const datasetBlocks = blocks.filter(
      (block): block is SqlDmlBlock => block.kind === 'sql-dml'
    )

    const diagramBlock = blocks.find(
      (block): block is SchemaDiagramBlock => block.kind === 'schema-diagram'
    )

    const payload: SaveExamSpecificationRequest = {
      name: `Exam #${normalizedExamId} - Common Part`,
      title: `Exam #${normalizedExamId} - Common Part`,
      ddlScript,
      ddlVisibleToStudent: ddlBlock?.visibleToStudent ?? false,
      schemaDiagram: diagramBlock?.data.diagramData ?? '',
      schemaDiagramVisibleToStudent: diagramBlock?.visibleToStudent ?? true,
      description: richTextDescription,
      entities: sanitizedEntities.map((entity, entityIndex) => ({
        entityName: entity.entityName,
        displayName: entity.displayName ?? '',
        description: entity.description ?? '',
        orderIndex: entityIndex + 1,
        attributes: (entity.attributes ?? []).map(
          (attribute, attributeIndex) => ({
            attributeName: attribute.attributeName,
            dataType: attribute.dataType,
            description: attribute.description ?? '',
            isPrimaryKey: Boolean(attribute.isPrimaryKey),
            isNullable: attribute.isNullable !== false,
            orderIndex: attributeIndex + 1
          })
        )
      })),
      datasets: datasetBlocks
        ? mapDatasetBlocksToSavePayload(datasetBlocks)
        : []
    }

    setIsSaving(true)
    const result = await callApi(
      saveExamSpecification(normalizedExamId, payload),
      false
    )
    setIsSaving(false)

    if (!result.data) {
      return
    }

    const now = new Date()
    setLastSavedAt(
      now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    )
    toast.success('Đã lưu phần đề chung xuống DB')
  }

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8 bg-sub-primary">
          <div className="flex min-w-0 items-center gap-3">
            <BookOpenCheck className="h-5 w-5 text-primary-container" />
            <div className="min-w-0">
              <h1 className="truncate text-base text-primary-container font-semibold sm:text-lg">
                Tạo đề thi chung
              </h1>
              <p className="truncate text-xs text-primary-container">
                Thiết kế block nội dung cho phần đề chung của bài thi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="dark:border-transparent border-transparent bg-muted-foreground text-muted dark:hover:text-muted"
              type="button"
              variant={showStudentPreview ? 'default' : 'outline'}
              onClick={() => setShowStudentPreview((prev) => !prev)}
            >
              {showStudentPreview ? 'Thoát xem sinh viên' : 'Xem như sinh viên'}
            </Button>
            <Button
              className="text-on-primary-container bg-primary-container hover:text-muted"
              type="button"
              onClick={saveCommonPart}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </header>

      <div className="relative mx-0 grid min-h-[calc(100vh-72px)] w-full max-w-7xl grid-cols-1 py-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[260px] lg:block bg-sidebar"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-[260px] right-0 hidden lg:block bg-on-primary-container/10"
        />

        <aside className="relative z-10 h-view self-start p-4 lg:sticky lg:top-24">
          <div className="space-y-1 px-1">
            <h2 className="text-md font-medium text-muted-foreground">
              Phím chức năng
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Nhấn nút để thêm khối mới vào phần đề chung
            </p>
          </div>

          <div className="space-y-2">
            {BLOCK_REGISTRY.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.kind}
                  type="button"
                  variant="ghost"
                  className="h-auto w-full items-start justify-start rounded-lg border border-transparent px-3 py-3 text-left hover:border-border hover:bg-accent/70"
                  onClick={() => addBlock(item.kind)}
                  disabled={showStudentPreview}
                >
                  <Icon className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>

          <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Công cụ xuất tự động
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={schemaExport.openSchemaExportDialog}
              disabled={
                !hasValidExamId || isSaving || schemaExport.isExportingSchema
              }
            >
              <Play className="h-4 w-4" />
              Xuất lược đồ
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={datasetExport.openDatasetExportDialog}
              disabled={
                !hasValidExamId || isSaving || datasetExport.isExportingDatasets
              }
            >
              <Table2 className="h-4 w-4" />
              Xuất bảng dữ liệu
            </Button>
          </div>
        </aside>

        <main className="relative z-10 h-full space-y-6 px-4">
          {visibleBlocks.length === 0 && (
            <section className="border border-dashed bg-card/50 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Chưa có khối nội dung hiển thị. Hãy thêm block từ thanh bên.
              </p>
            </section>
          )}

          {visibleBlocks.map((block) => {
            const DefinitionIcon =
              BLOCK_REGISTRY.find((item) => item.kind === block.kind)?.icon ||
              FileText

            return (
              <section key={block.id} className="overflow-hidden bg-card">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 bg-muted/30 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <DefinitionIcon className="h-4 w-4 shrink-0 text-primary" />
                    <Input
                      value={block.title}
                      onChange={(event) =>
                        updateBlockById(block.id, (currentBlock) => ({
                          ...currentBlock,
                          title: event.target.value
                        }))
                      }
                      className="h-8 min-w-[220px] border-none bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0"
                      disabled={showStudentPreview}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {block.canToggleVisibility ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateBlockById(block.id, (currentBlock) => ({
                            ...currentBlock,
                            visibleToStudent: !currentBlock.visibleToStudent
                          }))
                        }
                        disabled={showStudentPreview}
                        className="gap-1.5"
                      >
                        {block.visibleToStudent ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                        {block.visibleToStudent
                          ? 'Sinh viên xem được'
                          : 'Ẩn với sinh viên'}
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase"
                      >
                        Dữ liệu hệ thống
                      </Badge>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeBlock(block.id)}
                      disabled={showStudentPreview}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  {block.kind === 'rich-text' && (
                    <RichTextEditor
                      content={block.data.content}
                      onChange={(content) =>
                        updateBlockById(block.id, (currentBlock) => {
                          if (currentBlock.kind !== 'rich-text') {
                            return currentBlock
                          }

                          return {
                            ...currentBlock,
                            data: {
                              content
                            }
                          }
                        })
                      }
                      placeholder="Nhập nội dung mô tả bối cảnh..."
                      minHeight="150px"
                    />
                  )}

                  {block.kind === 'attachment' && (
                    <div className="space-y-3">
                      <label
                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:bg-muted/60"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault()
                          addAttachmentFiles(block.id, event.dataTransfer.files)
                        }}
                      >
                        <FileUp className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          Kéo thả sơ đồ ER/PDF hoặc nhấn để tải lên
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PNG, JPG, PDF (không quá 10MB mỗi tệp)
                        </p>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept=".png,.jpg,.jpeg,.pdf"
                          onChange={(event) =>
                            addAttachmentFiles(block.id, event.target.files)
                          }
                          disabled={showStudentPreview}
                        />
                      </label>

                      {block.data.files.length > 0 && (
                        <div className="space-y-2">
                          {block.data.files.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.type || 'application/octet-stream'} •{' '}
                                  {formatFileSize(item.size)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() =>
                                  removeAttachment(block.id, item.id)
                                }
                                disabled={showStudentPreview}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {block.kind === 'sql-ddl' && (
                    <div className="h-64 overflow-hidden rounded-lg border border-border">
                      <TeacherSqlEditor
                        value={block.data.sql}
                        onChange={(value) =>
                          updateBlockById(block.id, (currentBlock) => {
                            if (currentBlock.kind !== 'sql-ddl') {
                              return currentBlock
                            }

                            return {
                              ...currentBlock,
                              data: {
                                sql: value ?? ''
                              }
                            }
                          })
                        }
                        height="100%"
                        readOnly={showStudentPreview}
                      />
                    </div>
                  )}

                  {block.kind === 'sql-dml' && (
                    <div className="w-full">
                      {block.data.displayMode === 'data' ? (
                        <DatasetTableView
                          sql={block.data.sql}
                          tableData={block.data.tableData}
                        />
                      ) : (
                        <div className="h-56 overflow-hidden rounded-lg border border-border">
                          <TeacherSqlEditor
                            value={block.data.sql}
                            onChange={(value) =>
                              updateBlockById(block.id, (currentBlock) => {
                                if (currentBlock.kind !== 'sql-dml') {
                                  return currentBlock
                                }
                                return {
                                  ...currentBlock,
                                  data: {
                                    ...currentBlock.data,
                                    sql: value ?? ''
                                  }
                                }
                              })
                            }
                            height="100%"
                            readOnly={showStudentPreview}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {block.kind === 'schema-diagram' && (
                    <div className="h-[500px] w-full">
                      <TeacherSchemaDiagram
                        diagramData={block.data.diagramData}
                        readOnly={showStudentPreview}
                        onChange={(newData) => {
                          updateBlockById(block.id, (b) => {
                            if (b.kind !== 'schema-diagram') return b
                            return { ...b, data: { diagramData: newData } }
                          })
                        }}
                      />
                    </div>
                  )}

                  {block.kind === 'table-description' && (
                    <EntitiesEditor
                      entities={block.data.entities}
                      onAddEntity={() =>
                        showStudentPreview
                          ? undefined
                          : addTableEntity(block.id)
                      }
                      onRemoveEntity={(entityIndex) =>
                        showStudentPreview
                          ? undefined
                          : removeTableEntity(block.id, entityIndex)
                      }
                      onMoveEntity={(entityIndex, direction) =>
                        showStudentPreview
                          ? undefined
                          : moveTableEntity(block.id, entityIndex, direction)
                      }
                      onUpdateEntity={(entityIndex, field, value) =>
                        showStudentPreview
                          ? undefined
                          : updateTableEntity(
                              block.id,
                              entityIndex,
                              field,
                              value
                            )
                      }
                      onAddAttribute={(entityIndex) =>
                        showStudentPreview
                          ? undefined
                          : addTableAttribute(block.id, entityIndex)
                      }
                      onUpdateAttribute={(
                        entityIndex,
                        attributeIndex,
                        field,
                        value
                      ) =>
                        showStudentPreview
                          ? undefined
                          : updateTableAttribute(
                              block.id,
                              entityIndex,
                              attributeIndex,
                              field,
                              value
                            )
                      }
                      onRemoveAttribute={(entityIndex, attributeIndex) =>
                        showStudentPreview
                          ? undefined
                          : removeTableAttribute(
                              block.id,
                              entityIndex,
                              attributeIndex
                            )
                      }
                    />
                  )}
                </div>
              </section>
            )
          })}
        </main>
      </div>

      {lastSavedAt && (
        <div className="fixed bottom-6 right-6 rounded-lg border border-border/70 bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Trạng thái hiện tại
          </p>
          <p className="text-sm font-semibold text-primary">
            Đã lưu lúc {lastSavedAt}
          </p>
        </div>
      )}

      <ScriptPickerDialog
        open={schemaExport.isSchemaDialogOpen}
        onOpenChange={schemaExport.setIsSchemaDialogOpen}
        title="Xuất lược đồ vào đề thi"
        description="Chọn script có sẵn để chạy hoặc nhập script SQL khác. Sau khi chạy, lược đồ bảng sẽ cập nhật vào khối mô tả dạng bảng trong đề thi."
        options={schemaExport.schemaScriptOptions}
        scriptMode={schemaExport.schemaScriptMode}
        onScriptModeChange={schemaExport.setSchemaScriptMode}
        selectedScriptId={schemaExport.selectedSchemaScriptId}
        onSelectedScriptIdChange={schemaExport.setSelectedSchemaScriptId}
        customScript={schemaExport.customSchemaScript}
        onCustomScriptChange={schemaExport.setCustomSchemaScript}
        isExecuting={schemaExport.isExportingSchema}
        onExecute={schemaExport.exportSchemaToCommonPart}
        executeLabel="Chạy và xuất lược đồ"
        executingLabel="Đang chạy..."
        radioGroupName="schema-script-mode"
      />

      <ScriptPickerDialog
        open={datasetExport.isDatasetDialogOpen}
        onOpenChange={datasetExport.setIsDatasetDialogOpen}
        title="Xuất bảng dữ liệu vào đề thi"
        description="Chạy script để tạo dữ liệu, sau đó hệ thống sẽ xuất dữ liệu theo từng bảng thành các block SQL DML trong phần đề chung."
        options={datasetExport.datasetScriptOptions}
        scriptMode={datasetExport.datasetScriptMode}
        onScriptModeChange={datasetExport.setDatasetScriptMode}
        selectedScriptId={datasetExport.selectedDatasetScriptId}
        onSelectedScriptIdChange={datasetExport.setSelectedDatasetScriptId}
        customScript={datasetExport.customDatasetScript}
        onCustomScriptChange={datasetExport.setCustomDatasetScript}
        isExecuting={datasetExport.isExportingDatasets}
        onExecute={datasetExport.exportDatasetsToCommonPart}
        executeLabel="Chạy và xuất bảng dữ liệu"
        executingLabel="Đang chạy..."
        radioGroupName="dataset-script-mode"
      />
    </div>
  )
}
