'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Lesson, NewUserReservationData } from '@/lib/types'
import NewUserReservationForm from '@/components/NewUserReservationForm'

interface NewUserReservationPageProps {
  params: {
    lessonId: string
  }
}

export default function NewUserReservationPage({ params }: NewUserReservationPageProps) {
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchLesson()
  }, [params.lessonId])

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons?start=${new Date().toISOString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch lesson')
      }

      const lessons = await response.json()
      const currentLesson = lessons.find((l: Lesson) => l.id === params.lessonId)
      
      if (!currentLesson) {
        router.push('/reserve')
        return
      }
      
      setLesson(currentLesson)
    } catch (error) {
      console.error('Error fetching lesson:', error)
      router.push('/reserve')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: NewUserReservationData): Promise<{ userId: string; customerName: string; customerEmail: string }> => {
    if (!lesson) throw new Error('Lesson not found')

    setSubmitting(true)

    try {
      const reservationData: NewUserReservationData = {
        ...data,
        lessonId: lesson.id
      }

      console.log('📤 送信データ:', reservationData);

      const response = await fetch('/api/reservations/new-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create reservation')
      }

      const result = await response.json()
      console.log('✅ ユーザー・予約作成完了:', result);

      // NewUserReservationFormに返すためのユーザー情報
      const userInfo = {
        userId: result.user.id,
        customerName: result.user.name,
        customerEmail: result.user.email
      };

      console.log('🔄 ユーザー情報をNewUserReservationFormに返します:', userInfo);

      // 成功ページへのリダイレクトは同意書保存完了後に行う
      setTimeout(() => {
        router.push(`/reserve/complete?reservationId=${result.reservation.id}&newUser=true`)
      }, 2000); // 同意書保存の時間を考慮

      return userInfo;

    } catch (error) {
      console.error('Error creating reservation:', error)
      alert(error instanceof Error ? error.message : '予約の作成に失敗しました')
      throw error
    } finally {
      setSubmitting(false)
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

  if (!lesson) {
    return null
  }

  const availableSpots = lesson.maxCapacity - lesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED').length
  const lessonStartTime = new Date(lesson.startTime)
  const currentTime = new Date()
  const thirtyMinutesBeforeStart = new Date(lessonStartTime.getTime() - 30 * 60 * 1000)
  const isPast = currentTime > thirtyMinutesBeforeStart
  const isFull = availableSpots <= 0

  if (isPast || isFull) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <Link href="/reserve" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">予約不可</h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isPast ? 'このレッスンは終了しています' : 'このレッスンは満席です'}
            </h2>
            
            <p className="text-gray-600 mb-8">
              他のレッスンをご検討ください
            </p>
            
            <Link href="/reserve" className="btn-primary">
              レッスン一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/reserve" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">新規会員登録・レッスン予約</h1>
              <p className="text-sm text-gray-600">会員登録とレッスン予約を同時に行います</p>
            </div>
          </div>
        </div>
      </header>

      <NewUserReservationForm
        lesson={lesson}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  )
} 