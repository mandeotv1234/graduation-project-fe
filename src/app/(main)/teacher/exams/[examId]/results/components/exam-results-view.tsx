'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Hash,
  Search,
  Download,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import styles from './exam-results-view.module.scss'

import { Button } from '@/components/ui/button'
import { TeacherExamResult, GradingNotificationDto } from '@/lib/types'
import { subscribeToTeacherGradingResult } from '@/lib/socket'

interface ExamResultsViewProps {
  examId: number
  initialResults: TeacherExamResult[]
}

export function ExamResultsView({
  examId,
  initialResults
}: ExamResultsViewProps) {
  const router = useRouter()
  const [results, setResults] = useState<TeacherExamResult[]>(initialResults)
  const [searchTerm, setSearchTerm] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  useEffect(() => {
    // Socket connection for real-time updates
    const unsubscribe = subscribeToTeacherGradingResult(
      examId,
      (rawNotification: unknown) => {
        const notification = rawNotification as GradingNotificationDto
        setResults((prev: TeacherExamResult[]) => {
          const index = prev.findIndex(
            (r) => r.submissionId === notification.submissionId
          )

          const newResult: TeacherExamResult = {
            submissionId: notification.submissionId || Date.now(), // Fallback if missing
            studentId: notification.studentId,
            studentName: notification.studentName || 'Học sinh',
            studentEmail: notification.studentEmail || '',
            attemptNumber: notification.attemptNumber || 1,
            submittedAt: new Date().toISOString(),
            totalScore: notification.totalScore || notification.score || 0,
            maxScore: notification.maxScore || 10,
            correctCount: notification.correctCount || 0,
            totalQuestions: notification.totalQuestions || 0,
            status: notification.status
          }

          if (index !== -1) {
            const updated = [...prev]
            updated[index] = newResult
            return updated
          } else {
            return [newResult, ...prev]
          }
        })

        toast.success(
          `Học sinh ${notification.studentName || 'Học sinh'} vừa nộp bài. Điểm: ${notification.totalScore || notification.score || 0}`
        )
      }
    )

    return () => {
      unsubscribe?.()
    }
  }, [examId])

  const filteredResults = results.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredResults.length / pageSize)
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const stats = {
    totalCount: results.length,
    passed: results.filter((r) => r.totalScore >= 5).length,
    average:
      results.length > 0
        ? (
            results.reduce((sum, r) => sum + r.totalScore, 0) / results.length
          ).toFixed(1)
        : 0
  }

  const handleRowClick = (submissionId: number) => {
    router.push(`/teacher/exams/${examId}/results/${submissionId}`)
  }

  const handleExportCSV = () => {
    const headers = [
      'Học sinh',
      'Email',
      'Thời gian nộp',
      'Lần thi',
      'Trạng thái',
      'Điểm',
      'Điểm tối đa'
    ]

    const rows = results.map((r) => [
      `"${r.studentName}"`,
      `"${r.studentEmail}"`,
      `"${new Date(r.submittedAt).toLocaleString('vi-VN')}"`,
      r.attemptNumber,
      `"${
        r.status === 'COMPLETED'
          ? 'Hoàn tất'
          : r.status === 'FAILED'
            ? 'Thất bại'
            : 'Đang chấm'
      }"`,
      r.totalScore,
      r.maxScore
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ket_qua_bai_thi_${examId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={styles.resultsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div>
            <h1>Kết quả bài thi</h1>
            <p>
              Bài thi #{examId} · {results.length} lượt nộp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Xuất file CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.blue}`}>
            <Users />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.label}>Số học sinh đã nộp</p>
            <h2 className={styles.value}>{stats.totalCount}</h2>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.green}`}>
            <CheckCircle2 />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.label}>Đã đạt (&gt;= 5đ)</p>
            <h2 className={styles.value}>{stats.passed}</h2>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.orange}`}>
            <Hash />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.label}>Điểm trung bình</p>
            <h2 className={styles.value}>{stats.average}</h2>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.searchWrapper}>
            <Search />
            <input
              type="text"
              placeholder="Tìm kiếm học sinh..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Lọc kết quả
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>Học sinh</th>
                <th>Thời gian nộp</th>
                <th>Lần thi</th>
                <th>Trạng thái</th>
                <th className="text-center">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Chưa có lượt nộp bài nào.
                  </td>
                </tr>
              ) : (
                paginatedResults.map((result) => (
                  <tr
                    key={result.submissionId}
                    onClick={() => handleRowClick(result.submissionId)}
                  >
                    <td>
                      <div className={styles.studentCell}>
                        <div className={styles.avatar}>
                          {result.studentName.charAt(0)}
                        </div>
                        <div className={styles.info}>
                          <span className={styles.name}>
                            {result.studentName}
                          </span>
                          <span className={styles.email}>
                            <Mail className="h-3 w-3" />
                            {result.studentEmail}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(result.submittedAt).toLocaleString('vi-VN')}
                      </span>
                    </td>
                    <td className="text-center px-4">
                      <span className="text-xs font-semibold px-2 py-1 bg-muted rounded border">
                        Lần {result.attemptNumber}
                      </span>
                    </td>
                    <td>
                      {result.status === 'COMPLETED' ? (
                        <span
                          className={`${styles.statusBadge} ${styles.completed}`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Hoàn tất
                        </span>
                      ) : result.status === 'FAILED' ? (
                        <span
                          className={`${styles.statusBadge} ${styles.failed}`}
                        >
                          <AlertCircle className="h-3 w-3" />
                          Thất bại
                        </span>
                      ) : (
                        <span
                          className={`${styles.statusBadge} ${styles.pending}`}
                        >
                          Đang chấm
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`${styles.scoreText} ${result.totalScore >= 5 ? styles.passed : styles.failed}`}
                        >
                          {result.totalScore.toFixed(1)}/{result.maxScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                          {result.totalScore >= 5 ? 'Đạt' : 'Chưa đạt'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>
            Hiển thị{' '}
            <span>
              {filteredResults.length > 0
                ? (currentPage - 1) * pageSize + 1
                : 0}
            </span>{' '}
            -{' '}
            <span>
              {Math.min(currentPage * pageSize, filteredResults.length)}
            </span>{' '}
            trong <span>{filteredResults.length}</span> kết quả
          </div>
          {totalPages > 1 && (
            <div className={styles.nav}>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentPage((p) => Math.max(1, p - 1))
                }}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'ghost'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentPage(page)
                      }}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
