'use client'

import { Table, AlertCircle, Clock, Hash, CheckCircle2 } from 'lucide-react'
import { ExecuteSqlResponse } from '@/lib/types'
import { cn } from '@/lib/utils'
import styles from '@/app/(main)/student/exams/[examId]/take/components/result-panel/result-panel.module.scss'

interface ResultPanelProps {
  result: ExecuteSqlResponse | null
}

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyContent}>
          <Table className={styles.emptyIcon} />
          <p>Chạy SQL để xem kết quả</p>
        </div>
      </div>
    )
  }

  if (result.errorMessage) {
    return (
      <div className={styles.feedbackWrapper}>
        <div className={styles.errorBox}>
          <AlertCircle className={styles.feedbackIcon} />
          <div className={styles.feedbackText}>
            <p className={styles.errorTitle}>Lỗi thực thi</p>
            <pre className={styles.errorDetail}>{result.errorMessage}</pre>
          </div>
        </div>
      </div>
    )
  }

  const columns = result.columns?.length
    ? result.columns
    : result.resultSet.length > 0
      ? Object.keys(result.resultSet[0])
      : []

  if (columns.length === 0) {
    // Both DDL and SELECT with 0 rows return "Commands completed successfully."
    // DML (INSERT/UPDATE/DELETE) returns "(N row(s) affected)"
    const noDataMessage =
      !result.statusMessage ||
      result.statusMessage === 'Commands completed successfully.'

    return (
      <div className={styles.feedbackWrapper}>
        <div className={styles.successBox}>
          <CheckCircle2 className={styles.feedbackIconSuccess} />
          <div className={styles.feedbackText}>
            <p className={styles.successTitle}>Thực thi thành công</p>
            <pre className={styles.successDetail}>
              {noDataMessage
                ? 'Câu lệnh thực thi thành công (không có dữ liệu trả về).'
                : result.statusMessage}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Kết quả chạy</span>
        <div className={styles.stats}>
          <span className={styles.rowCount}>
            <Hash className="h-3.5 w-3.5" />
            {result.rowCount} dòng
          </span>
          <div className={styles.divider} />
          <span className={styles.execTime}>
            <Clock className="h-3.5 w-3.5" />
            {result.executionTimeMs}ms
          </span>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableInner}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {columns.map((col) => (
                  <th key={col} className={styles.th}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {result.resultSet.length === 0 ? (
                <tr className={cn(styles.row, 'group')}>
                  <td
                    colSpan={columns.length}
                    className={styles.cell}
                    style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: 'var(--muted-foreground)'
                    }}
                  >
                    Không có dòng nào phù hợp với điều kiện truy vấn.
                  </td>
                </tr>
              ) : (
                result.resultSet.map((row, i) => (
                  <tr key={i} className={cn(styles.row, 'group')}>
                    {columns.map((col) => (
                      <td key={col} className={styles.cell}>
                        {row[col] === null ? (
                          <span className={styles.nullValue}>NULL</span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
