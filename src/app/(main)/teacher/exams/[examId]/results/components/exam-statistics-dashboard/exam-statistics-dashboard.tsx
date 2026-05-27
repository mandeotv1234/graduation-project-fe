'use client'

import * as React from 'react'
import {
  Users,
  TrendingUp,
  Award,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  BarChart2,
  ArrowUpDown
} from 'lucide-react'
import DOMPurify from 'dompurify'
import styles from './exam-statistics-dashboard.module.scss'
import type { ExamStatistics, QuestionTypeAccuracy } from '@/lib/types'

interface ExamStatisticsDashboardProps {
  stats: ExamStatistics
}

// ===== Helpers =====

const QUESTION_TYPE_LABELS: Record<string, string> = {
  CREATE_TABLE: 'Tạo bảng',
  INSERT_DATA: 'Thêm dữ liệu',
  SELECT_QUERY: 'Truy vấn',
  TRIGGER: 'Trigger',
  FUNCTION: 'Function',
  STORED_PROCEDURE: 'Stored Proc'
}

const QUESTION_TYPE_ICONS: Record<string, string> = {
  CREATE_TABLE: '🏗️',
  INSERT_DATA: '📝',
  SELECT_QUERY: '🔍',
  TRIGGER: '⚡',
  FUNCTION: '⚙️',
  STORED_PROCEDURE: '🗄️'
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 75) return '#22c55e'
  if (accuracy >= 50) return '#f59e0b'
  return '#ef4444'
}

function getAccuracyBadge(accuracy: number): {
  label: string
  className: string
} {
  if (accuracy >= 75)
    return { label: 'Giỏi', className: styles.skillBadgeExcellent }
  if (accuracy >= 50) return { label: 'Khá', className: styles.skillBadgeGood }
  if (accuracy >= 30)
    return { label: 'TB', className: styles.skillBadgeAverage }
  return { label: 'Yếu', className: styles.skillBadgeWeak }
}

function getScoreColorClass(score: number): string {
  if (score >= 7) return styles.kpiValueGreen
  if (score >= 5) return styles.kpiValueYellow
  return styles.kpiValueRed
}

// ===== Histogram Bar Colors =====
function getHistogramBarColor(rangeIndex: number): string {
  const colors = [
    '#ef4444', // 0–1
    '#f87171', // 1–2
    '#fb923c', // 2–3
    '#f59e0b', // 3–4
    '#fbbf24', // 4–5
    '#a3e635', // 5–6
    '#4ade80', // 6–7
    '#22c55e', // 7–8
    '#3b82f6', // 8–9
    '#6366f1' // 9–10
  ]
  return colors[rangeIndex] ?? '#94a3b8'
}

// ===== Mini Donut SVG =====
interface MiniDonutProps {
  percentage: number
  size?: number
  strokeWidth?: number
}

function MiniDonut({ percentage, size = 36, strokeWidth = 4 }: MiniDonutProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const color =
    percentage >= 60 ? '#22c55e' : percentage >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={styles.miniDonut}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="8"
        fontWeight="700"
        fill={color}
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  )
}

// ===== Radar Chart (SVG) =====

interface RadarChartProps {
  data: QuestionTypeAccuracy[]
}

function RadarChart({ data }: RadarChartProps) {
  if (data.length === 0) return <p className={styles.empty}>Không có dữ liệu</p>

  // Fallback to horizontal bars when < 3 axes (radar is meaningless)
  if (data.length < 3) {
    return (
      <div className={styles.skillChart}>
        {data.map((item) => {
          const label =
            QUESTION_TYPE_LABELS[item.questionType] ?? item.questionType
          const color = getAccuracyColor(item.accuracy)
          return (
            <div key={item.questionType} className={styles.skillRow}>
              <div className={styles.skillMeta}>
                <span className={styles.skillName}>{label}</span>
                <span className={styles.skillAccuracy} style={{ color }}>
                  {item.accuracy.toFixed(1)}%
                </span>
              </div>
              <div className={styles.skillTrackWrapper}>
                <div className={styles.skillTrack}>
                  <div
                    className={styles.skillFill}
                    style={{ width: `${item.accuracy}%`, background: color }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const size = 260
  const cx = size / 2
  const cy = size / 2
  const radius = 90
  const levels = 4
  const n = data.length

  function polarToXY(angle: number, r: number) {
    return {
      x: cx + r * Math.sin(angle),
      y: cy - r * Math.cos(angle)
    }
  }

  const angles = data.map((_, i) => (2 * Math.PI * i) / n)

  // Concentric grid polygons
  const gridPolygons = Array.from({ length: levels }, (_, l) => {
    const r = (radius * (l + 1)) / levels
    return angles.map((a) => polarToXY(a, r))
  })

  // Data polygon
  const dataPoints = data.map((d, i) =>
    polarToXY(angles[i], (d.accuracy / 100) * radius)
  )

  function pointsStr(pts: { x: number; y: number }[]) {
    return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  }

  return (
    <div className={styles.radarWrapper}>
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.radarSvg}>
        {/* Grid */}
        {gridPolygons.map((pts, li) => (
          <polygon
            key={li}
            points={pointsStr(pts)}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {angles.map((a, i) => {
          const end = polarToXY(a, radius)
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x.toFixed(1)}
              y2={end.y.toFixed(1)}
              stroke="var(--color-border)"
              strokeWidth="1"
            />
          )
        })}
        {/* Data area */}
        <polygon
          points={pointsStr(dataPoints)}
          fill="rgba(99,102,241,0.18)"
          stroke="#6366f1"
          strokeWidth="2"
        />
        {/* Data points + percentage labels */}
        {dataPoints.map((p, i) => (
          <React.Fragment key={i}>
            <circle
              cx={p.x.toFixed(1)}
              cy={p.y.toFixed(1)}
              r="4"
              fill="#6366f1"
              stroke="#fff"
              strokeWidth="1.5"
            />
            {/* Percentage label near the data point */}
            <text
              x={p.x.toFixed(1)}
              y={(p.y - 8).toFixed(1)}
              textAnchor="middle"
              fontSize="8"
              fontWeight="700"
              fill="#6366f1"
            >
              {data[i].accuracy.toFixed(0)}%
            </text>
          </React.Fragment>
        ))}
        {/* Axis Labels */}
        {angles.map((a, i) => {
          const labelR = radius + 28
          const lp = polarToXY(a, labelR)
          const label =
            QUESTION_TYPE_LABELS[data[i].questionType] ?? data[i].questionType
          return (
            <text
              key={i}
              x={lp.x.toFixed(1)}
              y={lp.y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="500"
              fill="var(--color-muted-foreground)"
            >
              {label}
            </text>
          )
        })}
      </svg>
      <div className={styles.radarLegend}>
        <span className={styles.radarLegendItem}>
          <span className={styles.radarLegendDot} />
          Tỷ lệ làm đúng (%)
        </span>
      </div>
    </div>
  )
}

// ===== Main Component =====

export function ExamStatisticsDashboard({
  stats
}: ExamStatisticsDashboardProps) {
  const [showAllSuspicious, setShowAllSuspicious] = React.useState(false)
  const [sortSuspiciousAsc, setSortSuspiciousAsc] = React.useState(false)

  const scoreDistMax = Math.max(
    ...stats.scoreDistribution.map((b) => b.count),
    1
  )

  const displayedSuspicious = (() => {
    const sorted = sortSuspiciousAsc
      ? [...stats.suspiciousStudents].sort(
          (a, b) => a.violationCount - b.violationCount
        )
      : stats.suspiciousStudents
    return showAllSuspicious ? sorted : sorted.slice(0, 5)
  })()

  return (
    <div className={styles.dashboard}>
      {/* ===== Row 1: KPI Cards ===== */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconBlue}`}>
            <Users />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Tổng bài nộp</span>
            <span className={styles.kpiValue}>{stats.totalSubmissions}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconOrange}`}>
            <BarChart2 />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Điểm trung bình</span>
            <span
              className={`${styles.kpiValue} ${getScoreColorClass(stats.averageScore)}`}
            >
              {stats.averageScore.toFixed(1)}
            </span>
            <span className={styles.kpiSub}>
              Min {stats.minScore.toFixed(1)} — Max {stats.maxScore.toFixed(1)}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>
            <Award />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Tỷ lệ qua môn</span>
            <span className={styles.kpiValue}>
              {stats.passRate.toFixed(1)}%
              <MiniDonut percentage={stats.passRate} />
            </span>
            <span className={styles.kpiSub}>(đạt ≥ 50% điểm tối đa)</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconPurple}`}>
            <Clock />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>TB chênh lệch thời gian</span>
            <span className={styles.kpiValue}>
              {stats.avgCompletionTimeMinutes.toFixed(0)}
              <span style={{ fontSize: '1rem', fontWeight: 500 }}> ph</span>
            </span>
          </div>
        </div>

        <div
          className={`${styles.kpiCard} ${stats.suspiciousCount > 0 ? styles.kpiCardPulse : ''}`}
        >
          <div className={`${styles.kpiIcon} ${styles.kpiIconRed}`}>
            <AlertTriangle />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Cảnh báo vi phạm</span>
            <span className={styles.kpiValue}>{stats.suspiciousCount}</span>
            <span className={styles.kpiSub}>sinh viên có vi phạm</span>
          </div>
        </div>
      </div>

      {/* ===== Row 2: Charts (2-column: Histogram 3fr + Radar 2fr) ===== */}
      <div className={styles.chartsGrid}>
        {/* Vertical Histogram: Score Distribution */}
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>📊 Phổ điểm</p>
          <p className={styles.chartSubtitle}>
            Phân bổ số bài theo dải điểm (quy đổi /10)
          </p>
          <div className={styles.histogramContainer}>
            <div className={styles.histogram}>
              {/* Pass threshold line at 5.0 (after 5th bar = 50% position) */}
              <div
                className={styles.thresholdLine}
                style={{
                  left: `${(5 / stats.scoreDistribution.length) * 100}%`
                }}
              >
                <span className={styles.thresholdLabel}>Ngưỡng đạt</span>
              </div>

              {stats.scoreDistribution.map((bucket, i) => {
                const pct =
                  scoreDistMax > 0 ? (bucket.count / scoreDistMax) * 100 : 0
                const totalBuckets = stats.scoreDistribution.reduce(
                  (sum, b) => sum + b.count,
                  0
                )
                const percentOfTotal =
                  totalBuckets > 0
                    ? ((bucket.count / totalBuckets) * 100).toFixed(1)
                    : '0'
                return (
                  <div key={bucket.range} className={styles.histogramCol}>
                    {/* Tooltip on hover */}
                    <div className={styles.histogramTooltip}>
                      {bucket.count} bài ({percentOfTotal}%)
                    </div>
                    {/* Count above bar */}
                    {bucket.count > 0 && (
                      <span className={styles.histogramBarCount}>
                        {bucket.count}
                      </span>
                    )}
                    <div
                      className={styles.histogramBar}
                      style={{
                        height: `${Math.max(pct, bucket.count > 0 ? 6 : 0)}%`,
                        background: getHistogramBarColor(i)
                      }}
                    />
                    <span className={styles.histogramLabel}>
                      {bucket.range}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Radar Chart: SQL Skill */}
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>🎯 Radar năng lực SQL</p>
          <p className={styles.chartSubtitle}>
            Tỷ lệ đúng theo từng loại câu (100% = tất cả đúng)
          </p>
          <RadarChart data={stats.questionTypeAccuracy} />
        </div>
      </div>

      {/* ===== Row 3: Per-Question Accuracy Table ===== */}
      {stats.perQuestionAccuracy && stats.perQuestionAccuracy.length > 0 && (
        <div className={styles.tableSection}>
          <div className={styles.tableSectionHeader}>
            <span className={styles.tableSectionTitle}>
              📋 Thống kê từng câu hỏi
            </span>
            <span
              className={styles.tableSectionBadge}
              style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
            >
              {stats.perQuestionAccuracy.length} câu
            </span>
          </div>
          <table className={styles.suspiciousTable}>
            <thead>
              <tr>
                <th>Câu</th>
                <th>Nội dung</th>
                <th>Loại</th>
                <th>Tỷ lệ đúng</th>
                <th>Đúng / Tổng</th>
              </tr>
            </thead>
            <tbody>
              {stats.perQuestionAccuracy.map((q) => {
                const color = getAccuracyColor(q.accuracy)
                const badge = getAccuracyBadge(q.accuracy)
                const typeLabel =
                  QUESTION_TYPE_LABELS[q.questionType] ?? q.questionType
                const typeIcon = QUESTION_TYPE_ICONS[q.questionType] ?? '📌'
                return (
                  <tr key={q.questionId}>
                    <td style={{ fontWeight: 700, textAlign: 'center' }}>
                      {q.orderIndex}
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--color-foreground)'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            q.content || `Câu ${q.orderIndex}`
                          )
                        }}
                      />
                    </td>
                    <td>
                      <span className={styles.questionTypeBadge}>
                        {typeIcon} {typeLabel}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div
                          className={styles.skillTrackWrapper}
                          style={{ flex: 1, minWidth: '80px' }}
                        >
                          <div className={styles.skillTrack}>
                            <div
                              className={styles.skillFill}
                              style={{
                                width: `${q.accuracy}%`,
                                background: color
                              }}
                            />
                          </div>
                          <div
                            className={styles.skillBenchmark}
                            style={{ left: '50%' }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color,
                            minWidth: '45px'
                          }}
                        >
                          {q.accuracy.toFixed(1)}%
                        </span>
                        <span
                          className={`${styles.skillBadge} ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 600 }}>{q.correctCount}</span>
                      <span style={{ color: 'var(--color-muted-foreground)' }}>
                        {' '}
                        / {q.totalAttempts}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Row 5: Suspicious Students Table ===== */}
      <div className={styles.tableSection}>
        <div className={styles.tableSectionHeader}>
          <span className={styles.tableSectionTitle}>
            ⚠️ Danh sách sinh viên đáng ngờ
          </span>
          {stats.suspiciousCount > 0 && (
            <span className={styles.tableSectionBadge}>
              {stats.suspiciousCount} vi phạm
            </span>
          )}
        </div>

        {stats.suspiciousStudents.length === 0 ? (
          <div className={styles.emptyTableMsg}>
            ✅ Không có sinh viên vi phạm nào được ghi nhận.
          </div>
        ) : (
          <>
            <table className={styles.suspiciousTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sinh viên</th>
                  <th>Email</th>
                  <th
                    onClick={() => setSortSuspiciousAsc((v) => !v)}
                    style={{ userSelect: 'none' }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      Số vi phạm
                      <ArrowUpDown
                        style={{ width: '0.7rem', height: '0.7rem' }}
                      />
                    </span>
                  </th>
                  <th>Mức độ</th>
                </tr>
              </thead>
              <tbody>
                {displayedSuspicious.map((s, idx) => {
                  const level =
                    s.violationCount >= 5
                      ? {
                          label: 'Cao',
                          className: styles.levelHigh
                        }
                      : s.violationCount >= 3
                        ? {
                            label: 'Trung bình',
                            className: styles.levelMedium
                          }
                        : {
                            label: 'Thấp',
                            className: styles.levelLow
                          }
                  return (
                    <tr key={s.studentId}>
                      <td
                        style={{
                          color: 'var(--color-muted-foreground)',
                          fontSize: '0.72rem'
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td>
                        <div className={styles.studentCellInTable}>
                          <div className={styles.studentAvatar}>
                            {s.studentName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600 }}>
                            {s.studentName}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-muted-foreground)' }}>
                        {s.studentEmail}
                      </td>
                      <td>
                        <span className={styles.violationBadge}>
                          <AlertTriangle
                            style={{ width: '0.7rem', height: '0.7rem' }}
                          />
                          {s.violationCount}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.levelBadge} ${level.className}`}
                        >
                          {level.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {stats.suspiciousStudents.length > 5 && (
              <button
                onClick={() => setShowAllSuspicious((v) => !v)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: 'transparent',
                  border: 'none',
                  borderTop: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--color-muted-foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}
              >
                {showAllSuspicious ? (
                  <>
                    <ChevronUp style={{ width: '0.9rem' }} /> Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown style={{ width: '0.9rem' }} /> Xem thêm{' '}
                    {stats.suspiciousStudents.length - 5} sinh viên
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* ===== Row 5: Actionable Insight Box ===== */}
      {stats.questionTypeAccuracy.length > 0 &&
        (() => {
          const worst = [...stats.questionTypeAccuracy].sort(
            (a, b) => a.accuracy - b.accuracy
          )[0]
          if (worst.accuracy >= 80) return null
          const label =
            QUESTION_TYPE_LABELS[worst.questionType] ?? worst.questionType
          return (
            <div className={styles.insightBox}>
              <TrendingUp className={styles.insightIcon} />
              <div>
                <p className={styles.insightTitle}>💡 Gợi ý hành động</p>
                <p className={styles.insightText}>
                  Dạng câu <strong>{label}</strong> có tỷ lệ làm đúng thấp nhất
                  (<strong>{worst.accuracy.toFixed(1)}%</strong>). Hội đồng
                  khuyến nghị ôn lại phần này trong buổi học sắp tới.
                </p>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
