'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Ticket, User, LogOut, Calendar, FileText, UserCheck, AlertCircle } from 'lucide-react'
import { Ticket as TicketType, Reservation } from '@/lib/types'
import ProfileCompleteModal from '@/components/ProfileCompleteModal'

interface DashboardData {
  tickets: (TicketType & { lessonTypeName: string })[]
  upcomingReservations: (Reservation & { lesson: { title: string; startTime: string } })[]
  profileCompleted: boolean
}

export default function MemberDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [hasShownModal, setHasShownModal] = useState(false)

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
        
        // 初回ログイン時で、プロフィールが未完了の場合はモーダルを表示
        if (!data.profileCompleted && !hasShownModal) {
          const isFirstLogin = !localStorage.getItem('profile-modal-shown')
          if (isFirstLogin) {
            setShowProfileModal(true)
            setHasShownModal(true)
          }
        }
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

  const handleModalClose = () => {
    setShowProfileModal(false)
  }

  const handleModalSkip = () => {
    localStorage.setItem('profile-modal-shown', 'true')
    setShowProfileModal(false)
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
              <Link href="/member/profile">
                <Button variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  プロフィール
                </Button>
              </Link>
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
        {/* プロフィール完了促進バナー */}
        {dashboardData && !dashboardData.profileCompleted && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900">プロフィールを完成させましょう</h3>
                    <p className="text-sm text-orange-700">
                      追加情報を入力して、より良いレッスン体験を受けましょう
                    </p>
                  </div>
                </div>
                <Link href="/member/profile">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <UserCheck className="h-4 w-4 mr-2" />
                    プロフィールを完成
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

        {/* 会員会則 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              会員会則
            </CardTitle>
            <CardDescription>
              ピラティススタジオの会員会則をご確認ください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4 text-sm text-gray-700">
                <div className="font-semibold text-gray-900">●入会資格について</div>
                <p>医師等により運動を禁じられている　・妊娠中　・暴力団関係者　・感染症および感染性のある皮膚病がある　・現在18歳未満(保護者から同意が得られる場合は入会可)</p>
                <p>同意書・会員会則に記載の内容に同意できない</p>
                <p>虚偽申告が発覚又は会則及びコンプライアンスに違反した際に退会処分にされる事を了承できない</p>
                
                <div className="font-semibold text-gray-900 mt-6">●レッスンに関して</div>
                <p>チケット残数は会員ログイン後に名ページにてご確認をお願い致します。</p>
                <p>万が一お客様の会員情報が消失した場合、チケット情報に関しては当サロンの記録情報に準じます。</p>
                <p>チケットが残っている状態のみレッスンを受講する事ができます。</p>
                <p>キャンセルはレッスン予約日の前日21時00分までにキャンセル処理をお願い致します。</p>
                <p>いかなる理由においても上記時間を過ぎてのキャンセルは100％チャージ(1回分消化)となります。</p>
                <p>当日キャンセルも同様に、いかなる理由においても100％チャージ(1回分消化)となります。</p>
                <p>レッスン当日に事前連絡なく開始時間を過ぎた場合も自動キャンセル扱い（1回分消化）となります。</p>
                <p>入室はレッスン開始時間の10分前から可能です。それより前からの入室はできません。</p>
                <p>※体験時のみ開始時間の15分前に集合となります。</p>
                <p>翌月分の予約受付は毎月10日9:00から開始となります。</p>
                <p>1日最大1レッスンまでとなります。</p>
                <p>当日にスタジオならびインストラクター都合により急遽休講する場合やレッスン内容や定員数などレッスンに関する事項を変更する場合がございます。</p>
                <p>レッスンスケジュールは月によりレッスン時間、レッスンレベル、レッスンの種類、レッスンの量が変動する場合がございます。</p>
                
                <div className="font-semibold text-gray-900 mt-6">●プランについて</div>
                <p>いかなる理由においても購入後の払い戻しは一切致しかねます。</p>
                <p>チケット最終消化日から6か月以上プランを更新されない場合は自動退会となります。</p>
                <p>再入会の際は別途入会金5,000円が発生します。</p>

                <div className="font-semibold text-gray-900 mt-6">●休会に関して</div>
                <p>休会を希望する月の前月15日までの申請にて適応となります。(例)8/1から休会希望→7/15までに申請会場にて、会員ご本人様による書面でのお手続きが必要となります。</p>
                <p>休会期間は最長6か月となります。休会期間の日数分が有効期限から延長されます。</p>

                <div className="font-semibold text-gray-900 mt-6">●休会に関して</div>
                <p>休会を希望する月の前月15日までの申請にて適応となります。(例)8/1から休会希望→7/15までに申請会場にて、会員ご本人様による書面でのお手続きが必要となります。</p>
                <p>休会期間は最長6か月となります。休会期間の日数分が有効期限から延長されます。</p>

                <div className="font-semibold text-gray-900 mt-6">●損害賠償責任免責</div>
                <p>会員が当サロンが運営するスタジオ・提携するスタジオでのレッスン中、又は左記スタジオ周辺で</p>
                <p>受けた損害に対して当サロン・インストラクター及び開催場所管理者は損害に関する一切の責任を</p>
                <p>負いません。</p>
                <p>自己所有物の破損、紛失、盗難や事故、怪我に対する請求、訴訟その他一切の責任を追及できません。</p>
                
                <div className="font-semibold text-gray-900 mt-6">●同意</div>
                <p>虚偽申告が発覚又は会則及びコンプライアンスに違反した際に退会処分とさせて頂く場合がございます。</p>
                <p>サロンの判断により、事前予告なく会則の内容を変更・追加・削除(以下「変更内容」)される事があります。その際、変更内容や適用開始時期をスタジオ所定の方法で告知するものとします。会員は変更内容に</p>
                <p>同意したものとみなされます。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* プロフィール完了促進モーダル */}
      <ProfileCompleteModal
        isOpen={showProfileModal}
        onClose={handleModalClose}
        onSkip={handleModalSkip}
      />
    </div>
  )
}