'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar, Clock, Users, FileText } from 'lucide-react'

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

export default function NewLessonPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      maxCapacity: 5
    }
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/admin/login')
    return null
  }

  const onSubmit = async (data: LessonForm) => {
    setSubmitting(true)

    try {
      const startDateTime = new Date(`${data.date}T${data.startTime}`)
      const endDateTime = new Date(`${data.date}T${data.endTime}`)

      const response = await fetch('/api/lessons', {
        method: 'POST',
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
        throw new Error('Failed to create lesson')
      }

      router.push('/admin/dashboard')
    } catch (error) {
      console.error('Error creating lesson:', error)
      alert('レッスンの作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

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
              <h1 className="text-xl font-bold text-gray-900">新規レッスン作成</h1>
              <p className="text-sm text-gray-600">レッスン情報を入力してください</p>
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
                placeholder="例: 初心者向けピラティス"
                {...register('title')}
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
                min={today}
                {...register('date')}
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

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex space-x-4">
            <Link
              href="/admin/dashboard"
              className="btn-outline flex-1 text-center py-3"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 py-3 disabled:opacity-50"
            >
              {submitting ? '作成中...' : 'レッスンを作成'}
            </button>
          </div>
        </form>

        {/* Help */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">レッスン作成のヒント</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• レッスン名は分かりやすく、レベルを含めると良いでしょう</li>
            <li>• 説明欄では対象者や持ち物について記載してください</li>
            <li>• 定員は通常3〜5人程度が適切です</li>
            <li>• レッスン時間は準備・片付けの時間も含めて設定してください</li>
          </ul>
        </div>
      </div>
    </div>
  )
}