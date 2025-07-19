'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Calendar, Clock, MapPin, User, Phone, Mail, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import { Reservation, ReservationType, Lesson } from '@/lib/types'

interface ReservationWithLesson extends Reservation {
  lesson: Lesson
}

interface ReservationDetailsPageProps {
  params: {
    id: string
  }
}

export default function ReservationDetailsPage({ params }: ReservationDetailsPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reservation, setReservation] = useState<ReservationWithLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [cancelMessage, setCancelMessage] = useState('')
  const [isLateCancellation, setIsLateCancellation] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'member') {
      router.push('/auth/login')
      return
    }

    fetchReservation()
  }, [session, status, router, params.id])

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setReservation(data)
      } else {
        router.push('/member/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch reservation:', error)
      router.push('/member/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelClick = async () => {
    setCancelling(true)
    try {
      const response = await fetch(`/api/reservations/${params.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceCancel: false }),
      })

      const data = await response.json()

      if (data.requiresConfirmation) {
        setCancelMessage(data.message)
        setIsLateCancellation(data.isLateCancellation)
        setShowConfirmDialog(true)
      } else if (response.ok) {
        alert(data.message)
        router.push('/member/dashboard')
      } else {
        alert(data.error || 'キャンセルに失敗しました')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      alert('キャンセルに失敗しました')
    } finally {
      setCancelling(false)
    }
  }

  const handleConfirmCancel = async () => {
    setCancelling(true)
    try {
      const response = await fetch(`/api/reservations/${params.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceCancel: true }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        router.push('/member/dashboard')
      } else {
        alert(data.error || 'キャンセルに失敗しました')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      alert('キャンセルに失敗しました')
    } finally {
      setCancelling(false)
      setShowConfirmDialog(false)
    }
  }

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReservationTypeBadge = (type: ReservationType) => {
    switch (type) {
      case ReservationType.TRIAL:
        return <Badge variant="secondary" className="bg-green-100 text-green-800">体験</Badge>
      case ReservationType.TICKET:
        return <Badge variant="default" className="bg-purple-100 text-purple-800">チケット</Badge>
      case ReservationType.DROP_IN:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">単回利用</Badge>
      default:
        return <Badge variant="outline">不明</Badge>
    }
  }

  const canCancel = () => {
    if (!reservation) return false
    if (reservation.paymentStatus === 'CANCELLED') return false
    
    const lessonStartTime = new Date(reservation.lesson.startTime)
    const now = new Date()
    
    return lessonStartTime > now
  }

  const getCancelDeadline = () => {
    if (!reservation) return null
    
    const lessonStartTime = new Date(reservation.lesson.startTime)
    const deadline = new Date(lessonStartTime)
    deadline.setDate(deadline.getDate() - 1)
    deadline.setHours(21, 0, 0, 0)
    
    return deadline
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!reservation) {
    return null
  }

  const deadline = getCancelDeadline()
  const now = new Date()
  const isWithinFreeCancel = deadline && now <= deadline

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/member/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">予約詳細</h1>
              <p className="text-sm text-gray-600">予約内容を確認できます</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* レッスン情報 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {reservation.lesson.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {getReservationTypeBadge(reservation.reservationType)}
                  <Badge 
                    variant={reservation.paymentStatus === 'CANCELLED' ? 'destructive' : 'outline'}
                  >
                    {reservation.paymentStatus === 'CANCELLED' ? 'キャンセル済み' : '予約中'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{formatDateTime(reservation.lesson.startTime)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {formatTime(reservation.lesson.startTime)} - {formatTime(reservation.lesson.endTime)}
                  </span>
                </div>
                {reservation.lesson.instructorName && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span>インストラクター: {reservation.lesson.instructorName}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 予約者情報 */}
          <Card>
            <CardHeader>
              <CardTitle>予約者情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span>{reservation.customerName}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span>{reservation.customerEmail}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                <span>{reservation.customerPhone}</span>
              </div>
              {reservation.medicalInfo && (
                <div className="flex items-start">
                  <FileText className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <span className="font-medium">医学的情報:</span>
                    <p className="text-gray-600 mt-1">{reservation.medicalInfo}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* キャンセルポリシー */}
          {reservation.paymentStatus !== 'CANCELLED' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  キャンセルポリシー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deadline && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-800">無料キャンセル期限</p>
                        <p className="text-sm text-blue-600">
                          {deadline.toLocaleDateString('ja-JP', {
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {isWithinFreeCancel ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• <strong>期限内キャンセル</strong>: 無料でキャンセル可能</p>
                    {reservation.reservationType === ReservationType.TICKET && (
                      <p className="ml-4">- チケット利用の場合はチケットが返還されます</p>
                    )}
                    <p>• <strong>期限後キャンセル</strong>: キャンセル料が発生</p>
                    {reservation.reservationType === ReservationType.TICKET && (
                      <p className="ml-4">- チケット利用の場合はチケット1枚が消費されます</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* キャンセルボタン */}
          {canCancel() && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Button
                    onClick={handleCancelClick}
                    disabled={cancelling}
                    variant="destructive"
                    className="px-8"
                  >
                    {cancelling ? 'キャンセル中...' : '予約をキャンセルする'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 確認ダイアログ */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  キャンセル確認
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{cancelMessage}</AlertDescription>
                </Alert>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                    className="flex-1"
                    disabled={cancelling}
                  >
                    戻る
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmCancel}
                    className="flex-1"
                    disabled={cancelling}
                  >
                    {cancelling ? 'キャンセル中...' : 'キャンセルする'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}