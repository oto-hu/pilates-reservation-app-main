'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Calendar, Clock, User, Mail, Phone, CreditCard, Building2, Camera, Home, UserCheck } from 'lucide-react'
import { Reservation, PaymentMethod } from '@/lib/types'
import { formatDateTime, formatTime } from '@/lib/utils'

function ReservationCompleteForm() {
  const searchParams = useSearchParams()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  const reservationId = searchParams.get('reservationId')
  const sessionId = searchParams.get('session_id')
  const newUser = searchParams.get('newUser')

  useEffect(() => {
    if (newUser === 'true') {
      setIsNewUser(true)
    }
    
    if (sessionId) {
      // Handle Stripe success
      handleStripeSuccess()
    } else if (reservationId) {
      // Handle studio payment success
      fetchReservation()
    } else {
      setLoading(false)
    }
  }, [sessionId, reservationId, newUser])

  const handleStripeSuccess = async () => {
    try {
      const response = await fetch(`/api/stripe/success?session_id=${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reservation')
      }

      const data = await response.json()
      setReservation(data.reservation)
    } catch (error) {
      console.error('Error handling Stripe success:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reservation')
      }

      const data = await response.json()
      setReservation(data)
    } catch (error) {
      console.error('Error fetching reservation:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">予約情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              予約情報が見つかりません
            </h1>
            <p className="text-gray-600 mb-8">
              正しいURLをご確認ください
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ✅ ご予約が完了しました！
          </h1>
          <p className="text-gray-600">
            予約詳細は以下の通りです
          </p>
          {isNewUser && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                🎉 会員登録も同時に完了しました！次回からはログインして予約できます。
              </p>
            </div>
          )}
        </div>

        {/* Reservation Details */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">予約詳細</h2>
          
          <div className="space-y-4">
            {/* Lesson Info */}
            <div className="pb-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">{reservation.lesson?.title}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDateTime(new Date(reservation.lesson?.startTime || ''))}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>
                    {formatTime(new Date(reservation.lesson?.startTime || ''))} - {formatTime(new Date(reservation.lesson?.endTime || ''))}
                  </span>
                </div>
                {reservation.lesson?.instructorName && (
                  <div className="flex items-center">
                    <UserCheck className="h-4 w-4 mr-2" />
                    <span>インストラクター: {reservation.lesson.instructorName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="pb-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">お客様情報</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>{reservation.customerName}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{reservation.customerEmail}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{reservation.customerPhone}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">お支払い情報</h3>
              <div className="flex items-center text-sm text-gray-600">
                <Building2 className="h-4 w-4 mr-2" />
                <span>現地支払い - 3,000円（当日PayPayでお支払いください）</span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Camera className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800 mb-2">
                ⚠️ この画面をスクリーンショットして保存してください
              </h3>
              <p className="text-sm text-red-700">
                メール等での通知は行っておりません。レッスン当日にこの予約確認をご提示ください。
              </p>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-medium text-blue-800 mb-2">ご来店時の注意事項</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• レッスン開始15分前までにお越しください</li>
            <li>• 動きやすい服装でお参りください</li>
            <li>• タオルと水分補給用の飲み物をお持ちください</li>
            <li>• 前日までなら無料でキャンセル・変更が可能です</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/reserve"
            className="btn-primary w-full text-center py-3 text-lg"
          >
            <Home className="h-5 w-5 mr-2 inline" />
            レッスン一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ReservationCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <ReservationCompleteForm />
    </Suspense>
  )
}