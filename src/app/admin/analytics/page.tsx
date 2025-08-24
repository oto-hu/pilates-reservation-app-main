'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react'

interface AnalyticsData {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  userStats: {
    total: number
    genderStats: Record<string, number>
    ageStats: Record<string, number>
    averageAge: number
    repeatUsers: number
    firstTimeUsers: number
    noReservationUsers: number
    repeatRate: number
  }
  reservationStats: {
    total: number
    typeStats: Record<string, number>
    monthlyStats: Record<string, number>
    lessonPopularity: Record<string, number>
    cancellationRate: number
    cancelledCount: number
  }
  newUsersByMonth: Record<string, number>
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return
    }

    fetchAnalytics()
  }, [status, period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?days=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">統計データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">データの読み込みに失敗しました</p>
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
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  <span className="sm:hidden">分析</span>
                  <span className="hidden sm:inline">統計分析</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">会員・予約データの分析</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm"
              >
                <option value={7}>過去7日間</option>
                <option value={30}>過去30日間</option>
                <option value={90}>過去90日間</option>
                <option value={365}>過去1年間</option>
              </select>
              <Link href="/admin/dashboard">
                <button className="btn-outline flex items-center px-3 sm:px-4 py-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">ダッシュボードに戻る</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 期間表示 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            分析期間: {formatDate(analyticsData.period.startDate)} 〜 {formatDate(analyticsData.period.endDate)}
          </p>
        </div>

        {/* 主要統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">総会員数</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.userStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">総予約数</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.reservationStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">リピーター率</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.userStats.repeatRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">キャンセル率</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.reservationStats.cancellationRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 男女比 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              男女比
            </h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.userStats.genderStats).map(([gender, count]) => (
                <div key={gender} className="flex items-center justify-between">
                  <span className="text-gray-600">{gender}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${formatPercentage(count, analyticsData.userStats.total)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {count} ({formatPercentage(count, analyticsData.userStats.total)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 年代別分布 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              年代別分布
            </h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.userStats.ageStats)
                .sort((a, b) => {
                  if (a[0] === '未設定') return 1
                  if (b[0] === '未設定') return -1
                  return a[0].localeCompare(b[0])
                })
                .map(([ageRange, count]) => (
                <div key={ageRange} className="flex items-center justify-between">
                  <span className="text-gray-600">{ageRange}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${formatPercentage(count, analyticsData.userStats.total)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {count} ({formatPercentage(count, analyticsData.userStats.total)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                平均年齢: <span className="font-medium">{analyticsData.userStats.averageAge}歳</span>
              </p>
            </div>
          </div>

          {/* ユーザー分類 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              ユーザー分類
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700">リピーター</span>
                </div>
                <span className="font-semibold text-green-600">
                  {analyticsData.userStats.repeatUsers}人
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-gray-700">初回利用者</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {analyticsData.userStats.firstTimeUsers}人
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <UserX className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-700">未利用者</span>
                </div>
                <span className="font-semibold text-gray-600">
                  {analyticsData.userStats.noReservationUsers}人
                </span>
              </div>
            </div>
          </div>

          {/* 予約タイプ別統計 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              予約タイプ別統計
            </h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.reservationStats.typeStats).map(([type, count]) => {
                const typeNames: Record<string, string> = {
                  'TRIAL': '体験レッスン',
                  'DROP_IN': '単回利用',
                  'TICKET': 'チケット利用'
                }
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-600">{typeNames[type] || type}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${formatPercentage(count, analyticsData.reservationStats.total)}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {count} ({formatPercentage(count, analyticsData.reservationStats.total)}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* レッスン別人気度 */}
        {Object.keys(analyticsData.reservationStats.lessonPopularity).length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">レッスン別人気度</h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.reservationStats.lessonPopularity)
                .sort((a, b) => b[1] - a[1])
                .map(([lessonTitle, count]) => (
                <div key={lessonTitle} className="flex items-center justify-between">
                  <span className="text-gray-600 truncate flex-1">{lessonTitle}</span>
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${formatPercentage(count, analyticsData.reservationStats.total)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 min-w-[60px] text-right">
                      {count}回
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 