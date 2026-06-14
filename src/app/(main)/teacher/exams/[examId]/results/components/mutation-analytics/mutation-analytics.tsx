'use client'

import { AlertTriangle, TrendingUp, BookOpen, Target } from 'lucide-react'
import type {
  ExamMutationAnalytics,
  QuestionMutationSummary,
  MutationStat
} from '@/lib/types'

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

function FailRateBar({ stat }: { stat: MutationStat }) {
  const color = MUTATION_COLORS[stat.mutationType] ?? '#64748b'
  const pct = Math.round(stat.failRate * 100)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        marginBottom: '0.5rem'
      }}
    >
      <div
        style={{
          width: '160px',
          fontSize: '0.75rem',
          color: 'var(--color-muted-foreground)',
          flexShrink: 0
        }}
      >
        {stat.label}
      </div>
      <div
        style={{
          flex: 1,
          background: 'var(--color-muted)',
          borderRadius: '999px',
          height: '8px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: pct + '%',
            background: color,
            height: '100%',
            borderRadius: '999px',
            transition: 'width 0.4s ease'
          }}
        />
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color,
          width: '50px',
          textAlign: 'right',
          flexShrink: 0
        }}
      >
        {pct}% ({stat.failCount})
      </div>
    </div>
  )
}

function QuestionCard({ summary }: { summary: QuestionMutationSummary }) {
  const passRatePct = Math.round(summary.passRate * 100)
  const hasWarnings = summary.rubricHealthWarnings.length > 0
  const hasMutations = summary.mutationBreakdown.length > 0

  return (
    <div
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-muted-foreground)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '2px'
            }}
          >
            Câu {summary.orderIndex}
          </div>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--color-foreground)',
              lineHeight: 1.3
            }}
          >
            {summary.questionTitle}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '2px',
            flexShrink: 0
          }}
        >
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color:
                passRatePct >= 60
                  ? '#22c55e'
                  : passRatePct >= 30
                    ? '#f59e0b'
                    : '#ef4444'
            }}
          >
            {passRatePct}%
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--color-muted-foreground)'
            }}
          >
            tỉ lệ đúng
          </div>
        </div>
      </div>

      {/* Score info */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.78rem',
          color: 'var(--color-muted-foreground)'
        }}
      >
        <span>
          Điểm TB:{' '}
          <strong style={{ color: 'var(--color-foreground)' }}>
            {summary.avgScore.toFixed(1)}
          </strong>
        </span>
        <span>/ {summary.maxScore} điểm</span>
      </div>

      {/* Mutation breakdown */}
      {hasMutations && (
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--color-muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.5rem'
            }}
          >
            Phân tích loại lỗi (% sinh viên mắc)
          </div>
          {summary.mutationBreakdown.map((stat) => (
            <FailRateBar key={stat.mutationType} stat={stat} />
          ))}
        </div>
      )}

      {!hasMutations && (
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-muted-foreground)',
            fontStyle: 'italic'
          }}
        >
          Chưa có dữ liệu mutation — rubric cần được tạo lại để bật
          mutation_type tracking.
        </div>
      )}

      {/* Health warnings */}
      {hasWarnings && (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
        >
          {summary.rubricHealthWarnings.map((w, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '6px',
                padding: '0.5rem 0.6rem',
                fontSize: '0.75rem',
                color: '#92400e'
              }}
            >
              <AlertTriangle
                style={{
                  width: '0.85rem',
                  height: '0.85rem',
                  flexShrink: 0,
                  marginTop: '1px',
                  color: '#f59e0b'
                }}
              />
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function MutationAnalytics({ data }: MutationAnalyticsProps) {
  const { totalStudents, questionSummaries, globalInsights } = data
  const hasData = questionSummaries.some((q) => q.mutationBreakdown.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Global insights bar */}
      {hasData && globalInsights.topMutationTypes.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}
        >
          {/* Top mutation types */}
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '1.25rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.875rem'
              }}
            >
              <Target
                style={{ width: '1rem', height: '1rem', color: '#ef4444' }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Lỗi phổ biến nhất
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              {globalInsights.topMutationTypes.map((type, i) => {
                const color = MUTATION_COLORS[type] ?? '#64748b'
                const labels: Record<string, string> = {
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
                return (
                  <div
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.82rem'
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--color-muted-foreground)',
                        width: '14px'
                      }}
                    >
                      #{i + 1}
                    </span>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0
                      }}
                    />
                    <span style={{ color: 'var(--color-foreground)' }}>
                      {labels[type] ?? type}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Study recommendations */}
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '1.25rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.875rem'
              }}
            >
              <BookOpen
                style={{ width: '1rem', height: '1rem', color: '#3b82f6' }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Đề xuất ôn tập
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              {globalInsights.studyRecommendations.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-muted-foreground)',
                    alignItems: 'flex-start'
                  }}
                >
                  <TrendingUp
                    style={{
                      width: '0.75rem',
                      height: '0.75rem',
                      flexShrink: 0,
                      marginTop: '2px',
                      color: '#3b82f6'
                    }}
                  />
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No data state */}
      {!hasData && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--color-muted-foreground)',
            fontSize: '0.875rem'
          }}
        >
          <Target
            style={{
              width: '2.5rem',
              height: '2.5rem',
              margin: '0 auto 0.75rem',
              opacity: 0.4
            }}
          />
          <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
            Chưa có dữ liệu phân tích lỗi
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            Tính năng này yêu cầu rubric được tạo sau khi cập nhật hệ thống (có
            mutation_type trong test case).
          </div>
        </div>
      )}

      {/* Per-question cards */}
      {hasData && (
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.875rem'
            }}
          >
            Phân tích theo câu hỏi — {totalStudents} sinh viên
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '1rem'
            }}
          >
            {questionSummaries
              .filter((q) => q.mutationBreakdown.length > 0)
              .map((summary) => (
                <QuestionCard key={summary.questionId} summary={summary} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
