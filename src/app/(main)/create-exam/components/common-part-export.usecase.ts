import type { ExecuteSqlResponse } from '@/lib/types'

import {
  MAX_EXPORT_ROWS_PER_TABLE,
  buildInsertScript,
  quoteMsIdentifier
} from './common-part-export.domain'

export type ExecuteSqlInExam = (
  sql: string
) => Promise<ExecuteSqlResponse | undefined>

export type ExportedDataset = {
  title: string
  sql: string
  tableData: string
}

type ExportSchemaResult =
  | {
      schema: NonNullable<ExecuteSqlResponse['schema']>
      errorMessage?: undefined
    }
  | {
      schema?: undefined
      errorMessage: string
    }

type ExportDatasetResult =
  | {
      datasets: ExportedDataset[]
      errorMessage?: undefined
    }
  | {
      datasets?: undefined
      errorMessage: string
    }

const collectTableNames = (schema: ExecuteSqlResponse['schema']): string[] =>
  Array.from(
    new Set(
      (schema ?? [])
        .map((table) => table.tableName)
        .filter((name): name is string => Boolean(name))
    )
  )

export const exportSchemaFromScript = async (
  sql: string,
  executeSqlInExam: ExecuteSqlInExam
): Promise<ExportSchemaResult> => {
  const result = await executeSqlInExam(sql)

  if (!result) {
    return { errorMessage: 'Không nhận được phản hồi từ hệ thống' }
  }

  if (result.errorMessage) {
    return { errorMessage: result.errorMessage }
  }

  const schema = result.schema ?? []

  if (schema.length === 0) {
    return {
      errorMessage: 'Script chạy thành công nhưng không sinh ra lược đồ bảng'
    }
  }

  return { schema }
}

export const exportDatasetsFromScript = async (
  dmlScript: string,
  existingDdl: string,
  executeSqlInExam: ExecuteSqlInExam
): Promise<ExportDatasetResult> => {
  const fullScript = existingDdl ? `${existingDdl}\n\n${dmlScript}` : dmlScript

  const bootstrapResult = await executeSqlInExam(fullScript)

  if (!bootstrapResult) {
    return { errorMessage: 'Không nhận được phản hồi từ hệ thống' }
  }

  if (bootstrapResult.errorMessage) {
    return { errorMessage: bootstrapResult.errorMessage }
  }

  const tableNames = collectTableNames(bootstrapResult.schema)

  if (tableNames.length === 0) {
    return {
      errorMessage: 'Không phát hiện bảng dữ liệu để xuất từ script đã chạy'
    }
  }

  const tableResults = await Promise.allSettled(
    tableNames.map(async (tableName) => {
      const tableScript = `SELECT TOP ${MAX_EXPORT_ROWS_PER_TABLE} * FROM ${quoteMsIdentifier(tableName)}`
      const tableResult = await executeSqlInExam(tableScript)

      if (!tableResult || tableResult.errorMessage) {
        return null
      }

      const rows = tableResult.resultSet ?? []

      const columns = Array.from(
        rows.reduce((set, row) => {
          Object.keys(row).forEach((column) => set.add(column))
          return set
        }, new Set<string>())
      )

      const mappedRows = rows.map((row) =>
        columns.map((col) => {
          const val = row[col]
          return val === null || val === undefined ? '' : String(val)
        })
      )

      const parsedTableData = {
        tableName,
        columns,
        rows: mappedRows
      }

      return {
        sql: buildInsertScript(tableName, rows),
        parsedTableData
      }
    })
  )

  const validResults = tableResults
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<{
        sql: string
        parsedTableData: {
          tableName: string
          columns: string[]
          rows: string[][]
        }
      }> => result.status === 'fulfilled' && result.value !== null
    )
    .map((result) => result.value)

  if (validResults.length === 0) {
    return { errorMessage: 'Không thể xuất dữ liệu bảng từ script đã chạy' }
  }

  const combinedSql = validResults.map((r) => r.sql).join('\n\n')
  const combinedTableData = JSON.stringify(
    validResults.map((r) => r.parsedTableData)
  )

  return {
    datasets: [
      {
        title: 'Mã SQL DML: Dữ liệu tự động',
        sql: combinedSql,
        tableData: combinedTableData
      }
    ]
  }
}
