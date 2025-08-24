'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, FileText, AlertTriangle, CheckCircle, Pencil, Trash2, Ticket, CreditCard, AlertCircle } from 'lucide-react'
import { Reservation, ReservationType, PaymentStatus, PaymentMethod, LessonType, Lesson, User as UserType } from '@/lib/types'

interface AdminReservationDetails extends Omit<Reservation, 'lesson' | 'user'> {
  lesson: Lesson
  user: UserType | null
}

interface AdminReservationDetailsPageProps {
  params: {
    id: string
  }
}

export default function AdminReservationDetailsPage({ params }: AdminReservationDetailsPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reservation, setReservation] = useState<AdminReservationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
      return
    }

    fetchReservation()
  }, [session, status, router, params.id])

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/admin/reservations?id=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        
        // Convert date strings to Date objects
        data.createdAt = new Date(data.createdAt)
        data.updatedAt = new Date(data.updatedAt)
        data.lesson.startTime = new Date(data.lesson.startTime)
        data.lesson.endTime = new Date(data.lesson.endTime)
        if (data.user) {
          data.user.createdAt = new Date(data.user.createdAt)
          data.user.updatedAt = new Date(data.user.updatedAt)
          if (data.user.consentAgreedAt) {
            data.user.consentAgreedAt = new Date(data.user.consentAgreedAt)
          }
        }

        setReservation(data)
      } else {
        router.push('/admin/reservations')
      }
    } catch (error) {
      console.error('Failed to fetch reservation:', error)
      router.push('/admin/reservations')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancelClick = async () => {
    if (!reservation) return;
    const confirmed = window.confirm('この予約を本当にキャンセルしますか？この操作は取り消せません。');
    if (confirmed) {
      setCancelling(true);
      try {
        const response = await fetch(`/api/admin/reservations?id=${reservation.id}`, { 
            method: 'DELETE',
        });
        if (response.ok) {
          alert('予約をキャンセルしました。');
          fetchReservation();
        } else {
          const errorData = await response.json();
          alert(`キャンセルに失敗しました: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Failed to cancel reservation:', error);
        alert('キャンセル処理中にエラーが発生しました。');
      } finally {
        setCancelling(false);
      }
    }
  };


  const formatDateTime = (date: Date) => {
    return date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
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

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return <Badge variant="outline">未決済</Badge>
      case PaymentStatus.PAID:
        return <Badge variant="default" className="bg-green-100 text-green-800">決済済み</Badge>
      case PaymentStatus.CANCELLED:
        return <Badge variant="destructive">キャンセル</Badge>
      case PaymentStatus.REFUNDED:
        return <Badge variant="secondary">返金済み</Badge>
      default:
        return <Badge variant="outline">不明</Badge>
    }
  }
  
    const getPaymentInfo = (reservation: AdminReservationDetails) => {
    if (reservation.paymentMethod === PaymentMethod.TICKET) {
      return {
        method: 'チケット利用',
        amount: 'チケット1枚',
        icon: <Ticket className="h-4 w-4" />
      }
    } else if (reservation.reservationType === ReservationType.TRIAL) {
      return {
        method: '当日現金払い',
        amount: '1,000円',
        icon: <CreditCard className="h-4 w-4" />
      }
    } else {
      const amount = reservation.lesson.lessonType === 'SMALL_GROUP' ? '3,500円' : '3,000円'
      return {
        method: '当日現金払い',
        amount,
        icon: <CreditCard className="h-4 w-4" />
      }
    }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>読み込み中...</p></div>
  }

  if (!reservation) {
    return <div className="min-h-screen flex items-center justify-center"><p>予約が見つかりません。</p></div>
  }

  const paymentInfo = getPaymentInfo(reservation)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin/reservations" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">予約詳細（管理者ビュー）</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-1" />
                  編集
              </Button>
              {reservation.paymentStatus !== 'CANCELLED' && (
                <Button variant="destructive" size="sm" onClick={handleCancelClick} disabled={cancelling}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  {cancelling ? 'キャンセル処理中...' : 'キャンセル'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{reservation.lesson.title}</CardTitle>
                <CardDescription>
                  {formatDateTime(reservation.lesson.startTime)} - {new Date(reservation.lesson.endTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                   <div className="flex items-center space-x-2">
                      {getReservationTypeBadge(reservation.reservationType)}
                      {getStatusBadge(reservation.paymentStatus)}
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      {paymentInfo.amount}
                    </div>
                </div>
                <div className="text-sm text-gray-600">
                    予約日時: {formatDateTime(reservation.createdAt)}
                </div>
              </CardContent>
            </Card>
            
             <Card>
              <CardHeader>
                <CardTitle>支払い情報</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center">
                    {paymentInfo.icon}
                    <span className="ml-2 text-sm">{paymentInfo.method}</span>
                  </div>
                   {reservation.paymentStatus === PaymentStatus.PENDING && 
                     reservation.paymentMethod !== PaymentMethod.TICKET && (
                      <div className="flex items-center text-amber-600 mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs">当日現金でお支払い</span>
                      </div>
                    )}
              </CardContent>
            </Card>

            {reservation.medicalInfo && (
              <Card>
                <CardHeader><CardTitle>健康上の注意点・既往歴</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{reservation.medicalInfo}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>予約者情報</CardTitle>
                {reservation.user && <Link href={`/admin/members/${reservation.user.id}`} className="text-sm text-blue-500 hover:underline">会員詳細へ</Link>}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{reservation.customerName}</span>
                   {reservation.user && <Badge variant="outline" className="ml-2 text-xs">会員</Badge>}
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="break-all">{reservation.customerEmail}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{reservation.customerPhone}</span>
                </div>
                {reservation.user?.memo && (
                    <div className="pt-2">
                        <h4 className="font-semibold mb-1">内部メモ:</h4>
                        <p className="text-xs bg-yellow-50 p-2 rounded">{reservation.user.memo}</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 