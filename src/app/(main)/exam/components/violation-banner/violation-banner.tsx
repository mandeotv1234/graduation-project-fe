'use client'

import { AlertTriangle, Eye, Shield, ShieldAlert } from 'lucide-react'

import {
  MAX_VIOLATIONS_BEFORE_SUBMIT,
  MAX_VIOLATIONS_BEFORE_WARNING,
  VIOLATION_LABELS
} from '@/lib/constants/violation'
import { useAppSelector } from '@/lib/redux/hooks'
import styles from '@/app/(main)/exam/components/violation-banner/violation-banner.module.scss'

export function ViolationBanner() {
  const { totalViolations, violations, isFullscreen } = useAppSelector(
    (state) => state.antiCheat
  )

  const severity =
    totalViolations >= MAX_VIOLATIONS_BEFORE_SUBMIT * 0.8
      ? 'critical'
      : totalViolations >= MAX_VIOLATIONS_BEFORE_WARNING
        ? 'warning'
        : 'safe'

  const recentViolations = violations.slice(-3).reverse()

  return (
    <div className={styles.bannerContainer}>
      {/* Trạng thái Fullscreen */}
      <div
        className={`${styles.securityStatus} ${
          isFullscreen ? styles.secure : styles.insecure
        }`}
        title={
          isFullscreen
            ? 'Chế độ toàn màn hình đang bật'
            : 'Vui lòng bật chế độ toàn màn hình'
        }
      >
        {isFullscreen ? (
          <Shield className={styles.statusIcon} />
        ) : (
          <ShieldAlert className={styles.statusIcon} />
        )}
        <span className={styles.statusText}>
          {isFullscreen ? 'Bảo mật' : 'Không an toàn'}
        </span>
      </div>

      {/* Số lần vi phạm */}
      <div className={styles.violationCounter}>
        <Eye className={styles.eyeIcon} />
        <span className={`${styles.violationBadge} ${styles[severity]}`}>
          {severity === 'critical' && (
            <AlertTriangle className={styles.warningIcon} />
          )}
          {totalViolations} vi phạm
        </span>

        {/* Tooltip — recent violations */}
        <div className={styles.violationTooltip}>
          {recentViolations.length === 0 ? (
            <p className={styles.emptyMessage}>
              Chưa có vi phạm nào. Hãy giữ nguyên!
            </p>
          ) : (
            <div className={styles.violationList}>
              <p className={styles.listTitle}>Vi phạm gần đây:</p>
              {recentViolations.map((v) => (
                <p key={v.id} className={styles.violationItem}>
                  • {VIOLATION_LABELS[v.type]}
                  <span className={styles.violationTime}>
                    ({new Date(v.timestamp).toLocaleTimeString('vi-VN')})
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
