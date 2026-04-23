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
  BarChart2
} from 'lucide-react'
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

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 75) return '#22c55e'
  if (accuracy >= 50) return '#f59e0b'
  return '#ef4444'
}

// ===== Radar Chart (SVG) =====

interface RadarChartProps {
  data: QuestionTypeAccuracy[]
}

function RadarChart({ data }: RadarChartProps) {
  if (data.length === 0) return <p className={styles.empty}>Không có dữ liệu</p>

  const size = 220
  const cx = size / 2
  const cy = size / 2
  const radius = 80
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
          fill="rgba(99,102,241,0.2)"
          stroke="#6366f1"
          strokeWidth="2"
        />
        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r="4"
            fill="#6366f1"
            stroke="#fff"
            strokeWidth="1.5"
          />
        ))}
        {/* Labels */}
        {angles.map((a, i) => {
          const labelR = radius + 22
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

  const scoreDistMax = Math.max(
    ...stats.scoreDistribution.map((b) => b.count),
    1
  )

  const DIST_COLORS = [
    styles.barFillRed,
    styles.barFillYellow,
    styles.barFillGreen,
    styles.barFillBlue
  ]

  const displayedSuspicious = showAllSuspicious
    ? stats.suspiciousStudents
    : stats.suspiciousStudents.slice(0, 5)

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
            <span className={styles.kpiValue}>
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

        <div className={styles.kpiCard}>
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

      {/* ===== Row 2: Charts ===== */}
      <div className={styles.chartsGrid}>
        {/* Bar Chart: Score Distribution */}
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>📊 Phổ điểm</p>
          <p className={styles.chartSubtitle}>
            Phân bổ số bài theo dải điểm (quy đổi /10)
          </p>
          <div className={styles.barChart}>
            {stats.scoreDistribution.map((bucket, i) => {
              const pct =
                scoreDistMax > 0 ? (bucket.count / scoreDistMax) * 100 : 0
              return (
                <div key={bucket.range} className={styles.barRow}>
                  <span className={styles.barLabel}>{bucket.range}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${DIST_COLORS[i]}`}
                      style={{
                        width: `${Math.max(pct, bucket.count > 0 ? 8 : 0)}%`
                      }}
                    >
                      {bucket.count > 0 ? bucket.count : ''}
                    </div>
                  </div>
                  <span className={styles.barCount}>{bucket.count}</span>
                </div>
              )
            })}
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

        {/* Horizontal Skill Bars */}
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>🧪 Chi tiết năng lực từng loại</p>
          <p className={styles.chartSubtitle}>
            Tỷ lệ câu trả lời đúng (%) theo loại câu SQL
          </p>
          {stats.questionTypeAccuracy.length === 0 ? (
            <p className={styles.empty}>Chưa có dữ liệu chấm</p>
          ) : (
            <div className={styles.skillChart}>
              {stats.questionTypeAccuracy.map((item) => {
                const label =
                  QUESTION_TYPE_LABELS[item.questionType] ?? item.questionType
                const color = getAccuracyColor(item.accuracy)
                return (
                  <div key={item.questionType} className={styles.skillRow}>
                    <div className={styles.skillMeta}>
                      <span className={styles.skillName}>{label}</span>
                      <span className={styles.skillAccuracy} style={{ color }}>
                        {item.accuracy.toFixed(1)}%
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--color-muted-foreground)',
                            fontWeight: 400,
                            marginLeft: '0.25rem'
                          }}
                        >
                          ({item.correctCount}/{item.totalAttempts})
                        </span>
                      </span>
                    </div>
                    <div className={styles.skillTrack}>
                      <div
                        className={styles.skillFill}
                        style={{
                          width: `${item.accuracy}%`,
                          background: color
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== Row 3: Suspicious Students Table ===== */}
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
                  <th>Số vi phạm</th>
                  <th>Mức độ</th>
                </tr>
              </thead>
              <tbody>
                {displayedSuspicious.map((s, idx) => {
                  const level =
                    s.violationCount >= 5
                      ? { label: 'Cao', color: '#ef4444' }
                      : s.violationCount >= 3
                        ? { label: 'Trung bình', color: '#f59e0b' }
                        : { label: 'Thấp', color: '#3b82f6' }
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
                      <td style={{ fontWeight: 600 }}>{s.studentName}</td>
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
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: level.color
                          }}
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

      {/* ===== Actionable Insight Box ===== */}
      {stats.questionTypeAccuracy.length > 0 &&
        (() => {
          const worst = [...stats.questionTypeAccuracy].sort(
            (a, b) => a.accuracy - b.accuracy
          )[0]
          if (worst.accuracy >= 80) return null
          const label =
            QUESTION_TYPE_LABELS[worst.questionType] ?? worst.questionType
          return (
            <div
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '0.75rem',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <TrendingUp
                style={{
                  width: '1.1rem',
                  height: '1.1rem',
                  color: '#ef4444',
                  marginTop: '0.1rem',
                  flexShrink: 0
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#ef4444',
                    marginBottom: '0.2rem'
                  }}
                >
                  💡 Gợi ý hành động
                </p>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-foreground)'
                  }}
                >
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
