// src/app/reserve/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment'
import 'moment/locale/ja'
import Link from 'next/link'
import { ArrowLeft, Users, Clock, UserCheck } from 'lucide-react'
import { Lesson, CalendarEvent } from '@/lib/types'
import { formatTime } from '@/lib/utils'

const localizer = momentLocalizer(moment)

moment.locale('ja')

export default function ReservePage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchLessons()
  }, [currentDate])

  const fetchLessons = async () => {
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
      setLessons(data)

      const calendarEvents: CalendarEvent[] = data.map((lesson: Lesson) => {
        const availableSpots = lesson.maxCapacity - lesson.reservations.length
        const isFull = availableSpots <= 0
        
        // インストラクター名を含むタイトルを作成
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">レッスン情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">レッスン予約</h1>
                <p className="text-sm text-gray-600">ご希望の日時を選択してください</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Legend */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">今週のレッスン一覧</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const { lesson, availableSpots, isFull } = event.resource
              const isPast = new Date(event.start) < new Date()
              
              return (
                <div key={event.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isPast
                          ? 'bg-gray-100 text-gray-600'
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
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>残り {availableSpots}/{lesson.maxCapacity} 席</span>
                    </div>
                    {lesson.instructorName && (
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 mr-2" />
                        <span>インストラクター: {lesson.instructorName}</span>
                      </div>
                    )}
                  </div>

                  {lesson.description && (
                    <p className="text-sm text-gray-600 mb-4">{lesson.description}</p>
                  )}

                  {!isPast && !isFull && (
                    <Link
                      href={`/reserve/${lesson.id}`}
                      className="btn-primary w-full text-center inline-block"
                    >
                      予約する
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          {events.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">今週はレッスンがありません</p>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Calendar
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
    </div>
  )
}