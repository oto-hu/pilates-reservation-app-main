// src/app/reserve/[lessonId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar, Clock, Users, Building2, UserCheck, AlertCircle, Ticket, CreditCard, Loader2 } from 'lucide-react'
import { Lesson, PaymentMethod, CreateReservationData, ReservationType, Ticket as TicketType, LessonType } from '@/lib/types'
import { formatDateTime, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const reservationSchema = z.object({
  customerName: z.string().min(1, '名前を入力してください'),
  customerEmail: z.string().email('有効なメールアドレスを入力してください'),
  customerPhone: z.string().min(10, '電話番号を入力してください'),
  medicalInfo: z.string().optional(),
  reservationType: z.nativeEnum(ReservationType),
  agreeToConsent: z.boolean().optional()
})

type ReservationForm = z.infer<typeof reservationSchema>

interface ReservationFormPageProps {
  params: {
    lessonId: string
  }
}

export default function ReservationFormPage({ params }: ReservationFormPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [userTickets, setUserTickets] = useState<TicketType[]>([])
  const [hasReservationHistory, setHasReservationHistory] = useState(false)
  const [needsConsent, setNeedsConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [joiningWaitingList, setJoiningWaitingList] = useState(false)
  const [selectedReservationType, setSelectedReservationType] = useState<ReservationType | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema)
  })

  useEffect(() => {
    fetchLesson()
    if (session?.user?.role === 'member') {
      fetchUserData()
    }
  }, [params.lessonId, session])

  useEffect(() => {
    if (session?.user) {
      setValue('customerName', session.user.name || '')
      setValue('customerEmail', session.user.email || '')
    }
  }, [session, setValue])

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
      
      console.log('Current Lesson:', currentLesson); // デバッグログ
      setLesson(currentLesson)
      // Determine default reservation type
      if (currentLesson) {
          if (session?.user?.role === 'member' && !hasReservationHistory) {
              setSelectedReservationType(ReservationType.TRIAL);
              setValue('reservationType', ReservationType.TRIAL);
          } else if (getAvailableTickets().length > 0) {
              setSelectedReservationType(ReservationType.TICKET);
              setValue('reservationType', ReservationType.TICKET);
          } else {
              setSelectedReservationType(ReservationType.DROP_IN);
              setValue('reservationType', ReservationType.DROP_IN);
          }
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      router.push('/reserve')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserData = async () => {
    try {
      // ユーザーのチケット情報を取得
      const ticketsResponse = await fetch('/api/member/tickets')
      if (ticketsResponse.ok) {
        const tickets = await ticketsResponse.json()
        console.log('User Tickets:', tickets); // デバッグログ
        setUserTickets(tickets)
      }

      // 予約履歴の有無を確認
      const historyResponse = await fetch('/api/member/reservation-history')
      if (historyResponse.ok) {
        const history = await historyResponse.json()
        setHasReservationHistory(history.hasHistory)
      }

      // 同意状況を確認
      const consentResponse = await fetch('/api/member/consent-status')
      if (consentResponse.ok) {
        const consent = await consentResponse.json()
        setNeedsConsent(!consent.hasAgreed)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const onSubmit = async (data: ReservationForm) => {
    if (!lesson) return

    // 同意チェックの確認
    if (needsConsent && !data.agreeToConsent) {
      alert('同意書への同意が必要です')
      return
    }

    setSubmitting(true)

    try {
      const reservationData: CreateReservationData = {
        lessonId: lesson.id,
        userId: session?.user?.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        medicalInfo: data.medicalInfo,
        reservationType: data.reservationType as ReservationType,
        paymentMethod: data.reservationType === 'TICKET' ? PaymentMethod.TICKET : PaymentMethod.PAY_AT_STUDIO,
        agreeToConsent: data.agreeToConsent
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
      router.push(`/reserve/complete?reservationId=${result.reservation.id}`)

    } catch (error) {
      console.error('Error creating reservation:', error)
      alert(error instanceof Error ? error.message : '予約の作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const getAvailableTickets = () => {
    if (!lesson || !lesson.ticketGroupId) return []
    return userTickets.filter(ticket => 
      ticket.ticketGroupId === lesson.ticketGroupId && 
      ticket.remainingCount > 0 && 
      new Date(ticket.expiresAt) > new Date()
    )
  }

  const canUseTrialOption = () => {
    return session?.user?.role === 'member' && !hasReservationHistory
  }

  const getReservationTypePrice = (type: ReservationType) => {
    switch (type) {
      case ReservationType.TRIAL:
        return '1,000円'
      case ReservationType.DROP_IN:
        return lesson ? `${lesson.price.toLocaleString()}円` : 'N/A'
      case ReservationType.TICKET:
        return 'チケット1枚'
      default:
        return ''
    }
  }

  const handleJoinWaitingList = async () => {
    if (!lesson || !session?.user?.id) {
      alert('ログインが必要です')
      return
    }

    setJoiningWaitingList(true)
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/waiting-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        router.push('/member/dashboard')
      } else {
        alert(data.error || 'キャンセル待ちの登録に失敗しました')
      }
    } catch (error) {
      console.error('Waiting list join error:', error)
      alert('キャンセル待ちの登録に失敗しました')
    } finally {
      setJoiningWaitingList(false)
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
            
            {/* 満席の場合にキャンセル待ちオプションを表示 */}
            {isFull && !isPast && session?.user?.role === 'member' && getAvailableTickets().length > 0 && (
              <div className="mb-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">キャンセル待ちに登録</h3>
                  <p className="text-yellow-700 mb-4">
                    キャンセルが出た場合、自動的にチケットで予約が確定されます
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-600">
                      • 利用可能チケット: {getAvailableTickets()[0]?.remainingCount}枚
                    </p>
                    <p className="text-sm text-yellow-600">
                      • キャンセル待ちからの自動予約確定時にチケット1枚消費されます
                    </p>
                  </div>
                  <Button
                    onClick={handleJoinWaitingList}
                    disabled={joiningWaitingList}
                    className="mt-4 bg-yellow-600 hover:bg-yellow-700"
                  >
                    {joiningWaitingList ? '登録中...' : 'キャンセル待ちに登録'}
                  </Button>
                </div>
              </div>
            )}

            {/* キャンセル待ち登録ができない場合のメッセージ */}
            {isFull && !isPast && session?.user?.role === 'member' && getAvailableTickets().length === 0 && (
              <div className="mb-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <p className="text-gray-600 mb-2">
                    キャンセル待ちにはチケットが必要です
                  </p>
                  <p className="text-sm text-gray-500">
                    スタジオでチケットをご購入いただくか、他のレッスンをご検討ください
                  </p>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mb-8">
              {!isFull || isPast ? '他のレッスンをご検討ください' : ''}
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
            {lesson.instructorName && (
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 mr-3 text-primary-500" />
                <span>インストラクター: {lesson.instructorName}</span>
              </div>
            )}
            <div className="flex items-center">
              <span className="mr-3 text-xl">💴</span>
              <span className="font-bold text-lg text-primary-600">{lesson.price.toLocaleString()}円 (単回利用の場合)</span>
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

            {/* Medical Information */}
            <div>
              <label className="form-label">医学的情報・既往歴（任意）</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="例：過去に右のTHAをしています、腰痛があります、膝の手術歴があります など&#10;&#10;インストラクターがレッスン中に配慮すべき点があればご記入ください"
                {...register('medicalInfo')}
              />
              <p className="text-xs text-gray-500 mt-1">
                この情報はインストラクターとの共有のみに使用され、適切なレッスン指導のために活用されます
              </p>
              {errors.medicalInfo && (
                <p className="form-error">{errors.medicalInfo.message}</p>
              )}
            </div>

            {/* Reservation Type Selection */}
            <div>
              <label className="form-label">予約タイプ *</label>
              <div className="space-y-3">
                {/* Trial Option */}
                {canUseTrialOption() && (
                  <div className="border border-green-300 rounded-lg">
                    <label className="flex items-center p-4 cursor-pointer hover:bg-green-50">
                      <input
                        type="radio"
                        value={ReservationType.TRIAL}
                        {...register('reservationType')}
                        onChange={(e) => setSelectedReservationType(e.target.value as ReservationType)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="inline-block px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded mr-2">
                              初回限定
                            </span>
                            <span className="font-medium">体験レッスン</span>
                          </div>
                          <span className="font-bold text-green-600">{getReservationTypePrice(ReservationType.TRIAL)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">初めての方限定の特別価格です（当日PayPay払い）</p>
                      </div>
                    </label>
                  </div>
                )}
                
                {/* Drop-in Option */}
                <div className="border border-blue-300 rounded-lg">
                  <label className="flex items-center p-4 cursor-pointer hover:bg-blue-50">
                    <input
                      type="radio"
                      value={ReservationType.DROP_IN}
                      {...register('reservationType')}
                      onChange={(e) => setSelectedReservationType(e.target.value as ReservationType)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium">単回利用（ドロップイン）</span>
                        </div>
                        <span className="font-bold text-blue-600">{getReservationTypePrice(ReservationType.DROP_IN)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">1回分の料金でご参加いただけます（当日PayPay払い）</p>
                    </div>
                  </label>
                </div>

                {/* Ticket Option */}
                {session?.user?.role === 'member' && getAvailableTickets().length > 0 && (
                  <div className="border border-purple-300 rounded-lg">
                    <label className="flex items-center p-4 cursor-pointer hover:bg-purple-50">
                      <input
                        type="radio"
                        value={ReservationType.TICKET}
                        {...register('reservationType')}
                        onChange={(e) => setSelectedReservationType(e.target.value as ReservationType)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Ticket className="h-4 w-4 mr-2 text-purple-600" />
                            <span className="font-medium">チケット利用</span>
                          </div>
                          <span className="font-bold text-purple-600">{getReservationTypePrice(ReservationType.TICKET)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          お持ちのチケットを使用します（残り{getAvailableTickets()[0]?.remainingCount}枚）
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* No tickets available for members */}
                {session?.user?.role === 'member' && getAvailableTickets().length === 0 && (
                  <div className="border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center p-4">
                      <Ticket className="h-4 w-4 mr-2 text-gray-400" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-500">チケット利用（利用不可）</span>
                        <p className="text-sm text-gray-400 mt-1">
                          有効なチケットがありません。スタジオでチケットをご購入ください。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {errors.reservationType && (
                <p className="form-error">{errors.reservationType.message}</p>
              )}
            </div>

            {/* Consent Agreement */}
            {needsConsent && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800 mb-2">同意書への同意が必要です</h4>
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('agreeToConsent')}
                        className="mr-2 mt-1"
                      />
                      <span className="text-sm text-yellow-700">
                        <Link href="/consent-form" target="_blank" className="text-blue-600 hover:underline">
                          同意書
                        </Link>
                        をよく読み同意します
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting || (needsConsent && !getValues('agreeToConsent')) || !selectedReservationType}
              className="btn-primary w-full py-3 text-lg disabled:opacity-50"
            >
              {submitting ? '処理中...' : '予約を確定する'}
            </button>
          </div>

          {/* Notes */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">キャンセルポリシー</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>前日21:00まで</strong>：無料キャンセル（チケット利用の場合は返還）</li>
              <li>• <strong>前日21:00以降</strong>：キャンセル料発生（チケット利用の場合は消費）</li>
              <li>• レッスン開始15分前までにお越しください</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}