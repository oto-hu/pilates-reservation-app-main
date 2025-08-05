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
import { formatDate, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const reservationSchema = z.object({
  customerName: z.string().min(1, '名前を入力してください'),
  customerEmail: z.string().email('有効なメールアドレスを入力してください'),
  reservationType: z.nativeEnum(ReservationType)
})

type ReservationForm = z.infer<typeof reservationSchema>

interface ReservationFormPageProps {
  params: {
    lessonId: string
  }
}

export default function ReservationFormPage({ params }: ReservationFormPageProps) {
  const { data: session, status } = useSession()
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
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(`/reserve/${params.lessonId}`))
      return
    }
    
    fetchLesson()
    if (session?.user?.role === 'member') {
      fetchUserData()
    }
  }, [params.lessonId, session, status, router])

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
          }
          // DROP_IN option removed - no default fallback needed
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
        console.log('Reservation History:', history); // デバッグログ
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

    console.log('予約処理開始:', data) // デバッグログ
    setSubmitting(true)

    try {
      const reservationData: CreateReservationData = {
        lessonId: lesson.id,
        userId: session?.user?.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: '', // 削除されたフィールド
        medicalInfo: '', // 削除されたフィールド
        reservationType: data.reservationType as ReservationType,
        paymentMethod: data.reservationType === 'TICKET' ? PaymentMethod.TICKET : PaymentMethod.PAY_AT_STUDIO,
        agreeToConsent: true // 削除されたフィールド
      }

      console.log('送信データ:', reservationData) // デバッグログ

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationData)
      })

      console.log('APIレスポンス status:', response.status) // デバッグログ

      if (!response.ok) {
        const errorData = await response.json()
        console.error('APIエラー:', errorData) // デバッグログ
        throw new Error(errorData.error || 'Failed to create reservation')
      }

      const result = await response.json()
      console.log('予約成功:', result) // デバッグログ
      console.log('遷移先URL:', `/reserve/complete?reservationId=${result.reservation.id}`) // デバッグログ
      
      // 遷移前に少し待機
      setTimeout(() => {
        console.log('ページ遷移実行') // デバッグログ
        router.push(`/reserve/complete?reservationId=${result.reservation.id}`)
      }, 100)

    } catch (error) {
      console.error('予約処理エラー:', error)
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
    const canUse = session?.user?.role === 'member' && !hasReservationHistory
    console.log('canUseTrialOption:', {
      userRole: session?.user?.role,
      hasReservationHistory,
      canUse
    });
    return canUse
  }

  const canMakeReservation = () => {
    // 体験レッスンが利用可能な場合は予約可能
    if (canUseTrialOption()) {
      return true
    }
    // チケットが利用可能な場合は予約可能
    if (getAvailableTickets().length > 0) {
      return true
    }
    // どちらも利用できない場合は予約不可
    return false
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">
            {status === 'loading' ? '認証情報を確認中...' : 'レッスン情報を読み込み中...'}
          </p>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return null
  }

  const availableSpots = lesson.maxCapacity - lesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED').length
  const lessonStartTime = new Date(lesson.startTime)
  const currentTime = new Date()
  const thirtyMinutesBeforeStart = new Date(lessonStartTime.getTime() - 30 * 60 * 1000)
  const isPast = currentTime > thirtyMinutesBeforeStart
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
            {isFull && !isPast && session?.user?.role === 'member' && (canUseTrialOption() || getAvailableTickets().length > 0) && (
              <div className="mb-8 text-left">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">キャンセル待ちに登録</h3>
                  <p className="text-yellow-700 mb-4">
                    このレッスンは満席ですが、キャンセルが出た場合に自動的に予約が確定されます
                  </p>
                  <div className="space-y-2">
                    {canUseTrialOption() && (
                      <>
                        <p className="text-sm text-yellow-600">
                          • 予約タイプ: 体験レッスン（1,000円・当日PayPay払い）
                        </p>
                        <p className="text-sm text-yellow-600">
                          • キャンセル待ちからの自動予約確定時に体験レッスンとして予約されます
                        </p>
                      </>
                    )}
                    {!canUseTrialOption() && getAvailableTickets().length > 0 && (
                      <>
                        <p className="text-sm text-yellow-600">
                          • 利用可能チケット: {getAvailableTickets()[0]?.remainingCount}枚
                        </p>
                        <p className="text-sm text-yellow-600">
                          • キャンセル待ちからの自動予約確定時にチケット1枚消費されます
                        </p>
                      </>
                    )}
                    <p className="text-sm text-yellow-600">
                      • キャンセル待ちで予約になった時にはメールでお知らせします
                    </p>
                    <p className="text-sm text-yellow-600">
                      • 先着順で処理されます
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
            {isFull && !isPast && session?.user?.role === 'member' && !canUseTrialOption() && getAvailableTickets().length === 0 && (
              <div className="mb-8 text-left">
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
        {/* 予約確認文言 */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <span className="text-base text-yellow-800 font-semibold">
            {lesson.title} のご予約を承ります！お間違えございませんか？
          </span>
        </div>

        {/* Lesson Info */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{lesson.title}</h2>
          
          <div className="space-y-3 text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-primary-500" />
              <span>{formatDate(new Date(lesson.startTime))}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-primary-500" />
              <span>
                {formatTime(new Date(lesson.startTime))} - {formatTime(new Date(lesson.endTime))}
              </span>
            </div>
            {lesson.instructorName && (
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 mr-3 text-primary-500" />
                <span>インストラクター: {lesson.instructorName}</span>
              </div>
            )}
            {lesson.location && (
              <div className="flex items-center">
                <span className="mr-3 text-primary-500">📍</span>
                <span>開催場所: {lesson.location}</span>
              </div>
            )}
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


          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            {!canMakeReservation() && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  予約ができません。有効なチケットをご購入いただくか、スタジオまでお問い合わせください。
                </p>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !selectedReservationType || !canMakeReservation()}
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
              <li>• レッスン開始10分前までにお越しください</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}