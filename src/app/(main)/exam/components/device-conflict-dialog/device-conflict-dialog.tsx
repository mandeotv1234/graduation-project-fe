'use client'

import { useState, useEffect } from 'react'
import {
  Monitor,
  Wifi,
  Clock,
  User,
  Mail,
  Shield,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  approveDeviceConflict,
  rejectDeviceConflict
} from '@/lib/actions/anti-cheat.action'
import type { DeviceConflictPendingEvent } from '@/lib/types'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils/time'
import styles from './device-conflict-dialog.module.scss'

interface DeviceConflictDialogProps {
  conflict: DeviceConflictPendingEvent
  onDismiss: () => void
}

export function DeviceConflictDialog({
  conflict,
  onDismiss
}: DeviceConflictDialogProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  // Auto-dismiss after 5 minutes if teacher doesn't act
  useEffect(() => {
    const AUTO_DISMISS_MS = 5 * 60 * 1000
    const timer = setTimeout(() => {
      onDismiss()
    }, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const res = await approveDeviceConflict(
        conflict.examId,
        conflict.conflictId
      )
      if (res.code === 'OK' || res.code === 'SERVER_ERROR') {
        toast.success(
          `Đã cho phép ${conflict.studentName} tiếp tục thi từ thiết bị mới.`
        )
        onDismiss()
      }
    } catch {
      toast.error('Có lỗi khi xử lý yêu cầu. Vui lòng thử lại.')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      await rejectDeviceConflict(
        conflict.examId,
        conflict.conflictId,
        'Giáo viên từ chối.'
      )
      toast.info(
        `Đã từ chối yêu cầu chuyển thiết bị của ${conflict.studentName}.`
      )
      onDismiss()
    } catch {
      toast.error('Có lỗi khi xử lý yêu cầu. Vui lòng thử lại.')
    } finally {
      setIsRejecting(false)
    }
  }

  const formatUserAgent = (ua: string) => {
    if (!ua) return 'Không rõ'

    // Check for Coc_Coc first as it is Chromium-based and also contains 'Chrome'
    if (ua.includes('Coc_Coc')) return 'Cốc Cốc'
    if (ua.includes('Chrome')) return 'Google Chrome'
    if (ua.includes('Firefox')) return 'Mozilla Firefox'
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Apple Safari'
    if (ua.includes('Edge')) return 'Microsoft Edge'
    return ua.substring(0, 60) + (ua.length > 60 ? '...' : '')
  }

  const formatTime = (iso: string) => {
    if (!iso) return 'Không rõ'
    return formatDateTime(iso)
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Shield className={styles.shieldIcon} />
          </div>
          <div>
            <h2 className={styles.title}>🚨 Yêu cầu chuyển thiết bị thi</h2>
            <p className={styles.subtitle}>
              Sinh viên đang cố truy cập từ một thiết bị khác
            </p>
          </div>
        </div>

        {/* Student info */}
        <div className={styles.studentCard}>
          <div className={styles.studentRow}>
            <User className={styles.rowIcon} />
            <span className={styles.rowLabel}>Sinh viên:</span>
            <span className={styles.rowValue}>{conflict.studentName}</span>
          </div>
          <div className={styles.studentRow}>
            <Mail className={styles.rowIcon} />
            <span className={styles.rowLabel}>Email:</span>
            <span className={styles.rowValue}>{conflict.studentEmail}</span>
          </div>
          <div className={styles.studentRow}>
            <Clock className={styles.rowIcon} />
            <span className={styles.rowLabel}>Thời gian:</span>
            <span className={styles.rowValue}>
              {formatTime(conflict.requestedAt)}
            </span>
          </div>
        </div>

        {/* Device comparison */}
        <div className={styles.devicesGrid}>
          <div className={styles.deviceCard}>
            <div className={styles.deviceHeader}>
              <Monitor className={styles.deviceIcon} />
              <span>Thiết bị đang thi</span>
            </div>
            <div className={styles.deviceDetail}>
              <Wifi size={14} />
              <span>{conflict.existingIpAddress || 'N/A'}</span>
            </div>
            <div className={styles.deviceDetail}>
              <Monitor size={14} />
              <span>{formatUserAgent(conflict.existingUserAgent)}</span>
            </div>
          </div>

          <div className={styles.arrow}>→</div>

          <div className={`${styles.deviceCard} ${styles.deviceCardNew}`}>
            <div className={styles.deviceHeader}>
              <Monitor className={styles.deviceIcon} />
              <span>Thiết bị mới xin vào</span>
            </div>
            <div className={styles.deviceDetail}>
              <Wifi size={14} />
              <span>{conflict.newIpAddress || 'N/A'}</span>
            </div>
            <div className={styles.deviceDetail}>
              <Monitor size={14} />
              <span>{formatUserAgent(conflict.newUserAgent)}</span>
            </div>
          </div>
        </div>

        <p className={styles.warning}>
          ⚠️ Nếu <strong>Đồng ý</strong>: Thiết bị cũ sẽ bị đăng xuất khỏi bài
          thi. Bài làm hiện tại đã được lưu tự động (30 giây/lần).
        </p>

        <div className={styles.actions}>
          <Button
            id="btn-reject-conflict"
            variant="outline"
            onClick={handleReject}
            disabled={isApproving || isRejecting}
            className={styles.rejectBtn}
          >
            <X size={16} />
            {isRejecting ? 'Đang từ chối...' : 'Từ chối'}
          </Button>
          <Button
            id="btn-approve-conflict"
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            className={styles.approveBtn}
          >
            <Check size={16} />
            {isApproving ? 'Đang duyệt...' : 'Đồng ý cho vào thi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
