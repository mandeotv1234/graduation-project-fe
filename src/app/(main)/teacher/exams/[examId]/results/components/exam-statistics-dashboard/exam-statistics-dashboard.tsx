'use client'

import * as React from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  Award,
  BarChart2,
  Braces,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Clock,
  Code2,
  Database,
  ListChecks,
  Percent,
  SearchCode,
  ShieldAlert,
  Table2,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Workflow,
  XCircle,
  Zap
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DOMPurify from 'dompurify'
import styles from './exam-statistics-dashboard.module.scss'
import type {
  ExamStatistics,
  PerQuestionAccuracy,
  QuestionTypeAccuracy,
  ScoreDistributionBucket
} from '@/lib/types'

interface ExamStatisticsDashboardProps {
  stats: ExamStatistics
}

type QuestionSort = 'weakest' | 'order' | 'strongest'

interface QuestionTypeMeta {
  label: string
  Icon: LucideIcon
}

interface ScoreBand {
  label: string
  count: number
  className: string
}

const QUESTION_TYPE_META: Record<string, QuestionTypeMeta> = {
  CREATE_TABLE: { label: 'Tạo bảng', Icon: Table2 },
  INSERT_DATA: { label: 'Thêm dữ liệu', Icon: Database },
  SELECT_QUERY: { label: 'Truy vấn', Icon: SearchCode },
  TRIGGER: { label: 'Trigger', Icon: Zap },
  FUNCTION: { label: 'Function', Icon: Braces },
  STORED_PROCEDURE: { label: 'Stored procedure', Icon: Workflow }
}

const SCORE_BAR_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1'
]

function cssVars(vars: Record<`--${string}`, string>): React.CSSProperties {
  return vars as React.CSSProperties
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatPercent(value: number, fractionDigits = 1) {
  return `${value.toFixed(fractionDigits)}%`
}

function getQuestionTypeMeta(questionType: string): QuestionTypeMeta {
  return (
    QUESTION_TYPE_META[questionType] ?? { label: questionType, Icon: Code2 }
  )
}

function getAccuracyClass(accuracy: number) {
  if (accuracy >= 80) return styles.toneExcellent
  if (accuracy >= 65) return styles.toneGood
  if (accuracy >= 50) return styles.toneAverage
  return styles.toneWeak
}

function getScoreClass(score: number) {
  if (score >= 8) return styles.toneExcellent
  if (score >= 6.5) return styles.toneGood
  if (score >= 5) return styles.toneAverage
  return styles.toneWeak
}

function getAccuracyLabel(accuracy: number) {
  if (accuracy >= 80) return 'Rất tốt'
  if (accuracy >= 65) return 'Ổn định'
  if (accuracy >= 50) return 'Cần theo dõi'
  return 'Cần ôn tập'
}

function sanitizeQuestionContent(content: string, fallback: string) {
  return DOMPurify.sanitize(content || fallback, {
    ALLOWED_TAGS: [
      'b',
      'strong',
      'i',
      'em',
      'u',
      'p',
      'br',
      'span',
      'code',
      'pre',
      'ul',
      'ol',
      'li'
    ],
    ALLOWED_ATTR: ['class']
  })
}

function sumBuckets(
  buckets: ScoreDistributionBucket[],
  predicate: (index: number) => boolean
) {
  return buckets.reduce(
    (sum, bucket, index) => (predicate(index) ? sum + bucket.count : sum),
    0
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  tone
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  detail: React.ReactNode
  tone: string
}) {
  return (
    <div className={styles.kpiCard}>
      <div className={`${styles.kpiIcon} ${tone}`}>
        <Icon />
      </div>
      <div className={styles.kpiContent}>
        <span className={styles.kpiLabel}>{label}</span>
        <span className={styles.kpiValue}>{value}</span>
        <span className={styles.kpiDetail}>{detail}</span>
      </div>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  aside
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  aside?: React.ReactNode
}) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitleBlock}>
        <span className={styles.sectionIcon}>
          <Icon />
        </span>
        <div>
          <h3 className={styles.sectionTitle}>{title}</h3>
          {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
        </div>
      </div>
      {aside && <div className={styles.sectionAside}>{aside}</div>}
    </div>
  )
}

function PassFailDonut({
  passRate,
  passCount,
  failCount
}: {
  passRate: number
  passCount: number
  failCount: number
}) {
  const size = 148
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset =
    circumference - (clampPercentage(passRate) / 100) * circumference

  return (
    <div className={styles.donutBlock}>
      <svg
        className={styles.donutSvg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--donut-track)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--donut-pass)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={styles.donutCenter}>
        <span className={styles.donutValue}>{formatPercent(passRate, 1)}</span>
        <span className={styles.donutLabel}>qua môn</span>
      </div>
      <div className={styles.donutLegend}>
        <span>
          <CheckCircle2 />
          {formatNumber(passCount)} đạt
        </span>
        <span>
          <XCircle />
          {formatNumber(failCount)} chưa đạt
        </span>
      </div>
    </div>
  )
}

function ScoreBands({ bands, total }: { bands: ScoreBand[]; total: number }) {
  return (
    <div className={styles.scoreBands}>
      <div className={styles.bandTrack}>
        {bands.map((band) => {
          const width = total > 0 ? (band.count / total) * 100 : 0
          return (
            <span
              key={band.label}
              className={`${styles.bandSegment} ${band.className}`}
              style={cssVars({
                '--band-width': `${Math.max(width, band.count > 0 ? 3 : 0)}%`
              })}
            />
          )
        })}
      </div>
      <div className={styles.bandLegend}>
        {bands.map((band) => (
          <div key={band.label} className={styles.bandLegendItem}>
            <span className={`${styles.bandDot} ${band.className}`} />
            <div>
              <span>{band.label}</span>
              <strong>{formatNumber(band.count)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreHistogram({ buckets }: { buckets: ScoreDistributionBucket[] }) {
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1)
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0)

  return (
    <div className={styles.histogram}>
      <div className={styles.histogramPlot}>
        <div
          className={styles.thresholdLine}
          style={cssVars({ '--threshold-left': '50%' })}
        >
          <span>5.0</span>
        </div>
        {buckets.map((bucket, index) => {
          const height = (bucket.count / maxCount) * 100
          const percentOfTotal = total > 0 ? (bucket.count / total) * 100 : 0
          return (
            <div key={bucket.range} className={styles.histogramColumn}>
              <div className={styles.histogramTooltip}>
                <strong>{formatNumber(bucket.count)}</strong>
                <span>{formatPercent(percentOfTotal, 1)}</span>
              </div>
              <span className={styles.histogramCount}>{bucket.count}</span>
              <span
                className={styles.histogramBar}
                style={cssVars({
                  '--bar-height': `${Math.max(height, bucket.count > 0 ? 5 : 0)}%`,
                  '--bar-color':
                    SCORE_BAR_COLORS[index] ??
                    SCORE_BAR_COLORS[SCORE_BAR_COLORS.length - 1]
                })}
              />
              <span className={styles.histogramLabel}>{bucket.range}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RadarChart({ data }: { data: QuestionTypeAccuracy[] }) {
  if (data.length === 0) {
    return <p className={styles.emptyState}>Chưa có dữ liệu loại câu.</p>
  }

  if (data.length < 3) {
    return (
      <div className={styles.typeRows}>
        {data.map((item) => (
          <QuestionTypeRow key={item.questionType} item={item} />
        ))}
      </div>
    )
  }

  const size = 280
  const center = size / 2
  const radius = 88
  const axisCount = data.length
  const levels = [25, 50, 75, 100]

  function polarPoint(index: number, value: number) {
    const angle = (Math.PI * 2 * index) / axisCount
    const distance = (value / 100) * radius
    return {
      x: center + distance * Math.sin(angle),
      y: center - distance * Math.cos(angle)
    }
  }

  function polygonPoints(value: number) {
    return data
      .map((_, index) => {
        const point = polarPoint(index, value)
        return `${point.x.toFixed(1)},${point.y.toFixed(1)}`
      })
      .join(' ')
  }

  const dataPoints = data
    .map((item, index) => {
      const point = polarPoint(index, clampPercentage(item.accuracy))
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className={styles.radarLayout}>
      <svg className={styles.radarSvg} viewBox={`0 0 ${size} ${size}`}>
        {levels.map((level) => (
          <polygon
            key={level}
            points={polygonPoints(level)}
            className={styles.radarGrid}
          />
        ))}
        {data.map((item, index) => {
          const end = polarPoint(index, 100)
          const label = polarPoint(index, 118)
          const meta = getQuestionTypeMeta(item.questionType)
          return (
            <React.Fragment key={item.questionType}>
              <line
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                className={styles.radarAxis}
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={styles.radarLabel}
              >
                {meta.label}
              </text>
            </React.Fragment>
          )
        })}
        <polygon points={dataPoints} className={styles.radarArea} />
        {data.map((item, index) => {
          const point = polarPoint(index, clampPercentage(item.accuracy))
          return (
            <circle
              key={item.questionType}
              cx={point.x}
              cy={point.y}
              r="4"
              className={styles.radarPoint}
            />
          )
        })}
      </svg>
      <div className={styles.radarSummary}>
        {data.map((item) => {
          const meta = getQuestionTypeMeta(item.questionType)
          return (
            <span key={item.questionType}>
              {meta.label}
              <strong>{formatPercent(item.accuracy, 0)}</strong>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function QuestionTypeRow({ item }: { item: QuestionTypeAccuracy }) {
  const meta = getQuestionTypeMeta(item.questionType)
  const wrongCount = Math.max(item.totalAttempts - item.correctCount, 0)
  const accuracy = clampPercentage(item.accuracy)
  const Icon = meta.Icon

  return (
    <div className={styles.typeRow}>
      <div className={styles.typeMain}>
        <span className={styles.typeIcon}>
          <Icon />
        </span>
        <div>
          <span className={styles.typeName}>{meta.label}</span>
          <span className={styles.typeDetail}>
            {formatNumber(item.correctCount)} đúng /{' '}
            {formatNumber(item.totalAttempts)} lượt
          </span>
        </div>
      </div>
      <div className={styles.typeChart}>
        <div className={styles.typeStack}>
          <span
            className={styles.typeStackCorrect}
            style={cssVars({ '--stack-width': `${accuracy}%` })}
          />
          <span
            className={styles.typeStackWrong}
            style={cssVars({
              '--stack-width': `${100 - accuracy}%`
            })}
          />
        </div>
        <div className={styles.typeNumbers}>
          <strong className={getAccuracyClass(item.accuracy)}>
            {formatPercent(item.accuracy, 1)}
          </strong>
          <span>{formatNumber(wrongCount)} sai</span>
        </div>
      </div>
    </div>
  )
}

function HardQuestionList({ questions }: { questions: PerQuestionAccuracy[] }) {
  if (questions.length === 0) {
    return <p className={styles.emptyState}>Chưa có dữ liệu từng câu.</p>
  }

  return (
    <div className={styles.hardQuestionList}>
      {questions.slice(0, 5).map((question, index) => {
        const meta = getQuestionTypeMeta(question.questionType)
        const Icon = meta.Icon
        return (
          <div key={question.questionId} className={styles.hardQuestionItem}>
            <span className={styles.rankBadge}>{index + 1}</span>
            <div className={styles.hardQuestionBody}>
              <div className={styles.hardQuestionTop}>
                <span>
                  Câu {question.orderIndex}
                  <span className={styles.dotSeparator}>•</span>
                  {meta.label}
                </span>
                <strong className={getAccuracyClass(question.accuracy)}>
                  {formatPercent(question.accuracy, 1)}
                </strong>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={`${styles.progressFill} ${getAccuracyClass(
                    question.accuracy
                  )}`}
                  style={cssVars({
                    '--progress-width': `${clampPercentage(question.accuracy)}%`
                  })}
                />
              </div>
              <div className={styles.hardQuestionBottom}>
                <span>
                  <Icon />
                  {formatNumber(question.correctCount)} đúng /{' '}
                  {formatNumber(question.totalAttempts)}
                </span>
                <span>{getAccuracyLabel(question.accuracy)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QuestionTable({
  questions,
  questionSort,
  onQuestionSortChange
}: {
  questions: PerQuestionAccuracy[]
  questionSort: QuestionSort
  onQuestionSortChange: (sort: QuestionSort) => void
}) {
  return (
    <div className={styles.tableSection}>
      <SectionHeader
        icon={ListChecks}
        title="Chi tiết từng câu hỏi"
        subtitle={`${questions.length} câu, sắp xếp theo chế độ đang chọn`}
        aside={
          <div className={styles.segmentControl}>
            <button
              className={questionSort === 'weakest' ? styles.activeSegment : ''}
              onClick={() => onQuestionSortChange('weakest')}
              type="button"
            >
              Câu khó
            </button>
            <button
              className={questionSort === 'order' ? styles.activeSegment : ''}
              onClick={() => onQuestionSortChange('order')}
              type="button"
            >
              Thứ tự
            </button>
            <button
              className={
                questionSort === 'strongest' ? styles.activeSegment : ''
              }
              onClick={() => onQuestionSortChange('strongest')}
              type="button"
            >
              Câu dễ
            </button>
          </div>
        }
      />
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Câu</th>
              <th>Nội dung</th>
              <th>Loại câu</th>
              <th>Tỷ lệ đúng</th>
              <th>Đúng / Tổng</th>
              <th>Nhận định</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => {
              const meta = getQuestionTypeMeta(question.questionType)
              const Icon = meta.Icon
              return (
                <tr key={question.questionId}>
                  <td>
                    <span className={styles.questionIndex}>
                      {question.orderIndex}
                    </span>
                  </td>
                  <td className={styles.questionContentCell}>
                    <div
                      className={styles.questionContent}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeQuestionContent(
                          question.content,
                          `Câu ${question.orderIndex}`
                        )
                      }}
                    />
                  </td>
                  <td>
                    <span className={styles.questionTypeBadge}>
                      <Icon />
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    <div className={styles.accuracyCell}>
                      <div className={styles.progressTrack}>
                        <span
                          className={`${styles.progressFill} ${getAccuracyClass(
                            question.accuracy
                          )}`}
                          style={cssVars({
                            '--progress-width': `${clampPercentage(
                              question.accuracy
                            )}%`
                          })}
                        />
                      </div>
                      <strong className={getAccuracyClass(question.accuracy)}>
                        {formatPercent(question.accuracy, 1)}
                      </strong>
                    </div>
                  </td>
                  <td>
                    <span className={styles.countPair}>
                      <strong>{formatNumber(question.correctCount)}</strong>
                      <span>/ {formatNumber(question.totalAttempts)}</span>
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${getAccuracyClass(
                        question.accuracy
                      )}`}
                    >
                      {getAccuracyLabel(question.accuracy)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ExamStatisticsDashboard({
  stats
}: ExamStatisticsDashboardProps) {
  const [showAllSuspicious, setShowAllSuspicious] = React.useState(false)
  const [sortSuspiciousAsc, setSortSuspiciousAsc] = React.useState(false)
  const [questionSort, setQuestionSort] =
    React.useState<QuestionSort>('weakest')

  const totalScoreRows = React.useMemo(
    () =>
      stats.scoreDistribution.reduce((sum, bucket) => sum + bucket.count, 0),
    [stats.scoreDistribution]
  )

  const passCount = Math.round((stats.passRate / 100) * totalScoreRows)
  const failCount = Math.max(totalScoreRows - passCount, 0)

  const scoreBands = React.useMemo<ScoreBand[]>(
    () => [
      {
        label: 'Dưới 5',
        count: sumBuckets(stats.scoreDistribution, (index) => index < 5),
        className: styles.bandWeak
      },
      {
        label: '5 đến 8',
        count: sumBuckets(
          stats.scoreDistribution,
          (index) => index >= 5 && index < 8
        ),
        className: styles.bandAverage
      },
      {
        label: '8 trở lên',
        count: sumBuckets(stats.scoreDistribution, (index) => index >= 8),
        className: styles.bandStrong
      }
    ],
    [stats.scoreDistribution]
  )

  const sortedQuestions = React.useMemo(() => {
    const questions = [...stats.perQuestionAccuracy]
    if (questionSort === 'order') {
      return questions.sort((a, b) => a.orderIndex - b.orderIndex)
    }
    if (questionSort === 'strongest') {
      return questions.sort((a, b) => b.accuracy - a.accuracy)
    }
    return questions.sort((a, b) => a.accuracy - b.accuracy)
  }, [questionSort, stats.perQuestionAccuracy])

  const weakestQuestion = sortedQuestions[0]
  const hardestQuestions = React.useMemo(
    () =>
      [...stats.perQuestionAccuracy].sort((a, b) => a.accuracy - b.accuracy),
    [stats.perQuestionAccuracy]
  )

  const weakestType = React.useMemo(
    () =>
      stats.questionTypeAccuracy.length > 0
        ? [...stats.questionTypeAccuracy].sort(
            (a, b) => a.accuracy - b.accuracy
          )[0]
        : null,
    [stats.questionTypeAccuracy]
  )

  const strongestType = React.useMemo(
    () =>
      stats.questionTypeAccuracy.length > 0
        ? [...stats.questionTypeAccuracy].sort(
            (a, b) => b.accuracy - a.accuracy
          )[0]
        : null,
    [stats.questionTypeAccuracy]
  )

  const displayedSuspicious = React.useMemo(() => {
    const sorted = [...stats.suspiciousStudents].sort((a, b) =>
      sortSuspiciousAsc
        ? a.violationCount - b.violationCount
        : b.violationCount - a.violationCount
    )
    return showAllSuspicious ? sorted : sorted.slice(0, 5)
  }, [showAllSuspicious, sortSuspiciousAsc, stats.suspiciousStudents])

  const weakestTypeMeta = weakestType
    ? getQuestionTypeMeta(weakestType.questionType)
    : null
  const strongestTypeMeta = strongestType
    ? getQuestionTypeMeta(strongestType.questionType)
    : null

  if (stats.totalSubmissions === 0) {
    return (
      <div className={styles.noDataState}>
        <BarChart2 />
        <p>Chưa có dữ liệu thống kê.</p>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.overviewHeader}>
        <div>
          <span className={styles.eyebrow}>Thống kê kết quả</span>
          <h2>Tổng quan bài thi</h2>
          <p>
            {formatNumber(stats.totalSubmittedStudents)} sinh viên,{' '}
            {formatNumber(stats.totalSubmissions)} lượt nộp đã ghi nhận.
          </p>
        </div>
        <div className={styles.headerMetric}>
          <span>Điểm trung bình</span>
          <strong className={getScoreClass(stats.averageScore)}>
            {stats.averageScore.toFixed(1)}
          </strong>
          <span>/10</span>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard
          icon={Users}
          label="Sinh viên đã nộp"
          value={formatNumber(stats.totalSubmittedStudents)}
          detail={`${formatNumber(stats.totalSubmissions)} lượt nộp`}
          tone={styles.iconBlue}
        />
        <KpiCard
          icon={CircleGauge}
          label="Điểm trung bình"
          value={
            <span className={getScoreClass(stats.averageScore)}>
              {stats.averageScore.toFixed(1)}
            </span>
          }
          detail={`Min ${stats.minScore.toFixed(1)} - Max ${stats.maxScore.toFixed(1)}`}
          tone={styles.iconTeal}
        />
        <KpiCard
          icon={Percent}
          label="Tỷ lệ qua môn"
          value={formatPercent(stats.passRate, 1)}
          detail={`${formatNumber(passCount)} đạt, ${formatNumber(failCount)} chưa đạt`}
          tone={styles.iconGreen}
        />
        <KpiCard
          icon={Timer}
          label="Lệch thời gian TB"
          value={`${stats.avgCompletionTimeMinutes.toFixed(0)} phút`}
          detail="So với mốc kết thúc bài"
          tone={styles.iconOrange}
        />
        <KpiCard
          icon={ShieldAlert}
          label="Sinh viên vi phạm"
          value={formatNumber(stats.suspiciousCount)}
          detail={
            stats.suspiciousCount > 0
              ? 'Cần rà soát phiên thi'
              : 'Không có cảnh báo'
          }
          tone={stats.suspiciousCount > 0 ? styles.iconRed : styles.iconGreen}
        />
        <KpiCard
          icon={Trophy}
          label="Nhóm điểm cao"
          value={formatNumber(scoreBands[2]?.count ?? 0)}
          detail="Bài đạt từ 8/10 trở lên"
          tone={styles.iconIndigo}
        />
      </div>

      <div className={styles.scoreGrid}>
        <section className={styles.chartCard}>
          <SectionHeader
            icon={BarChart2}
            title="Phổ điểm"
            subtitle="Phân bố theo thang điểm 10"
          />
          <ScoreHistogram buckets={stats.scoreDistribution} />
        </section>

        <section className={styles.chartCard}>
          <SectionHeader
            icon={Award}
            title="Tỷ lệ đạt"
            subtitle="Ngưỡng đạt từ 5/10"
          />
          <PassFailDonut
            passRate={stats.passRate}
            passCount={passCount}
            failCount={failCount}
          />
          <ScoreBands bands={scoreBands} total={totalScoreRows} />
        </section>
      </div>

      <div className={styles.analysisGrid}>
        <section className={styles.chartCard}>
          <SectionHeader
            icon={Target}
            title="Năng lực theo loại câu"
            subtitle="Tỷ lệ đúng trên từng nhóm kỹ năng SQL"
          />
          <RadarChart data={stats.questionTypeAccuracy} />
        </section>

        <section className={styles.chartCard}>
          <SectionHeader
            icon={Activity}
            title="Đúng sai theo dạng"
            subtitle="So sánh số lượt đúng và sai"
          />
          <div className={styles.typeRows}>
            {stats.questionTypeAccuracy.length === 0 ? (
              <p className={styles.emptyState}>Chưa có dữ liệu loại câu.</p>
            ) : (
              stats.questionTypeAccuracy.map((item) => (
                <QuestionTypeRow key={item.questionType} item={item} />
              ))
            )}
          </div>
        </section>
      </div>

      <div className={styles.insightGrid}>
        <div className={styles.insightItem}>
          <span className={`${styles.insightIcon} ${styles.iconRed}`}>
            <AlertTriangle />
          </span>
          <div>
            <span className={styles.insightLabel}>Câu cần chú ý</span>
            <strong>
              {weakestQuestion
                ? `Câu ${weakestQuestion.orderIndex} - ${formatPercent(
                    weakestQuestion.accuracy,
                    1
                  )}`
                : 'Chưa có dữ liệu'}
            </strong>
          </div>
        </div>
        <div className={styles.insightItem}>
          <span className={`${styles.insightIcon} ${styles.iconOrange}`}>
            <TrendingUp />
          </span>
          <div>
            <span className={styles.insightLabel}>Dạng yếu nhất</span>
            <strong>
              {weakestType && weakestTypeMeta
                ? `${weakestTypeMeta.label} - ${formatPercent(
                    weakestType.accuracy,
                    1
                  )}`
                : 'Chưa có dữ liệu'}
            </strong>
          </div>
        </div>
        <div className={styles.insightItem}>
          <span className={`${styles.insightIcon} ${styles.iconGreen}`}>
            <CheckCircle2 />
          </span>
          <div>
            <span className={styles.insightLabel}>Dạng tốt nhất</span>
            <strong>
              {strongestType && strongestTypeMeta
                ? `${strongestTypeMeta.label} - ${formatPercent(
                    strongestType.accuracy,
                    1
                  )}`
                : 'Chưa có dữ liệu'}
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.questionFocusGrid}>
        <section className={styles.chartCard}>
          <SectionHeader
            icon={AlertTriangle}
            title="Top câu khó"
            subtitle="Các câu có tỷ lệ đúng thấp nhất"
          />
          <HardQuestionList questions={hardestQuestions} />
        </section>

        <section className={styles.chartCard}>
          <SectionHeader
            icon={Clock}
            title="Nhịp độ làm bài"
            subtitle="Tổng hợp theo thời điểm nộp và vi phạm"
          />
          <div className={styles.paceGrid}>
            <div>
              <span>Chênh lệch thời gian TB</span>
              <strong>{stats.avgCompletionTimeMinutes.toFixed(0)} phút</strong>
            </div>
            <div>
              <span>Số cảnh báo</span>
              <strong>{formatNumber(stats.suspiciousCount)}</strong>
            </div>
            <div>
              <span>Nhóm dưới 5</span>
              <strong>{formatNumber(scoreBands[0]?.count ?? 0)}</strong>
            </div>
            <div>
              <span>Nhóm từ 8</span>
              <strong>{formatNumber(scoreBands[2]?.count ?? 0)}</strong>
            </div>
          </div>
        </section>
      </div>

      <QuestionTable
        questions={sortedQuestions}
        questionSort={questionSort}
        onQuestionSortChange={setQuestionSort}
      />

      <div className={styles.tableSection}>
        <SectionHeader
          icon={ShieldAlert}
          title="Sinh viên có cảnh báo"
          subtitle={
            stats.suspiciousStudents.length > 0
              ? `${stats.suspiciousStudents.length} sinh viên được ghi nhận`
              : 'Không có cảnh báo trong dữ liệu hiện tại'
          }
          aside={
            stats.suspiciousStudents.length > 1 ? (
              <button
                className={styles.sortButton}
                onClick={() => setSortSuspiciousAsc((value) => !value)}
                type="button"
              >
                <ArrowUpDown />
                {sortSuspiciousAsc ? 'Ít trước' : 'Nhiều trước'}
              </button>
            ) : null
          }
        />

        {stats.suspiciousStudents.length === 0 ? (
          <div className={styles.emptyTableMsg}>
            <CheckCircle2 />
            <span>Không có sinh viên vi phạm nào được ghi nhận.</span>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
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
                  {displayedSuspicious.map((student, index) => {
                    const level =
                      student.violationCount >= 5
                        ? {
                            label: 'Cao',
                            className: styles.toneWeak
                          }
                        : student.violationCount >= 3
                          ? {
                              label: 'Trung bình',
                              className: styles.toneAverage
                            }
                          : {
                              label: 'Thấp',
                              className: styles.toneGood
                            }
                    return (
                      <tr key={student.studentId}>
                        <td>
                          <span className={styles.rowIndex}>{index + 1}</span>
                        </td>
                        <td>
                          <div className={styles.studentCell}>
                            <span className={styles.studentAvatar}>
                              {student.studentName.charAt(0).toUpperCase()}
                            </span>
                            <strong>{student.studentName}</strong>
                          </div>
                        </td>
                        <td className={styles.emailCell}>
                          {student.studentEmail}
                        </td>
                        <td>
                          <span className={styles.violationBadge}>
                            <AlertTriangle />
                            {formatNumber(student.violationCount)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${level.className}`}
                          >
                            {level.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {stats.suspiciousStudents.length > 5 && (
              <button
                className={styles.expandButton}
                onClick={() => setShowAllSuspicious((value) => !value)}
                type="button"
              >
                {showAllSuspicious ? <ChevronUp /> : <ChevronDown />}
                {showAllSuspicious
                  ? 'Thu gọn'
                  : `Xem thêm ${stats.suspiciousStudents.length - 5} sinh viên`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
