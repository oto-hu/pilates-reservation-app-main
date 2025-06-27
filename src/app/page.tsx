'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment'
import 'moment/locale/ja'
import { Calendar, Clock, Users, CreditCard, UserCheck, LogIn, User } from 'lucide-react'
import { Lesson, CalendarEvent } from '@/lib/types'
import { formatTime } from '@/lib/utils'

const localizer = momentLocalizer(moment)
moment.locale('ja')

export default function HomePage() {
  const { data: session, status } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  // --- Start of logic from reserve page ---
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchLessons()
  }, [currentDate])

  const fetchLessons = async () => {
    setLoading(true)
    try {
      const start = new Date(currentDate)
      start.setDate(currentDate.getDate() - currentDate.getDay())
      start.setHours(0, 0, 0, 0)

      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)

      const response = await fetch(
        `/api/lessons?start=${start.toISOString()}&end=${end.toISOString()}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch lessons')
      }

      const data = await response.json()
      
      const calendarEvents: CalendarEvent[] = data.map((lesson: Lesson) => {
        const availableSpots = lesson.maxCapacity - lesson.reservations.length
        const isFull = availableSpots <= 0
        
        const instructorText = lesson.instructorName ? ` / ${lesson.instructorName}` : ''
        const title = `${lesson.title}${instructorText} (${availableSpots}/${lesson.maxCapacity})`

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
    if (!event.resource.isFull && new Date(event.start) > new Date()) {
      window.location.href = `/reserve/${event.resource.lesson.id}`
    }
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
  // --- End of logic from reserve page ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ピラティススタジオ</h1>
              <p className="text-gray-600">グループレッスン予約システム</p>
            </div>
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="text-gray-500">読み込み中...</div>
              ) : session ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-gray-700">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      {session.user?.name}さん
                    </span>
                  </div>
                  {session.user?.role === 'admin' ? (
                    <Link 
                      href="/admin/dashboard" 
                      className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      管理画面
                    </Link>
                  ) : (
                    <Link 
                      href="/member/dashboard" 
                      className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      マイページ
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    ログアウト
                  </button>
                </div>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    会員ログイン
                  </Link>
                  <Link 
                    href="/admin/login" 
                    className="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    管理者ログイン
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            心と体を整える
            <span className="text-primary-500 block">ピラティスレッスン</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            少人数制のグループレッスンで、あなたのペースに合わせたピラティスを体験してください。
            会員登録でチケット利用、非会員でも単回利用可能です。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#reserve"
              className="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg"
            >
              <Calendar className="mr-2 h-5 w-5" />
              レッスン予約はこちら
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-white border-2 border-primary-500 text-primary-500 hover:bg-primary-50 text-lg font-semibold rounded-lg transition-colors"
            >
              <UserCheck className="mr-2 h-5 w-5" />
              会員登録はこちら
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            初めての方は1,000円の体験レッスンから始められます
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            予約システムの特徴
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-primary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">会員システム</h4>
              <p className="text-gray-600">チケット制で通いやすく、ダッシュボードで残数確認</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-secondary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">3つの予約タイプ</h4>
              <p className="text-gray-600">体験レッスン・単回利用・チケット利用から選択</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">キャンセル待ち</h4>
              <p className="text-gray-600">満席でもキャンセル待ちで自動予約確定</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-secondary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">柔軟な支払い</h4>
              <p className="text-gray-600">チケット利用または当日現金払いを選択</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Reservation Section */}
      <section id="reserve" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            レッスンを予約
          </h3>
          {/* Legend */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-center">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">予約可能</span>
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

          {/* Lesson List */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">今週のレッスン一覧</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">レッスン情報を読み込み中...</p>
              </div>
            ) : events.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => {
                  const { lesson, availableSpots, isFull } = event.resource
                  const isPast = new Date(event.start) < new Date()
                  
                  return (
                    <div key={event.id} className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isPast
                              ? 'bg-gray-200 text-gray-700'
                              : isFull
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {isPast ? '終了' : isFull ? '満席' : '予約可能'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>
                            {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>残り {availableSpots}/{lesson.maxCapacity} 席</span>
                        </div>
                        <div className="flex items-center font-bold text-primary-600">
                          <span className="mr-2 text-lg">💴</span>
                          <span>{lesson.price.toLocaleString()}円</span>
                        </div>
                        {lesson.instructorName && (
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 mr-2" />
                            <span>インストラクター: {lesson.instructorName}</span>
                          </div>
                        )}
                      </div>

                      {!isPast && !isFull && (
                        <button
                          onClick={() => handleSelectEvent(event)}
                          className="w-full text-center inline-block px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors shadow"
                        >
                          予約する
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">今週はレッスンがありません</p>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              defaultView="week"
              views={['week']}
              date={currentDate}
              onNavigate={setCurrentDate}
              messages={{
                next: '次週',
                previous: '前週',
                today: '今週',
                month: '月',
                week: '週',
                day: '日'
              }}
              min={new Date(2024, 0, 1, 10, 0, 0)} // 10:00 AM
              max={new Date(2024, 0, 1, 22, 0, 0)} // 10:00 PM
            />
          </div>
        </div>
      </section>

      {/* Studio Info */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                スタジオについて
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                20〜40代の女性を中心に、心と体の健康をサポートするピラティススタジオです。
                経験豊富なインストラクターが、一人ひとりのレベルに合わせて丁寧に指導いたします。
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                  初心者から上級者まで対応
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                  清潔で快適なスタジオ環境
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                  必要な器具は全て完備
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg p-8 text-center">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">今すぐ予約</h4>
              <p className="text-gray-600 mb-6">
                お気軽にレッスンを体験してください
              </p>
              <Link
                href="#reserve"
                className="btn-primary inline-flex items-center px-6 py-3 text-lg"
              >
                <Calendar className="mr-2 h-5 w-5" />
                予約ページへ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h5 className="text-2xl font-bold mb-4">ピラティススタジオ</h5>
            <p className="text-gray-400">
              © 2024 Pilates Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}