'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Users, UserCheck, ArrowLeft, Star, Gift, Building2 } from 'lucide-react'
import { Lesson, CalendarEvent } from '@/lib/types'
import { formatTime } from '@/lib/utils'

export default function TrialPage() {
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
        const availableSpots = lesson.maxCapacity - lesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED').length
        const isFull = availableSpots <= 0
        
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
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    const lessonStartTime = new Date(event.start)
    const currentTime = new Date()
    const thirtyMinutesBeforeStart = new Date(lessonStartTime.getTime() - 30 * 60 * 1000)
    
    if (!event.resource.isFull && currentTime <= thirtyMinutesBeforeStart) {
      window.location.href = `/reserve/${event.resource.lesson.id}/new-user`
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const { isFull } = event.resource
    const lessonStartTime = new Date(event.start)
    const currentTime = new Date()
    const thirtyMinutesBeforeStart = new Date(lessonStartTime.getTime() - 30 * 60 * 1000)
    const isPast = currentTime > thirtyMinutesBeforeStart
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">体験レッスン予約</h1>
                <p className="text-sm text-gray-600">ご希望の体験レッスンを選択してください</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Lesson List */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            体験レッスン可能なレッスン一覧
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

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">レッスン情報を読み込み中...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const { lesson, availableSpots, isFull } = event.resource
                const lessonStartTime = new Date(event.start)
                const currentTime = new Date()
                const thirtyMinutesBeforeStart = new Date(lessonStartTime.getTime() - 30 * 60 * 1000)
                const isPast = currentTime > thirtyMinutesBeforeStart
                
                return (
                  <div key={event.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg">{lesson.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                    
                    <div className="space-y-3 text-gray-600 mb-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary-500" />
                        <span className="font-medium">
                          {new Date(event.start).toLocaleDateString('ja-JP', {
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary-500" />
                        <span>
                          {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                        </span>
                      </div>
                      {lesson.instructorName && (
                        <div className="flex items-center">
                          <UserCheck className="h-4 w-4 mr-2 text-primary-500" />
                          <span>インストラクター: {lesson.instructorName}</span>
                        </div>
                      )}
                      {lesson.location && (
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-primary-500" />
                          <span>会場: {lesson.location}</span>
                        </div>
                      )}
                      <div className="flex items-center font-bold text-primary-600 text-lg">
                        <span className="mr-2">💴</span>
                        <span>体験料金: 1,000円</span>
                      </div>
                    </div>

                    {lesson.description && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">{lesson.description}</p>
                      </div>
                    )}

                    {!isPast ? (
                      <div className="space-y-3">
                        {!isFull ? (
                          <Link
                            href={`/reserve/${lesson.id}/new-user`}
                            className="w-full text-center inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
                          >
                            体験レッスンを予約する
                          </Link>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <h4 className="text-lg font-semibold text-yellow-800 mb-2">このレッスンは満席です</h4>
                              <p className="text-yellow-700 mb-3">
                                キャンセルが出た場合に体験レッスン（1,000円・当日PayPay払い）として自動的に予約が確定されます
                              </p>
                              <div className="space-y-2 text-sm text-yellow-600">
                                <p>• キャンセル待ちで予約になった時にはメールでお知らせします</p>
                                <p>• 先着順で処理されます</p>
                              </div>
                            </div>
                            <Link
                              href={`/reserve/${lesson.id}/new-user?waitlist=true`}
                              className="w-full text-center inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
                            >
                              キャンセル待ちに登録する
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">このレッスンは終了しています</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">今週は体験レッスン可能なレッスンがありません</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
} 