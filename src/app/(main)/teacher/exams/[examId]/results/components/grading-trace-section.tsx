'use client'

import React from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { GradingTrace, GradingTraceItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import styles from './submission-detail-view.module.scss'

const STATUS_CONFIG = {
  PASS: { icon: CheckCircle2, className: styles.tracePass },
  FAIL: { icon: AlertCircle, className: styles.traceFail },
  WARN: { icon: AlertTriangle, className: styles.traceWarn },
  INFO: { icon: Info, className: styles.traceInfo }
} as const

interface GradingTraceSectionProps {
  trace: GradingTrace
}

export function GradingTraceSection({ trace }: GradingTraceSectionProps) {
  const items = trace.items ?? []
  const failedItems = items.filter((it) => it.status === 'FAIL')
  const passedItems = items.filter((it) => it.status === 'PASS')
  const warnItems = items.filter((it) => it.status === 'WARN')
  const infoItems = items.filter((it) => it.status === 'INFO')

  return (
    <div className={styles.gradingTrace}>
      <div className={styles.traceHeader}>
        <span className={styles.traceTitle}>Chi tiết chấm bài</span>
        <span className={styles.traceSummaryBadges}>
          {failedItems.length > 0 && (
            <span className={styles.traceBadgeFail}>
              {failedItems.length} lỗi
            </span>
          )}
          {warnItems.length > 0 && (
            <span className={styles.traceBadgeWarn}>
              {warnItems.length} cảnh báo
            </span>
          )}
          {passedItems.length > 0 && (
            <span className={styles.traceBadgePass}>
              {passedItems.length} đạt
            </span>
          )}
          {infoItems.length > 0 && (
            <span className={styles.traceBadgeInfo}>
              {infoItems.length} thông tin
            </span>
          )}
        </span>
      </div>

      <div className={styles.traceList}>
        {items.map((item, idx) => (
          <TraceItemRow key={idx} item={item} />
        ))}
      </div>
    </div>
  )
}

function TraceItemRow({ item }: { item: GradingTraceItem }) {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.INFO
  const Icon = config.icon

  return (
    <div className={cn(styles.traceItem, config.className)}>
      <div className={styles.traceItemMain}>
        <Icon className="h-4 w-4 shrink-0" />
        <div className={styles.traceItemContent}>
          <div className={styles.traceItemLabel}>
            {item.label}
            {item.kind !== 'SUMMARY' && (
              <span className={styles.traceKindBadge}>
                {formatKind(item.kind)}
              </span>
            )}
          </div>
          {item.message && (
            <div className={styles.traceItemMessage}>{item.message}</div>
          )}
          {hasRuleConfig(item) && (
            <div className={styles.traceRuleMeta}>
              {(item.caseName || item.caseId) && (
                <span>{item.caseName || `TC ${item.caseId}`}</span>
              )}
              {(item.ruleTarget || item.ruleCondition) && (
                <code>
                  {[item.ruleTarget, item.ruleCondition]
                    .filter(Boolean)
                    .join('/')}
                </code>
              )}
              {item.action && <span>{formatAction(item.action)}</span>}
              {item.configuredPenalty != null && (
                <span>Penalty {Number(item.configuredPenalty).toFixed(2)}</span>
              )}
            </div>
          )}
          {(item.expected || item.actual) && (
            <div className={styles.traceComparison}>
              {item.expected && (
                <span>
                  <strong>Kỳ vọng:</strong> <code>{item.expected}</code>
                </span>
              )}
              {item.actual && (
                <span>
                  <strong>Thực tế:</strong> <code>{item.actual}</code>
                </span>
              )}
            </div>
          )}
          {item.configSummary && (
            <div className={styles.traceConfigSummary}>
              {item.configSummary}
            </div>
          )}
        </div>
      </div>

      {(item.deductedPoints != null || item.earnedPoints != null) && (
        <div className={styles.traceItemScore}>
          {isWeightBased(item) ? (
            <span className={styles.traceMaxPoints}>
              {item.deductedPoints != null && item.deductedPoints > 0
                ? `−${(Number(item.deductedPoints) * 100).toFixed(0)}%`
                : `${(Number(item.earnedPoints ?? 0) * 100).toFixed(0)}%`}
              {item.maxPoints != null &&
                ` / ${(Number(item.maxPoints) * 100).toFixed(0)}%`}
            </span>
          ) : (
            <>
              {item.deductedPoints != null && item.deductedPoints > 0 ? (
                <span className={styles.traceDeduction}>
                  −{Number(item.deductedPoints).toFixed(2)}
                </span>
              ) : item.earnedPoints != null ? (
                <span className={styles.traceEarned}>
                  +{Number(item.earnedPoints).toFixed(2)}
                </span>
              ) : null}
              {item.maxPoints != null && (
                <span className={styles.traceMaxPoints}>
                  / {Number(item.maxPoints).toFixed(2)}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function hasRuleConfig(item: GradingTraceItem): boolean {
  return Boolean(
    item.ruleTarget ||
    item.ruleCondition ||
    item.action ||
    item.configuredPenalty != null
  )
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    DEDUCT_POINTS: 'Trừ điểm',
    DEDUCT_PERCENTAGE: 'Trừ phần trăm',
    FAIL_ALL: 'Fail toàn câu',
    FAIL_ITEM: 'Fail hạng mục',
    IGNORE: 'Bỏ qua',
    REVIEW_CONFIG: 'Cần kiểm tra cấu hình'
  }
  return labels[action] || action
}

function isWeightBased(item: GradingTraceItem): boolean {
  if (!item.configSummary) return false
  return item.configSummary.includes('trọng số')
}

function formatKind(kind: string): string {
  const labels: Record<string, string> = {
    TEST_CASE: 'Test case',
    RUBRIC_RULE: 'Rubric',
    METADATA_CHECK: 'Metadata',
    EXECUTION_ERROR: 'Lỗi thực thi',
    TEACHER_CONFIG: 'Cấu hình GV',
    SUMMARY: 'Tổng kết'
  }
  return labels[kind] || kind
}
