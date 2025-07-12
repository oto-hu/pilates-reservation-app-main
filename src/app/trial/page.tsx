'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Users, UserCheck, ArrowLeft, Star, Gift } from 'lucide-react'
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
        const availableSpots = lesson.maxCapacity - lesson.reservations.length
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
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">体験レッスン予約</h1>
                <p className="text-gray-600">初めての方は1,000円で体験レッスンを受講できます</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Gift className="h-12 w-12 text-primary-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">体験レッスン 1,000円</h2>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              初めての方限定の特別価格でピラティスを体験できます
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-8 w-8 text-primary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">初回限定</h3>
                <p className="text-sm text-gray-600">初めての方のみ1,000円で体験可能</p>
              </div>
              <div className="text-center">
                <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="h-8 w-8 text-secondary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">専門指導</h3>
                <p className="text-sm text-gray-600">経験豊富なインストラクターが丁寧に指導</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-primary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">少人数制</h3>
                <p className="text-sm text-gray-600">少人数制で一人ひとりに目が届く</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">
                💡 体験レッスンを受講後、ご入会いただくと通常料金でレッスンを受講できます
              </p>
            </div>
          </div>
        </div>
      </section>

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
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-primary-500" />
                        <span>残り {availableSpots}/{lesson.maxCapacity} 席</span>
                      </div>
                      {lesson.instructorName && (
                        <div className="flex items-center">
                          <UserCheck className="h-4 w-4 mr-2 text-primary-500" />
                          <span>インストラクター: {lesson.instructorName}</span>
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

                    {!isPast && !isFull ? (
                      <div className="space-y-3">
                        <Link
                          href={`/reserve/${lesson.id}/new-user`}
                          className="w-full text-center inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
                        >
                          体験レッスンを予約する
                        </Link>
                        <p className="text-xs text-gray-500 text-center">
                          ※ 新規会員登録が必要です
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">
                          {isPast ? 'このレッスンは終了しています' : 'このレッスンは満席です'}
                        </p>
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            体験レッスンでピラティスを始めませんか？
          </h3>
          <p className="text-xl text-white/90 mb-8">
            初めての方でも安心して受講できるよう、丁寧に指導いたします
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 hover:bg-gray-50 text-lg font-semibold rounded-lg transition-colors shadow-lg"
            >
              <UserCheck className="mr-2 h-5 w-5" />
              新規会員登録
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 text-lg font-semibold rounded-lg transition-colors"
            >
              <Calendar className="mr-2 h-5 w-5" />
              会員ログイン
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
} 