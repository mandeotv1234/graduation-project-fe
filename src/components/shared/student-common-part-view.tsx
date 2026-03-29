'use client'

import { SpecificationEntity } from '@/lib/types'
import { DatasetTableView } from '@/components/shared/dataset-table-view'
import { TeacherSchemaDiagram } from '@/components/shared/teacher-schema-diagram'

type StudentCommonBlock =
  | {
      id: string
      kind: 'rich-text'
      title: string
      data: { content: string }
    }
  | {
      id: string
      kind: 'attachment'
      title: string
      data: {
        files: Array<{
          id: string
          name: string
          size: number
          type: string
        }>
      }
    }
  | {
      id: string
      kind: 'sql-ddl' | 'sql-dml'
      title: string
      data: { sql: string; tableData?: string }
    }
  | {
      id: string
      kind: 'table-description'
      title: string
      data: { entities: SpecificationEntity[] }
    }
  | {
      id: string
      kind: 'schema-diagram'
      title: string
      data: { diagramData: string }
    }

interface StudentCommonPartViewProps {
  blocks: StudentCommonBlock[]
  embedded?: boolean
  hideHeader?: boolean
}

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value)

const sanitizeBlockTitle = (title: string) =>
  title
    .replace(/^Khối văn bản\s*:\s*/i, '')
    .replace(/^Mã SQL DDL\s*:\s*/i, '')
    .replace(/^Mã SQL DML\s*:\s*/i, '')
    .replace(/^Hình ảnh\/Tài liệu\s*:\s*/i, '')
    .trim()

const getConstraints = (isPrimaryKey: boolean, isNullable?: boolean) => {
  const constraints: string[] = []

  if (isPrimaryKey) {
    constraints.push('PK')
  }

  if (isNullable === false) {
    constraints.push('NOT NULL')
  }

  return constraints.join(', ')
}

function EntityStatementTable({ entity }: { entity: SpecificationEntity }) {
  const attributes = [...(entity.attributes ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )
  const hasConstraintColumn = attributes.some(
    (attribute) =>
      Boolean(attribute.isPrimaryKey) || attribute.isNullable === false
  )

  return (
    <section className="h-full space-y-0 rounded-xs border-2 border-border bg-card overflow-hidden">
      <div className="bg-primary/10 dark:bg-primary/15 px-3 py-2 border-b-2 border-primary/20">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Bảng
        </p>
        <h5 className="text-sm font-bold text-primary font-mono tracking-wide">
          {entity.entityName}
        </h5>
        {entity.displayName && entity.displayName !== entity.entityName && (
          <p className="text-xs text-muted-foreground">{entity.displayName}</p>
        )}
        {entity.description && (
          <p className="mt-1 text-xs text-muted-foreground italic">
            {entity.description}
          </p>
        )}
      </div>

      <div className="overflow-x-auto bg-muted/20">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-border/70 bg-muted/40 text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cột</th>
              <th className="px-3 py-2 font-medium">Kiểu dữ liệu</th>
              <th className="px-3 py-2 font-medium">Mô tả</th>
              {hasConstraintColumn && (
                <th className="px-3 py-2 font-medium">Ràng buộc</th>
              )}
            </tr>
          </thead>
          <tbody>
            {attributes.map((attribute, index) => (
              <tr
                key={`${entity.entityName}-${attribute.attributeName}-${index}`}
                className={`border-b border-border/50 ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                }`}
              >
                <td className="px-3 py-2 font-semibold text-foreground">
                  {attribute.attributeName || '-'}
                </td>
                <td className="px-3 py-2 font-mono text-emerald-700 dark:text-emerald-400">
                  {attribute.dataType || '-'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {attribute.description || '-'}
                </td>
                {hasConstraintColumn && (
                  <td className="px-3 py-2 text-muted-foreground">
                    {getConstraints(
                      Boolean(attribute.isPrimaryKey),
                      attribute.isNullable
                    ) || '-'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function StudentCommonPartView({
  blocks,
  embedded = false,
  hideHeader = false
}: StudentCommonPartViewProps) {
  if (blocks.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Phần đề chung hiện chưa có nội dung hiển thị cho sinh viên.
        </p>
      </section>
    )
  }

  const visibleStatementBlocks = blocks.filter(
    (block) => block.kind !== 'attachment'
  )

  return (
    <article
      className={
        embedded
          ? 'w-full bg-transparent px-0 py-0'
          : 'mx-auto w-full max-w-5xl bg-card px-5 py-6'
      }
    >
      {!hideHeader && (
        <header className="border-b border-border/70 pb-4">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Phần yêu cầu chung
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sinh viên đọc kỹ bộ câu hỏi, dữ liệu và ràng buộc trước khi làm các
            câu hỏi.
          </p>
        </header>
      )}

      <div className={`${hideHeader ? '' : 'mt-6'} space-y-6`}>
        {visibleStatementBlocks.map((block, index) => {
          const sectionNumber = index + 1
          const sectionTitle =
            sanitizeBlockTitle(block.title) || `Muc ${sectionNumber}`

          return (
            <section key={block.id} className="space-y-3">
              <div>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {sectionTitle}
                </h3>
              </div>

              <div className="px-4 py-4 sm:px-5">
                {block.kind === 'rich-text' && (
                  <div>
                    {block.data.content?.trim() ? (
                      looksLikeHtml(block.data.content) ? (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert [&_p]:leading-7"
                          dangerouslySetInnerHTML={{
                            __html: block.data.content
                          }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                          {block.data.content}
                        </p>
                      )
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        Chưa có mô tả cho phần này.
                      </p>
                    )}
                  </div>
                )}

                {block.kind === 'sql-ddl' && (
                  <pre className="max-h-72 overflow-auto rounded-lg border border-border/60 bg-background p-4 text-xs leading-5 text-foreground">
                    {block.data.sql?.trim() || '-- Chua co noi dung SQL --'}
                  </pre>
                )}

                {block.kind === 'sql-dml' && (
                  <div className="w-full">
                    {block.data.sql ? (
                      <DatasetTableView
                        sql={block.data.sql}
                        tableData={block.data.tableData}
                      />
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        Chưa có dữ liệu mẫu.
                      </p>
                    )}
                  </div>
                )}

                {block.kind === 'table-description' && (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {(block.data.entities ?? []).length > 0 ? (
                      block.data.entities
                        .slice()
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((entity, entityIndex) => (
                          <EntityStatementTable
                            key={`${entity.entityName}-${entityIndex}`}
                            entity={entity}
                          />
                        ))
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        Chưa có bảng dữ liệu cho phần này.
                      </p>
                    )}
                  </div>
                )}

                {block.kind === 'schema-diagram' && (
                  <div className="h-[500px] w-full">
                    {block.data.diagramData ? (
                      <TeacherSchemaDiagram
                        diagramData={block.data.diagramData}
                        readOnly
                      />
                    ) : (
                      <p className="text-sm italic text-muted-foreground pt-4">
                        Chưa có lược đồ cơ sở dữ liệu.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </article>
  )
}
