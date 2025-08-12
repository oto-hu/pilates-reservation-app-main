'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment'
import 'moment/locale/ja'
import { Plus, LogOut, Users, Calendar as CalendarIcon, Settings, Eye, Menu, X, BarChart3, CreditCard, FileText, Layout } from 'lucide-react'
import { Lesson, Reservation, CalendarEvent } from '@/lib/types'
import { formatTime, formatDate } from '@/lib/utils'

const localizer = momentLocalizer(moment)
moment.locale('ja')

// カスタムスタイル
const customCalendarStyle = `
  .calendar-container {
    width: 100%;
    height: 600px;
    overflow: hidden;
    border-radius: 8px;
  }
  
  .calendar-container .rbc-calendar {
    height: 100% !important;
    max-height: 600px;
    overflow: hidden;
  }
  
  @media (max-width: 768px) {
    .calendar-container {
      height: 500px;
    }
    
    .calendar-container .rbc-calendar {
      height: 100% !important;
      max-height: 500px;
    }
    
    .calendar-container .rbc-toolbar {
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-shrink: 0;
    }
    
    .calendar-container .rbc-toolbar-label {
      font-size: 1rem;
      margin: 0.5rem 0;
    }
    
    .calendar-container .rbc-btn-group {
      display: flex;
      justify-content: center;
    }
    
    .calendar-container .rbc-header {
      font-size: 0.75rem;
      padding: 0.25rem;
    }
    
    .calendar-container .rbc-time-view .rbc-time-gutter {
      width: 50px;
    }
    
    .calendar-container .rbc-time-view .rbc-time-slot {
      font-size: 0.75rem;
    }
    
    .calendar-container .rbc-event {
      font-size: 0.75rem;
      padding: 2px 4px;
    }
    
    .calendar-container .rbc-allday-cell {
      display: none;
    }
    
    .calendar-container .rbc-time-content {
      overflow-y: auto;
      max-height: calc(100% - 80px);
    }
  }
  
  @media (max-width: 480px) {
    .calendar-container {
      height: 450px;
    }
    
    .calendar-container .rbc-calendar {
      height: 100% !important;
      max-height: 450px;
    }
    
    .calendar-container .rbc-time-view .rbc-time-gutter {
      width: 40px;
    }
    
    .calendar-container .rbc-time-view .rbc-time-slot {
      font-size: 0.625rem;
    }
    
    .calendar-container .rbc-event {
      font-size: 0.625rem;
      padding: 1px 2px;
    }
    
    .calendar-container .rbc-header {
      font-size: 0.625rem;
      padding: 0.125rem;
    }
    
    .calendar-container .rbc-time-content {
      max-height: calc(100% - 70px);
    }
  }
`

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [view, setView] = useState<'week' | 'month' | 'day'>('week')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleViewChange = (newView: any) => {
    if (newView === 'month' || newView === 'week' || newView === 'day') {
      setView(newView)
    }
  }
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return
    }

    fetchLessons()
  }, [status, currentDate, view])

  const fetchLessons = async () => {
    try {
      let start: Date, end: Date

      if (view === 'day') {
        start = new Date(currentDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(currentDate)
        end.setHours(23, 59, 59, 999)
      } else if (view === 'week') {
        start = new Date(currentDate)
        start.setDate(currentDate.getDate() - currentDate.getDay())
        start.setHours(0, 0, 0, 0)
        end = new Date(start)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
      } else {
        start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999)
      }

      const response = await fetch(
        `/api/lessons?start=${start.toISOString()}&end=${end.toISOString()}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch lessons')
      }

      const data = await response.json()
      setLessons(data)

      const calendarEvents: CalendarEvent[] = data.map((lesson: Lesson) => {
        const availableSpots = lesson.maxCapacity - lesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED').length
        const isFull = availableSpots <= 0
        
        // インストラクター名を含むタイトルを作成
        const instructorText = lesson.instructorName ? ` / ${lesson.instructorName}` : ''
        const title = `${lesson.title}${instructorText}${isFull ? '（満員）' : ''}`

        return {
          id: lesson.id,
          title: title,
          start: new Date(lesson.startTime),
          end: new Date(lesson.endTime),
          resource: {
            lesson,
            availableSpots,
            isFull
          }
        }
      })

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedLesson(event.resource.lesson)
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const { isFull } = event.resource
    const isPast = new Date(event.start) < new Date()
    
    let backgroundColor = '#22c55e' // green for available
    
    if (isPast) {
      backgroundColor = '#94a3b8' // gray for past
    } else if (isFull) {
      backgroundColor = '#ef4444' // red for full
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 4px'
      }
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin/login')
  }

  const menuItems = [
    { href: '/admin/analytics', label: '統計分析', icon: BarChart3 },
    { href: '/admin/members', label: '会員管理', icon: Users },
    { href: '/admin/reservations', label: '予約管理', icon: CalendarIcon },
    { href: '/admin/tickets', label: 'チケット管理', icon: CreditCard },
    { href: '/admin/ticket-groups', label: 'チケットカテゴリ管理', icon: Settings },
    { href: '/admin/lesson-templates', label: 'テンプレート管理', icon: Layout },
    { href: '/admin/consent-forms', label: '同意書管理', icon: FileText },
    { href: '/', label: 'サイト表示', icon: Eye },
  ]

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* カスタムスタイルの追加 */}
      <style jsx>{customCalendarStyle}</style>
      
      {/* Header */}
      <header className="bg-white shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
              <p className="text-gray-600">レッスン管理システム</p>
              {session?.user?.name && (
                <p className="text-sm text-gray-500 mt-1">
                  {session.user.name}さんでログイン中
                </p>
              )}
            </div>
            
            {/* PC Menu - lg以上で表示 */}
            <div className="hidden lg:flex items-center space-x-4">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} className="text-gray-500 hover:text-gray-700">
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5 mr-1" />
                ログアウト
              </button>
            </div>

            {/* Mobile Hamburger Button - lg未満で表示 */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 lg:hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">メニュー</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="p-4">
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <IconComponent className="h-5 w-5 mr-3 text-gray-500" />
                      {item.label}
                    </Link>
                  )
                })}
                
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3 text-gray-500" />
                  ログアウト
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Calendar - Full Width on Mobile, Grid on Desktop */}
        <div className="space-y-8 lg:grid lg:grid-cols-4 lg:gap-8 lg:space-y-0">
          {/* Calendar Section - Full width on mobile, 3 columns on desktop */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                <h2 className="text-xl font-semibold text-gray-900">レッスンカレンダー</h2>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setView('day')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        view === 'day' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      日
                    </button>
                    <button
                      onClick={() => setView('week')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        view === 'week' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      週
                    </button>
                    <button
                      onClick={() => setView('month')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        view === 'month' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      月
                    </button>
                  </div>
                  <Link href="/admin/lessons/new" className="btn-primary flex items-center justify-center">
                    <Plus className="h-4 w-4 mr-2" />
                    新規レッスン
                  </Link>
                </div>
              </div>

              <div className="calendar-container">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
                  view={view}
                  date={currentDate}
                  onView={handleViewChange}
                  onNavigate={setCurrentDate}
                  onSelectEvent={handleSelectEvent}
                  eventPropGetter={eventStyleGetter}
                  messages={{
                    next: '次',
                    previous: '前',
                    today: '今日',
                    month: '月',
                    week: '週',
                    day: '日'
                  }}
                  min={new Date(2024, 0, 1, 10, 0, 0)}
                  max={new Date(2024, 0, 1, 22, 0, 0)}
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Below calendar on mobile, right side on desktop */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">概要</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">今日のレッスン</span>
                  <span className="font-semibold">
                    {events.filter(e => 
                      new Date(e.start).toDateString() === new Date().toDateString()
                    ).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">今週のレッスン</span>
                  <span className="font-semibold">{events.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">総予約数</span>
                  <span className="font-semibold">
                    {lessons.reduce((sum, lesson) => sum + lesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED').length, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">凡例</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">空きあり</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">満席</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">終了</span>
                </div>
              </div>
            </div>

            {/* Selected Lesson Details */}
            {selectedLesson && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">レッスン詳細</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedLesson.title}</h4>
                    <p className="text-sm text-gray-600">{formatDate(new Date(selectedLesson.startTime))}</p>
                    <p className="text-sm text-gray-600">
                      {formatTime(new Date(selectedLesson.startTime))} - {formatTime(new Date(selectedLesson.endTime))}
                    </p>
                    <p className="text-sm text-gray-600">
                      インストラクター: {selectedLesson.instructorName || '未設定'}
                    </p>
                    {selectedLesson.location && (
                      <p className="text-sm text-gray-600">
                        開催場所: {selectedLesson.location}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">
                      予約: {selectedLesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED').length}/{selectedLesson.maxCapacity}
                    </p>
                  </div>

                  {selectedLesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED').length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">予約者一覧</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedLesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED').map((reservation: Reservation) => (
                          <div key={reservation.id} className="text-sm p-2 bg-gray-50 rounded">
                            <div className="font-medium">{reservation.customerName}</div>
                            <div className="text-gray-600">{reservation.customerEmail}</div>
                            {reservation.medicalInfo && (
                              <div className="text-xs text-blue-600 mt-1 p-2 bg-blue-50 rounded">
                                <strong>医学的情報:</strong> {reservation.medicalInfo}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {reservation.paymentMethod === 'PAY_NOW' ? 'オンライン決済' : '当日支払い'}
                              {reservation.paymentStatus === 'PAID' ? ' (済)' : ' (未)'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLesson.reservations.filter(r => r.paymentStatus === 'CANCELLED').length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">キャンセル済み予約</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedLesson.reservations.filter(r => r.paymentStatus === 'CANCELLED').map((reservation: Reservation) => (
                          <div key={reservation.id} className="text-sm p-2 bg-red-50 rounded border border-red-200">
                            <div className="font-medium text-red-800">{reservation.customerName}</div>
                            <div className="text-red-600">{reservation.customerEmail}</div>
                            <div className="text-xs text-red-500">
                              キャンセル済み
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <Link
                      href={`/admin/lessons/${selectedLesson.id}/edit`}
                      className="btn-outline w-full text-center text-sm flex items-center justify-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      編集
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}