'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar, Clock, Users, CreditCard, Building2 } from 'lucide-react'
import { Lesson, PaymentMethod, CreateReservationData } from '@/lib/types'
import { formatDateTime, formatTime } from '@/lib/utils'

const reservationSchema = z.object({
  customerName: z.string().min(1, '名前を入力してください'),
  customerEmail: z.string().email('有効なメールアドレスを入力してください'),
  customerPhone: z.string().min(10, '電話番号を入力してください'),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: '支払い方法を選択してください' })
  })
})

type ReservationForm = z.infer<typeof reservationSchema>

interface ReservationFormPageProps {
  params: {
    lessonId: string
  }
}

export default function ReservationFormPage({ params }: ReservationFormPageProps) {
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema)
  })

  const selectedPaymentMethod = watch('paymentMethod')

  useEffect(() => {
    fetchLesson()
  }, [params.lessonId])

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons?start=${new Date().toISOString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch lesson')
      }

      const lessons = await response.json()
      const currentLesson = lessons.find((l: Lesson) => l.id === params.lessonId)
      
      if (!currentLesson) {
        router.push('/reserve')
        return
      }

      setLesson(currentLesson)
    } catch (error) {
      console.error('Error fetching lesson:', error)
      router.push('/reserve')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ReservationForm) => {
    if (!lesson) return

    setSubmitting(true)

    try {
      const reservationData: CreateReservationData = {
        lessonId: lesson.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        paymentMethod: data.paymentMethod
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create reservation')
      }

      const result = await response.json()

      if (data.paymentMethod === PaymentMethod.PAY_NOW && result.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.checkoutUrl
      } else {
        // Redirect to completion page
        router.push(`/reserve/complete?reservationId=${result.reservation.id}`)
      }

    } catch (error) {
      console.error('Error creating reservation:', error)
      alert(error instanceof Error ? error.message : '予約の作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">レッスン情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return null
  }

  const availableSpots = lesson.maxCapacity - lesson.reservations.length
  const isPast = new Date(lesson.startTime) < new Date()
  const isFull = availableSpots <= 0

  if (isPast || isFull) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <Link href="/reserve" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">予約不可</h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isPast ? 'このレッスンは終了しています' : 'このレッスンは満席です'}
            </h2>
            <p className="text-gray-600 mb-8">
              他のレッスンをご検討ください
            </p>
            <Link href="/reserve" className="btn-primary">
              レッスン一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/reserve" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">レッスン予約</h1>
              <p className="text-sm text-gray-600">お客様情報を入力してください</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Info */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{lesson.title}</h2>
          
          <div className="space-y-3 text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-primary-500" />
              <span>{formatDateTime(new Date(lesson.startTime))}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-primary-500" />
              <span>
                {formatTime(new Date(lesson.startTime))} - {formatTime(new Date(lesson.endTime))}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3 text-primary-500" />
              <span>残り {availableSpots}/{lesson.maxCapacity} 席</span>
            </div>
          </div>

          {lesson.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600">{lesson.description}</p>
            </div>
          )}
        </div>

        {/* Reservation Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">お客様情報</h3>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="form-label">お名前 *</label>
              <input
                type="text"
                className="form-input"
                placeholder="山田 花子"
                {...register('customerName')}
              />
              {errors.customerName && (
                <p className="form-error">{errors.customerName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">メールアドレス *</label>
              <input
                type="email"
                className="form-input"
                placeholder="example@email.com"
                {...register('customerEmail')}
              />
              {errors.customerEmail && (
                <p className="form-error">{errors.customerEmail.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="form-label">電話番号 *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="090-1234-5678"
                {...register('customerPhone')}
              />
              {errors.customerPhone && (
                <p className="form-error">{errors.customerPhone.message}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="form-label">お支払い方法 *</label>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value={PaymentMethod.PAY_NOW}
                    className="mr-3"
                    {...register('paymentMethod')}
                  />
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-3 text-primary-500" />
                    <div>
                      <div className="font-medium">今すぐ支払う</div>
                      <div className="text-sm text-gray-600">クレジットカードで今すぐ決済（3,000円）</div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value={PaymentMethod.PAY_AT_STUDIO}
                    className="mr-3"
                    {...register('paymentMethod')}
                  />
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 mr-3 text-secondary-500" />
                    <div>
                      <div className="font-medium">当日支払い</div>
                      <div className="text-sm text-gray-600">スタジオで現金でお支払い（3,000円）</div>
                    </div>
                  </div>
                </label>
              </div>
              {errors.paymentMethod && (
                <p className="form-error">{errors.paymentMethod.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 text-lg disabled:opacity-50"
            >
              {submitting ? '処理中...' : 
               selectedPaymentMethod === PaymentMethod.PAY_NOW ? '決済に進む' : '予約を確定する'}
            </button>
          </div>

          {/* Notes */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">ご注意</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 前日までなら無料でキャンセル・変更が可能です</li>
              <li>• 当日のキャンセルは返金できません</li>
              <li>• レッスン開始15分前までにお越しください</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}