'use client'

import DOMPurify from 'dompurify'
import {
  AlertTriangle,
  BookOpen,
  CircleGauge,
  ListChecks,
  Target,
  TrendingUp
} from 'lucide-react'
import type { CSSProperties } from 'react'

import type {
  ExamMutationAnalytics,
  MutationStat,
  QuestionMutationSummary
} from '@/lib/types'

import styles from './mutation-analytics.module.scss'

interface MutationAnalyticsProps {
  data: ExamMutationAnalytics
}

const MUTATION_COLORS: Record<string, string> = {
  MISSING_JOIN_CONDITION: '#ef4444',
  WRONG_JOIN_TYPE: '#f97316',
  NULL_HANDLING: '#eab308',
  WRONG_AGGREGATE: '#8b5cf6',
  MISSING_GROUP_BY: '#ec4899',
  WRONG_HAVING_VS_WHERE: '#06b6d4',
  STRING_MATCHING: '#84cc16',
  MISSING_WHERE_FILTER: '#f43f5e',
  HAPPY_PATH: '#64748b'
}

const MUTATION_LABELS: Record<string, string> = {
  MISSING_JOIN_CONDITION: 'Thiếu điều kiện JOIN',
  WRONG_JOIN_TYPE: 'Sai loại JOIN',
  NULL_HANDLING: 'Xử lý NULL sai',
  WRONG_AGGREGATE: 'Hàm tổng hợp sai',
  MISSING_GROUP_BY: 'Thiếu GROUP BY',
  WRONG_HAVING_VS_WHERE: 'Nhầm HAVING/WHERE',
  STRING_MATCHING: 'Điều kiện chuỗi sai',
  MISSING_WHERE_FILTER: 'Thiếu điều kiện WHERE',
  HAPPY_PATH: 'Logic chính'
}

const HTML_ENTITY_MAP: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' '
}

function cssVars(vars: Record<`--${string}`, string>) {
  return vars as CSSProperties
}

function decodeHtmlEntities(content: string) {
  let decoded = content

  for (let index = 0; index < 3; index += 1) {
    const next = decoded.replace(
      /&(lt|gt|amp|quot|#39|apos|nbsp);/g,
      (entity) => HTML_ENTITY_MAP[entity] ?? entity
    )

    if (next === decoded) break
    decoded = next
  }

  return decoded
}

function sanitizeQuestionTitle(content: string, fallback: string) {
  return DOMPurify.sanitize(decodeHtmlEntities(content || fallback), {
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

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function formatPercentFromRatio(value: number) {
  return `${Math.round(clampPercentage(value * 100))}%`
}

function formatScore(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1
  }).format(value)
}

function getPassTone(passRatePct: number) {
  if (passRatePct >= 80) return styles.toneGood
  if (passRatePct >= 50) return styles.toneMedium
  return styles.toneBad
}

function getMutationLabel(type: string) {
  return MUTATION_LABELS[type] ?? type
}

function FailRateBar({ stat }: { stat: MutationStat }) {
  const color = MUTATION_COLORS[stat.mutationType] ?? '#64748b'
  const pct = Math.round(clampPercentage(stat.failRate * 100))

  return (
    <div
      className={styles.failRateBar}
      style={cssVars({
        '--mutation-color': color,
        '--mutation-width': `${pct}%`
      })}
    >
      <div className={styles.failRateHeader}>
        <span className={styles.failRateLabel}>{stat.label}</span>
        <span className={styles.failRateValue}>
          {pct}% · {stat.failCount} SV
        </span>
      </div>
      <div className={styles.failTrack}>
        <span className={styles.failFill} />
      </div>
      {stat.avgDeduction > 0 && (
        <span className={styles.deductionText}>
          Trừ TB {formatScore(stat.avgDeduction)} điểm
        </span>
      )}
    </div>
  )
}

function QuestionCard({ summary }: { summary: QuestionMutationSummary }) {
  const passRatePct = Math.round(clampPercentage(summary.passRate * 100))
  const hasWarnings = summary.rubricHealthWarnings.length > 0
  const sortedBreakdown = [...summary.mutationBreakdown].sort(
    (a, b) => b.failRate - a.failRate
  )
  const topMutation = sortedBreakdown[0]

  return (
    <article className={styles.questionCard}>
      <header className={styles.questionHeader}>
        <div className={styles.questionInfo}>
          <span className={styles.questionIndex}>Câu {summary.orderIndex}</span>
          <div
            className={styles.questionTitleHtml}
            dangerouslySetInnerHTML={{
              __html: sanitizeQuestionTitle(
                summary.questionTitle,
                `Câu ${summary.orderIndex}`
              )
            }}
          />
        </div>
        <div className={`${styles.passBadge} ${getPassTone(passRatePct)}`}>
          <strong>{passRatePct}%</strong>
          <span>đúng</span>
        </div>
      </header>

      <div className={styles.scoreStrip}>
        <div>
          <span>Điểm TB</span>
          <strong>{formatScore(summary.avgScore)}</strong>
        </div>
        <div>
          <span>Thang điểm</span>
          <strong>{formatScore(summary.maxScore)}</strong>
        </div>
        {topMutation && (
          <div>
            <span>Lỗi nổi bật</span>
            <strong>{topMutation.label}</strong>
          </div>
        )}
      </div>

      <div className={styles.breakdownBlock}>
        <div className={styles.blockTitle}>
          <ListChecks />
          Phân tích loại lỗi
        </div>
        <div className={styles.breakdownList}>
          {sortedBreakdown.map((stat) => (
            <FailRateBar key={stat.mutationType} stat={stat} />
          ))}
        </div>
      </div>

      {hasWarnings && (
        <div className={styles.warningList}>
          {summary.rubricHealthWarnings.map((warning) => (
            <div key={warning} className={styles.warningItem}>
              <AlertTriangle />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export function MutationAnalytics({ data }: MutationAnalyticsProps) {
  const { totalStudents, questionSummaries, globalInsights } = data
  const analyzedQuestions = questionSummaries.filter(
    (question) => question.mutationBreakdown.length > 0
  )
  const hasData = analyzedQuestions.length > 0
  const averagePassRate = hasData
    ? analyzedQuestions.reduce((sum, question) => sum + question.passRate, 0) /
      analyzedQuestions.length
    : 0
  const warningCount = analyzedQuestions.reduce(
    (sum, question) => sum + question.rubricHealthWarnings.length,
    0
  )
  const weakestQuestion = analyzedQuestions.reduce<
    QuestionMutationSummary | undefined
  >((weakest, question) => {
    if (!weakest) return question
    return question.passRate < weakest.passRate ? question : weakest
  }, undefined)
  const topMutationTypes = globalInsights.topMutationTypes ?? []
  const studyRecommendations = globalInsights.studyRecommendations ?? []

  if (!hasData) {
    return (
      <section className={styles.emptyState}>
        <Target />
        <h2>Chưa có dữ liệu phân tích lỗi</h2>
        <p>Dữ liệu sẽ xuất hiện khi rubric có mutation_type trong test case.</p>
      </section>
    )
  }

  return (
    <div className={styles.analyticsPage}>
      <section className={styles.overviewPanel}>
        <div className={styles.overviewCopy}>
          <span className={styles.eyebrow}>Phân tích lỗi</span>
          <h2>Tổng quan lỗi theo câu hỏi</h2>
          <p>
            Theo dõi nhóm lỗi sinh viên mắc nhiều nhất, câu cần ưu tiên xem lại
            và gợi ý ôn tập sau bài thi.
          </p>
        </div>

        <div className={styles.metricGrid}>
          <div className={styles.metricItem}>
            <CircleGauge />
            <span>Tỷ lệ đúng TB</span>
            <strong>{formatPercentFromRatio(averagePassRate)}</strong>
          </div>
          <div className={styles.metricItem}>
            <Target />
            <span>Câu có dữ liệu lỗi</span>
            <strong>
              {analyzedQuestions.length}/{questionSummaries.length}
            </strong>
          </div>
          <div className={styles.metricItem}>
            <AlertTriangle />
            <span>Cảnh báo rubric</span>
            <strong>{warningCount}</strong>
          </div>
        </div>
      </section>

      <section className={styles.insightGrid}>
        <div className={styles.insightPanel}>
          <div className={styles.panelHeader}>
            <Target />
            <div>
              <h3>Lỗi phổ biến nhất</h3>
              <p>Top nhóm lỗi xuất hiện nhiều trong toàn bài.</p>
            </div>
          </div>
          <ol className={styles.rankedList}>
            {topMutationTypes.length > 0 ? (
              topMutationTypes.map((type, index) => {
                const color = MUTATION_COLORS[type] ?? '#64748b'
                return (
                  <li key={type} style={cssVars({ '--mutation-color': color })}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.rankDot} />
                    <span>{getMutationLabel(type)}</span>
                  </li>
                )
              })
            ) : (
              <li className={styles.emptyInline}>Không có nhóm lỗi nổi bật.</li>
            )}
          </ol>
        </div>

        <div className={styles.insightPanel}>
          <div className={styles.panelHeader}>
            <BookOpen />
            <div>
              <h3>Đề xuất ôn tập</h3>
              <p>Các chủ điểm nên củng cố cho sinh viên.</p>
            </div>
          </div>
          <ul className={styles.recommendationList}>
            {studyRecommendations.length > 0 ? (
              studyRecommendations.map((recommendation) => (
                <li key={recommendation}>
                  <TrendingUp />
                  <span>{recommendation}</span>
                </li>
              ))
            ) : (
              <li className={styles.emptyInline}>Chưa có đề xuất ôn tập.</li>
            )}
          </ul>
        </div>

        {weakestQuestion && (
          <div className={`${styles.insightPanel} ${styles.priorityPanel}`}>
            <div className={styles.panelHeader}>
              <AlertTriangle />
              <div>
                <h3>Câu cần ưu tiên</h3>
                <p>Tỷ lệ đúng thấp nhất trong nhóm có dữ liệu lỗi.</p>
              </div>
            </div>
            <div className={styles.priorityContent}>
              <span>Câu {weakestQuestion.orderIndex}</span>
              <strong>
                {formatPercentFromRatio(weakestQuestion.passRate)}
              </strong>
              <p>
                Điểm TB {formatScore(weakestQuestion.avgScore)} /{' '}
                {formatScore(weakestQuestion.maxScore)}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className={styles.questionSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Theo từng câu hỏi</span>
            <h3>Chi tiết lỗi của {analyzedQuestions.length} câu</h3>
          </div>
          <span className={styles.studentPill}>{totalStudents} sinh viên</span>
        </div>

        <div className={styles.questionGrid}>
          {analyzedQuestions
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((summary) => (
              <QuestionCard key={summary.questionId} summary={summary} />
            ))}
        </div>
      </section>
    </div>
  )
}
