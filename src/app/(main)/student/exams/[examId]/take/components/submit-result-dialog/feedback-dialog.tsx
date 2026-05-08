'use client'

import React, { useState } from 'react'
import { X, MessageSquare, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { submitFeedback } from '@/lib/actions'

interface FeedbackDialogProps {
  examId: number
  onClose: () => void
}

export function FeedbackDialog({ examId, onClose }: FeedbackDialogProps) {
  const [uiUxRating, setUiUxRating] = useState<number>(0)
  const [systemReliabilityRating, setSystemReliabilityRating] =
    useState<number>(0)
  const [npsScore, setNpsScore] = useState<number>(0)
  const [featureRequests, setFeatureRequests] = useState('')
  const [generalFeedback, setGeneralFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (uiUxRating === 0 || systemReliabilityRating === 0 || npsScore === 0) {
      toast.error('Vui lòng đánh giá số sao và điểm NPS')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await submitFeedback({
        examId,
        uiUxRating,
        systemReliabilityRating,
        npsScore,
        featureRequests,
        generalFeedback
      })

      if (res.code === 'OK' || res.code === 'CREATED') {
        toast.success('Cảm ơn bạn đã gửi đánh giá!')
        onClose()
      } else {
        toast.error(res.message || 'Gửi đánh giá thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi gửi đánh giá')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (rating: number, setRating: (r: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(star)}
          className={cn(
            'p-1 transition-colors hover:text-amber-500',
            star <= rating ? 'text-amber-500' : 'text-slate-300'
          )}
        >
          <Star
            className="w-6 h-6"
            fill={star <= rating ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  )

  const renderNps = () => (
    <div className="flex flex-wrap gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
        <button
          key={num}
          onClick={() => setNpsScore(num)}
          className={cn(
            'w-9 h-9 rounded-md border font-semibold transition-all select-none',
            num === npsScore
              ? 'bg-primary text-primary-foreground border-primary scale-110'
              : 'bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
          )}
        >
          {num}
        </button>
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Đánh giá hệ thống
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Giúp chúng tôi cải thiện trải nghiệm của bạn
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                1. Đánh giá giao diện và trải nghiệm (UI/UX){' '}
                <span className="text-destructive">*</span>
              </label>
              {renderStars(uiUxRating, setUiUxRating)}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                2. Đánh giá độ ổn định của hệ thống{' '}
                <span className="text-destructive">*</span>
              </label>
              {renderStars(systemReliabilityRating, setSystemReliabilityRating)}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                3. Mức độ bạn sẵn sàng giới thiệu hệ thống này (Từ 1-10){' '}
                <span className="text-destructive">*</span>
              </label>
              {renderNps()}
              <div className="flex justify-between text-xs text-muted-foreground max-w-[380px]">
                <span>Không bao giờ</span>
                <span>Chắc chắn</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                4. Tính năng bạn mong muốn có thêm (Tùy chọn)
              </label>
              <Textarea
                placeholder="Ví dụ: Thêm tính năng gợi ý cú pháp, tự động lưu..."
                value={featureRequests}
                onChange={(e) => setFeatureRequests(e.target.value)}
                className="resize-none h-24"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                5. Góp ý chung (Tùy chọn)
              </label>
              <Textarea
                placeholder="Chia sẻ thêm cảm nhận của bạn về kỳ thi này..."
                value={generalFeedback}
                onChange={(e) => setGeneralFeedback(e.target.value)}
                className="resize-none h-24"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/50 bg-muted/10 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Gửi đánh giá
          </Button>
        </div>
      </div>
    </div>
  )
}
