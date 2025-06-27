'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Ticket, User, LogOut, Calendar } from 'lucide-react'
import { Ticket as TicketType, Reservation } from '@/lib/types'

interface DashboardData {
  tickets: (TicketType & { lessonTypeName: string })[]
  upcomingReservations: (Reservation & { lesson: { title: string; startTime: string } })[]
}

export default function MemberDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'member') {
      router.push('/auth/login')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/member/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiryTime = new Date(expiryDate).getTime()
    const now = new Date().getTime()
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000)
    return expiryTime <= thirtyDaysFromNow && expiryTime > now
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {session?.user?.name}さん
                </h1>
                <p className="text-sm text-gray-500">会員ダッシュボード</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/reserve">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  レッスン予約
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* チケット情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ticket className="h-5 w-5 mr-2" />
                チケット残数
              </CardTitle>
              <CardDescription>
                お持ちのチケットと有効期限をご確認ください
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.tickets && dashboardData.tickets.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{ticket.lessonTypeName}</p>
                        <p className="text-sm text-gray-600">
                          有効期限: {formatExpiryDate(ticket.expiresAt.toString())}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {ticket.remainingCount}
                        </div>
                        <div className="text-sm text-gray-500">枚</div>
                        {isExpired(ticket.expiresAt.toString()) && (
                          <Badge variant="destructive" className="mt-1">期限切れ</Badge>
                        )}
                        {isExpiringSoon(ticket.expiresAt.toString()) && !isExpired(ticket.expiresAt.toString()) && (
                          <Badge variant="outline" className="mt-1 border-orange-500 text-orange-600">期限間近</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">チケットをお持ちではありません</p>
                  <p className="text-sm text-gray-400 mt-1">
                    スタジオでチケットを購入してください
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 予約状況 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2" />
                今後の予約
              </CardTitle>
              <CardDescription>
                予約済みのレッスンを確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.upcomingReservations && dashboardData.upcomingReservations.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.upcomingReservations.map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{reservation.lesson.title}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(reservation.lesson.startTime)}
                        </p>
                        <div className="flex items-center mt-2">
                          <Badge 
                            variant={reservation.reservationType === 'TRIAL' ? 'secondary' : 
                                    reservation.reservationType === 'TICKET' ? 'default' : 'outline'}
                          >
                            {reservation.reservationType === 'TRIAL' ? '体験' :
                             reservation.reservationType === 'TICKET' ? 'チケット' : '単回利用'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <Link href={`/member/reservations/${reservation.id}`}>
                          <Button variant="outline" size="sm">
                            詳細
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">予約がありません</p>
                  <Link href="/reserve" className="inline-block mt-4">
                    <Button>
                      レッスンを予約する
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}