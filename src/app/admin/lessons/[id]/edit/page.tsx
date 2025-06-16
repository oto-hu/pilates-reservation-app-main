'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar, Clock, Users, FileText, Trash2, Save } from 'lucide-react'
import { Lesson, Reservation } from '@/lib/types'
import { formatDate, formatTime } from '@/lib/utils'

const lessonSchema = z.object({
  title: z.string().min(1, 'レッスン名を入力してください'),
  description: z.string().optional(),
  date: z.string().min(1, '開催日を選択してください'),
  startTime: z.string().min(1, '開始時間を選択してください'),
  endTime: z.string().min(1, '終了時間を選択してください'),
  maxCapacity: z.number().min(1, '最大人数を入力してください').max(10, '最大人数は10人以下にしてください'),
  instructorName: z.string().min(1, 'インストラクター名を入力してください')
}).refine((data) => {
  const start = new Date(`${data.date}T${data.startTime}`)
  const end = new Date(`${data.date}T${data.endTime}`)
  return end > start
}, {
  message: '終了時間は開始時間より後に設定してください',
  path: ['endTime']
})

type LessonForm = z.infer<typeof lessonSchema>

interface EditLessonPageProps {
  params: {
    id: string
  }
}

export default function EditLessonPage({ params }: EditLessonPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson?.title || '',
      description: lesson?.description || '',
      date: lesson?.startTime ? lesson.startTime.split('T')[0] : '',
      startTime: lesson?.startTime ? lesson.startTime.split('T')[1].slice(0, 5) : '',
      endTime: lesson?.endTime ? lesson.endTime.split('T')[1].slice(0, 5) : '',
      maxCapacity: lesson?.maxCapacity || 1,
      instructorName: lesson?.instructorName || ''
    }
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return
    }

    if (status === 'authenticated') {
      fetchLesson()
    }
  }, [status, params.id])

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch lesson')
      }

      const lessonData = await response.json()
      setLesson(lessonData)

      // Reset form with lesson data
      const startTime = new Date(lessonData.startTime)
      const endTime = new Date(lessonData.endTime)
      
      reset({
        title: lessonData.title,
        description: lessonData.description || '',
        date: startTime.toISOString().split('T')[0],
        startTime: startTime.toTimeString().slice(0, 5),
        endTime: endTime.toTimeString().slice(0, 5),
        maxCapacity: lessonData.maxCapacity,
        instructorName: lessonData.instructorName || ''
      })
    } catch (error) {
      console.error('Error fetching lesson:', error)
      router.push('/admin/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: LessonForm) => {
    if (!lesson) return

    setSubmitting(true)

    try {
      const startDateTime = new Date(`${data.date}T${data.startTime}`)
      const endDateTime = new Date(`${data.date}T${data.endTime}`)

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          maxCapacity: data.maxCapacity,
          instructorName: data.instructorName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update lesson')
      }

      router.push('/admin/dashboard')
    } catch (error) {
      console.error('Error updating lesson:', error)
      alert('レッスンの更新に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!lesson) return

    if (!confirm('このレッスンを削除しますか？この操作は取り消せません。')) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete lesson')
      }

      router.push('/admin/dashboard')
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('レッスンの削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!lesson) {
    return null
  }

  const isPastLesson = new Date(lesson.startTime) < new Date()
  const hasReservations = lesson.reservations.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/admin/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">レッスン編集</h1>
              <p className="text-sm text-gray-600">{lesson.title}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="card">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="form-label flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    レッスン名 *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例: 初心者向けピラティス"
                    {...register('title')}
                    disabled={isPastLesson}
                  />
                  {errors.title && (
                    <p className="form-error">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="form-label">レッスン説明</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="レッスンの内容や対象者について（任意）"
                    {...register('description')}
                    disabled={isPastLesson}
                  />
                  {errors.description && (
                    <p className="form-error">{errors.description.message}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="form-label flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    開催日 *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    {...register('date')}
                    disabled={isPastLesson}
                  />
                  {errors.date && (
                    <p className="form-error">{errors.date.message}</p>
                  )}
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      開始時間 *
                    </label>
                    <input
                      type="time"
                      className="form-input"
                      {...register('startTime')}
                      disabled={isPastLesson}
                    />
                    {errors.startTime && (
                      <p className="form-error">{errors.startTime.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="form-label flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      終了時間 *
                    </label>
                    <input
                      type="time"
                      className="form-input"
                      {...register('endTime')}
                      disabled={isPastLesson}
                    />
                    {errors.endTime && (
                      <p className="form-error">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>

                {/* Max Capacity */}
                <div>
                  <label className="form-label flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    最大定員 *
                  </label>
                  <select
                    className="form-input"
                    {...register('maxCapacity', { valueAsNumber: true })}
                    disabled={isPastLesson}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>
                        {num}人
                      </option>
                    ))}
                  </select>
                  {errors.maxCapacity && (
                    <p className="form-error">{errors.maxCapacity.message}</p>
                  )}
                  {lesson.reservations.length > 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      注意: 現在{lesson.reservations.length}人の予約があります
                    </p>
                  )}
                </div>

                {/* Instructor Name */}
                <div>
                  <label className="form-label">インストラクター名 *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例: 山田太郎"
                    {...register('instructorName')}
                  />
                  {errors.instructorName && (
                    <p className="form-error">{errors.instructorName.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="btn-outline flex-1 text-center py-3"
                >
                  キャンセル
                </Link>
                
                {!isPastLesson && (
                  <>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? '削除中...' : '削除'}
                    </button>
                    
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary flex-1 py-3 disabled:opacity-50 flex items-center justify-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {submitting ? '更新中...' : '更新'}
                    </button>
                  </>
                )}
              </div>

              {isPastLesson && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    このレッスンは終了しているため編集できません
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Reservations */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                予約一覧 ({lesson.reservations.length}/{lesson.maxCapacity})
              </h3>
              
              {lesson.reservations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  まだ予約がありません
                </p>
              ) : (
                <div className="space-y-3">
                  {lesson.reservations.map((reservation: Reservation) => (
                    <div key={reservation.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {reservation.customerName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {reservation.customerEmail}
                      </div>
                      <div className="text-sm text-gray-600">
                        {reservation.customerPhone}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reservation.paymentMethod === 'PAY_NOW' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reservation.paymentMethod === 'PAY_NOW' ? 'オンライン決済' : '当日支払い'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reservation.paymentStatus === 'PAID' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reservation.paymentStatus === 'PAID' ? '支払済' : '未払い'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}