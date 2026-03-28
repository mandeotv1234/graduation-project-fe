import { type ComponentType } from 'react'
import { Database, FileText, FileUp, Table2, Workflow } from 'lucide-react'

import {
  ExamSpecification,
  SpecificationEntity,
  SpecificationEntityAttribute
} from '@/lib/types'

export type BlockKind =
  | 'rich-text'
  | 'attachment'
  | 'sql-ddl'
  | 'sql-dml'
  | 'table-description'
  | 'schema-diagram'

interface BlockBase<K extends BlockKind, D> {
  id: string
  kind: K
  title: string
  visibleToStudent: boolean
  canToggleVisibility: boolean
  data: D
}

export type RichTextBlock = BlockBase<'rich-text', { content: string }>

export type AttachmentItem = {
  id: string
  name: string
  size: number
  type: string
}

export type AttachmentBlock = BlockBase<
  'attachment',
  { files: AttachmentItem[] }
>

export type SqlDdlBlock = BlockBase<'sql-ddl', { sql: string }>
export type SqlDmlBlock = BlockBase<
  'sql-dml',
  {
    sql: string
    tableData?: string
    displayMode?: 'script' | 'data' | 'both'
  }
>

export type TableDescriptionBlock = BlockBase<
  'table-description',
  {
    entities: SpecificationEntity[]
  }
>

export type SchemaDiagramBlock = BlockBase<
  'schema-diagram',
  {
    diagramData: string
  }
>

export type ExamBlock =
  | RichTextBlock
  | AttachmentBlock
  | SqlDdlBlock
  | SqlDmlBlock
  | TableDescriptionBlock
  | SchemaDiagramBlock

interface BlockDefinition {
  kind: BlockKind
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
  createBlock: () => ExamBlock
}

export const createBlockId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )

  const value = bytes / Math.pow(1024, unitIndex)

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export const createEmptyAttribute = (
  orderIndex: number
): SpecificationEntityAttribute => ({
  attributeName: '',
  dataType: 'VARCHAR(255)',
  description: '',
  isPrimaryKey: false,
  isNullable: true,
  orderIndex
})

export const createEmptyEntity = (orderIndex: number): SpecificationEntity => ({
  entityName: '',
  displayName: '',
  description: '',
  orderIndex,
  attributes: [createEmptyAttribute(1)]
})

export const normalizeEntities = (entities: SpecificationEntity[]) =>
  entities.map((entity, entityIndex) => ({
    ...entity,
    orderIndex: entityIndex + 1,
    attributes: (entity.attributes ?? []).map((attribute, attributeIndex) => ({
      ...attribute,
      orderIndex: attributeIndex + 1
    }))
  }))

export const BLOCK_REGISTRY: BlockDefinition[] = [
  {
    kind: 'rich-text',
    label: 'Khối văn bản',
    description: 'Mô tả bối cảnh, yêu cầu hoặc lưu ý',
    icon: FileText,
    createBlock: () => ({
      id: createBlockId(),
      kind: 'rich-text',
      title: 'Khối văn bản: Mô tả bối cảnh',
      visibleToStudent: true,
      canToggleVisibility: true,
      data: {
        content: ''
      }
    })
  },
  {
    kind: 'attachment',
    label: 'Hình ảnh/Tài liệu',
    description: 'Đính kèm sơ đồ ER, PDF mô tả',
    icon: FileUp,
    createBlock: () => ({
      id: createBlockId(),
      kind: 'attachment',
      title: 'Hình ảnh/Tài liệu: Sơ đồ ER',
      visibleToStudent: true,
      canToggleVisibility: true,
      data: {
        files: []
      }
    })
  },
  {
    kind: 'sql-ddl',
    label: 'SQL DDL',
    description: 'Định nghĩa cấu trúc bảng',
    icon: Database,
    createBlock: () => ({
      id: createBlockId(),
      kind: 'sql-ddl',
      title: 'Mã SQL DDL: Cấu trúc bảng',
      visibleToStudent: false,
      canToggleVisibility: true,
      data: {
        sql: `CREATE TABLE Students (
  StudentID INT PRIMARY KEY,
  FullName VARCHAR(100),
  Major VARCHAR(50)
);`
      }
    })
  },
  {
    kind: 'sql-dml',
    label: 'SQL DML',
    description: 'Dữ liệu mẫu để test',
    icon: Database,
    createBlock: () => ({
      id: createBlockId(),
      kind: 'sql-dml',
      title: 'Mã SQL DML: Dữ liệu mẫu',
      visibleToStudent: false,
      canToggleVisibility: true,
      data: {
        sql: `INSERT INTO Students (StudentID, FullName, Major)\nVALUES\n  (1, 'Nguyen Van A', 'CS'),\n  (2, 'Le Thi B', 'IS');`,
        displayMode: 'script'
      }
    })
  },
  {
    kind: 'table-description',
    label: 'Mô tả theo dạng bảng',
    description: 'Tạo theo dạng bảng',
    icon: Table2,
    createBlock: () => ({
      id: createBlockId(),
      kind: 'table-description',
      title: 'Mô tả theo dạng bảng',
      visibleToStudent: true,
      canToggleVisibility: true,
      data: {
        entities: []
      }
    })
  },
  {
    kind: 'schema-diagram',
    label: 'Lược đồ CSDL',
    description: 'Vẽ lược đồ bằng React Flow',
    icon: Workflow,
    createBlock: () => ({
      id: createBlockId(),
      kind: 'schema-diagram',
      title: 'Lược đồ cơ sở dữ liệu',
      visibleToStudent: true,
      canToggleVisibility: true,
      data: {
        diagramData: ''
      }
    })
  }
]

export const getBlockDefinition = (kind: BlockKind) => {
  const definition = BLOCK_REGISTRY.find((item) => item.kind === kind)
  if (!definition) {
    throw new Error(`Block definition not found: ${kind}`)
  }

  return definition
}

export const createInitialBlocks = (): ExamBlock[] => []

export const createBlocksFromSpecification = (
  specification: ExamSpecification
): ExamBlock[] => {
  const blocks: ExamBlock[] = []

  const description = specification.description?.trim() ?? ''
  if (description) {
    const richTextBlock = getBlockDefinition(
      'rich-text'
    ).createBlock() as RichTextBlock
    richTextBlock.data.content = description
    blocks.push(richTextBlock)
  }

  const ddlScript = specification.ddlScript?.trim() ?? ''
  if (ddlScript) {
    const ddlBlock = getBlockDefinition('sql-ddl').createBlock() as SqlDdlBlock
    ddlBlock.data.sql = ddlScript
    ddlBlock.visibleToStudent = specification.ddlVisibleToStudent ?? false
    blocks.push(ddlBlock)
  }

  const datasets = [...(specification.datasets ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )

  const dmlBlocks = datasets
    .filter((dataset) => Boolean(dataset.dataScript?.trim()))
    .map((dataset, index) => {
      const block = getBlockDefinition('sql-dml').createBlock() as SqlDmlBlock
      const datasetName = dataset.name?.trim()
      block.title = datasetName
        ? `Mã SQL DML: ${datasetName}`
        : `Mã SQL DML: Dataset ${index + 1}`
      block.data.sql = dataset.dataScript ?? ''
      // @ts-expect-error - tableData might be returned from backend DTO depending on API spec iteration
      block.data.tableData = dataset.tableData ?? ''
      block.visibleToStudent = dataset.visibleToStudent ?? false
      block.data.displayMode = block.data.tableData ? 'data' : 'script'
      return block
    })

  if (dmlBlocks.length > 0) {
    blocks.push(...dmlBlocks)
  }

  const meaningfulEntities = normalizeEntities(
    (specification.entities ?? []).map((entity) => ({
      entityName: entity.entityName ?? '',
      displayName: entity.displayName ?? '',
      description: entity.description ?? '',
      orderIndex: entity.orderIndex ?? 0,
      attributes: (entity.attributes ?? []).map((attribute) => ({
        attributeName: attribute.attributeName ?? '',
        dataType: attribute.dataType ?? '',
        description: attribute.description ?? '',
        isPrimaryKey: Boolean(attribute.isPrimaryKey),
        isNullable: attribute.isNullable ?? true,
        orderIndex: attribute.orderIndex ?? 0
      }))
    }))
  ).filter((entity) => {
    const hasEntityMeta =
      entity.entityName.trim().length > 0 ||
      (entity.displayName ?? '').trim().length > 0 ||
      (entity.description ?? '').trim().length > 0

    const hasAnyAttributeData = (entity.attributes ?? []).some(
      (attribute) =>
        attribute.attributeName.trim().length > 0 ||
        attribute.dataType.trim().length > 0 ||
        (attribute.description ?? '').trim().length > 0 ||
        Boolean(attribute.isPrimaryKey) ||
        attribute.isNullable === false
    )

    return hasEntityMeta || hasAnyAttributeData
  })

  if (meaningfulEntities.length > 0) {
    const tableDescriptionBlock = getBlockDefinition(
      'table-description'
    ).createBlock() as TableDescriptionBlock
    tableDescriptionBlock.data.entities = meaningfulEntities
    tableDescriptionBlock.visibleToStudent = true // default
    blocks.push(tableDescriptionBlock)
  }

  const schemaDiagram = specification.schemaDiagram?.trim() ?? ''
  if (schemaDiagram) {
    const diagramBlock = getBlockDefinition(
      'schema-diagram'
    ).createBlock() as SchemaDiagramBlock
    diagramBlock.data.diagramData = schemaDiagram
    diagramBlock.visibleToStudent =
      specification.schemaDiagramVisibleToStudent ?? true
    blocks.push(diagramBlock)
  }

  return blocks
}
