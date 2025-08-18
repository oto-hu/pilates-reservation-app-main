'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Calendar, Clock, User, Phone, Mail, FileText, AlertCircle, Ticket, CreditCard, Eye, ArrowLeft } from 'lucide-react'
import { Reservation, ReservationType, PaymentStatus, PaymentMethod } from '@/lib/types'

interface ReservationWithDetails extends Omit<Reservation, 'lesson' | 'user'> {
  lesson: {
    title: string
    startTime: string
    endTime: string
    lessonType: string
  }
  user?: {
    name: string
    email: string
  }
}

export default function AdminReservationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
  const [filteredReservations, setFilteredReservations] = useState<ReservationWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
      return
    }

    fetchReservations()
  }, [session, status, router])

  useEffect(() => {
    let filtered = reservations

    if (searchTerm) {
      filtered = filtered.filter(reservation => 
        reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.paymentStatus === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.reservationType === typeFilter)
    }

    setFilteredReservations(filtered)
  }, [reservations, searchTerm, statusFilter, typeFilter])

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/admin/reservations')
      if (response.ok) {
        const data = await response.json()
        setReservations(data)
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const getPaymentInfo = (reservation: ReservationWithDetails) => {
    if (reservation.paymentMethod === PaymentMethod.TICKET) {
      return {
        method: 'チケット利用',
        amount: 'チケット1枚',
        icon: <Ticket className="h-4 w-4" />
      }
    } else if (reservation.reservationType === ReservationType.TRIAL) {
      return {
        method: '当日PayPay払い',
        amount: '1,000円',
        icon: <CreditCard className="h-4 w-4" />
      }
    } else {
      const amount = reservation.lesson.lessonType === 'SMALL_GROUP' ? '3,500円' : '3,000円'
      return {
        method: '当日PayPay払い',
        amount,
        icon: <CreditCard className="h-4 w-4" />
      }
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  <span className="sm:hidden">予約</span>
                  <span className="hidden sm:inline">予約管理</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">全ての予約を確認・管理できます</p>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm" className="px-3 sm:px-4">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">ダッシュボードに戻る</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">検索</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="名前、メール、レッスン名で検索"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">支払いステータス</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスで絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全て</SelectItem>
                    <SelectItem value="PENDING">未決済</SelectItem>
                    <SelectItem value="PAID">決済済み</SelectItem>
                    <SelectItem value="CANCELLED">キャンセル</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">予約タイプ</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="タイプで絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全て</SelectItem>
                    <SelectItem value="TRIAL">体験</SelectItem>
                    <SelectItem value="DROP_IN">単回利用</SelectItem>
                    <SelectItem value="TICKET">チケット</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  {filteredReservations.length} 件の予約
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const paymentInfo = getPaymentInfo(reservation)
            
            return (
              <Card key={reservation.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">{reservation.lesson.title}</h3>
                        <div className="flex items-center space-x-2">
                          {getReservationTypeBadge(reservation.reservationType)}
                          {getStatusBadge(reservation.paymentStatus)}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDateTime(reservation.lesson.startTime)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>
                            {new Date(reservation.lesson.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(reservation.lesson.endTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">予約者情報</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{reservation.customerName}</span>
                          {reservation.user && (
                            <Badge variant="outline" className="ml-2 text-xs">会員</Badge>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{reservation.customerEmail}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{reservation.customerPhone}</span>
                        </div>
                        {reservation.medicalInfo && (
                          <div className="flex items-start">
                            <FileText className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                            <span className="text-xs text-gray-600">{reservation.medicalInfo}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">支払い情報</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          {paymentInfo.icon}
                          <span className="ml-2 text-sm">{paymentInfo.method}</span>
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          {paymentInfo.amount}
                        </div>
                        {reservation.paymentStatus === PaymentStatus.PENDING && 
                         reservation.paymentMethod !== PaymentMethod.TICKET && (
                          <div className="flex items-center text-amber-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">当日PayPayでお支払い</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <Link href={`/admin/reservations/${reservation.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            詳細確認
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredReservations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">条件に一致する予約が見つかりません</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}