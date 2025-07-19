'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar, Clock, Users, FileText, UserCheck } from 'lucide-react'
import { Lesson } from '@/lib/types'

const lessonSchema = z.object({
  title: z.string().min(1, 'レッスン名を入力してください'),
  description: z.string().optional(),
  date: z.string().min(1, '開催日を選択してください'),
  startTime: z.string().min(1, '開始時間を選択してください'),
  endTime: z.string().min(1, '終了時間を選択してください'),
  maxCapacity: z.number().min(1, '最大人数を入力してください').max(10, '最大人数は10人以下にしてください'),
  instructorName: z.string().min(1, 'インストラクター名を入力してください'),
  location: z.string().optional(),
  price: z.number().min(0, '料金を入力してください')
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
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema)
  })

  useEffect(() => {
    fetchLesson()
  }, [params.id])

  const fetchLesson = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/lessons/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch lesson')
      const data = await response.json()
      setLesson(data)
      // フォームの初期値を設定
      reset({
        ...data,
        date: new Date(data.startTime).toISOString().split('T')[0],
        startTime: new Date(data.startTime).toTimeString().substring(0, 5),
        endTime: new Date(data.endTime).toTimeString().substring(0, 5),
      })
    } catch (error) {
      console.error('Error fetching lesson:', error)
      alert('レッスンの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: LessonForm) => {
    setSubmitting(true)
    try {
      const startDateTime = new Date(`${data.date}T${data.startTime}`)
      const endDateTime = new Date(`${data.date}T${data.endTime}`)

      const response = await fetch(`/api/lessons/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to update lesson')
      
      alert('レッスンが更新されました')
      router.push('/admin/dashboard')
      router.refresh() // サーバーコンポーネントを再フェッチ
    } catch (error) {
      console.error('Error updating lesson:', error)
      alert('レッスンの更新に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!lesson) return
    if (confirm(`「${lesson.title}」を削除しますか？この操作は元に戻せません。`)) {
      try {
        const response = await fetch(`/api/lessons/${params.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error('Failed to delete lesson')

        alert('レッスンを削除しました')
        router.push('/admin/dashboard')
        router.refresh()
      } catch (error) {
        console.error('Error deleting lesson:', error)
        alert('レッスンの削除に失敗しました')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!lesson) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p>レッスンが見つかりません。</p>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {...register('title')}
              />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="form-label">レッスン説明</label>
              <textarea
                className="form-input"
                rows={3}
                {...register('description')}
              />
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
              />
              {errors.date && <p className="form-error">{errors.date.message}</p>}
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  開始時間 *
                </label>
                <input type="time" className="form-input" {...register('startTime')} />
                {errors.startTime && <p className="form-error">{errors.startTime.message}</p>}
              </div>
              <div>
                <label className="form-label flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  終了時間 *
                </label>
                <input type="time" className="form-input" {...register('endTime')} />
                {errors.endTime && <p className="form-error">{errors.endTime.message}</p>}
              </div>
            </div>

            {/* Max Capacity */}
            <div>
              <label className="form-label flex items-center">
                <Users className="h-4 w-4 mr-2" />
                最大人数 *
              </label>
              <input
                type="number"
                className="form-input"
                min={1}
                max={10}
                {...register('maxCapacity', { valueAsNumber: true })}
              />
              {errors.maxCapacity && <p className="form-error">{errors.maxCapacity.message}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="form-label flex items-center">
                <span className="mr-2">💴</span>
                料金（円）*
              </label>
              <input
                type="number"
                className="form-input"
                min={0}
                step={100}
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && <p className="form-error">{errors.price.message}</p>}
            </div>

            {/* Instructor Name */}
            <div>
              <label className="form-label flex items-center">
                <UserCheck className="h-4 w-4 mr-2" />
                インストラクター名 *
              </label>
              <input
                type="text"
                className="form-input"
                {...register('instructorName')}
              />
              {errors.instructorName && <p className="form-error">{errors.instructorName.message}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="form-label flex items-center">
                <span className="mr-2">📍</span>
                開催場所
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="例: スタジオA、オンライン"
                {...register('location')}
              />
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              このレッスンを削除する
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? '更新中...' : 'レッスンを更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}