'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Hash,
  Search,
  Download,
  Filter,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

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

  useEffect(() => {
    // Socket connection for real-time updates
    const unsubscribe = subscribeToTeacherGradingResult(
      examId,
      (rawNotification: unknown) => {
        const notification = rawNotification as GradingNotificationDto
        // Find if user already exists
        setResults((prev) => {
          const index = prev.findIndex(
            (r) => r.studentId === notification.studentId
          )

          const newResult: TeacherExamResult = {
            studentId: notification.studentId,
            studentName: notification.studentName || 'Học sinh',
            studentEmail: notification.studentEmail || '',
            attemptNumber: 1, // Default
            submittedAt: new Date().toISOString(),
            totalScore: notification.totalScore || notification.score || 0,
            maxScore: notification.maxScore || prev[index]?.maxScore || 10,
            correctCount: notification.correctCount || 0,
            totalQuestions: notification.totalQuestions || 0,
            status: notification.status
          }

          if (index !== -1) {
            // Update existing
            const updated = [...prev]
            updated[index] = newResult
            return updated
          } else {
            // Add new
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

  const stats = {
    total: results.length,
    passed: results.filter((r) => r.totalScore >= 5).length,
    average:
      results.length > 0
        ? (
            results.reduce((sum, r) => sum + r.totalScore, 0) / results.length
          ).toFixed(1)
        : 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Kết quả bài thi
            </h1>
            <p className="text-muted-foreground">
              Bài thi #{examId} · {results.length} lượt nộp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất file CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Số học sinh đã nộp
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              {stats.total}
            </h2>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Đã đạt (&gt;= 5đ)
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              {stats.passed}
            </h2>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-orange-500/10">
            <Hash className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Điểm trung bình
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              {stats.average}
            </h2>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Lọc kết quả
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 font-semibold text-foreground">
                  Học sinh
                </th>
                <th className="px-6 py-4 font-semibold text-foreground">
                  Thời gian nộp
                </th>
                <th className="px-6 py-4 font-semibold text-foreground">
                  Trạng thái
                </th>
                <th className="px-6 py-4 font-semibold text-center text-foreground">
                  Điểm
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredResults.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    Chưa có lượt nộp bài nào.
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr
                    key={result.studentEmail}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {result.studentName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {result.studentName}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {result.studentEmail}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(result.submittedAt).toLocaleString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {result.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Hoàn tất
                        </span>
                      ) : result.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                          <AlertCircle className="h-3 w-3" />
                          Thất bại
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium animate-pulse">
                          Đang chấm
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-lg font-bold ${result.totalScore >= 5 ? 'text-emerald-500' : 'text-red-500'}`}
                      >
                        {result.totalScore.toFixed(1)}/{result.maxScore}
                      </span>
                    </td>
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
