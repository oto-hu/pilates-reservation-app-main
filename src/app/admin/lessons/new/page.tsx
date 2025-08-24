'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar, Clock, Users, FileText, Save, Tag } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const lessonSchema = z.object({
  title: z.string().min(1, 'レッスン名を入力してください'),
  description: z.string().optional(),
  date: z.string().min(1, '開催日を選択してください'),
  startTime: z.string().min(1, '開始時間を選択してください'),
  endTime: z.string().min(1, '終了時間を選択してください'),
  maxCapacity: z.number().min(1, '最大人数を入力してください').max(10, '最大人数は10人以下にしてください'),
  instructorName: z.string().min(1, 'インストラクター名を入力してください'),
  location: z.string().optional(),
  price: z.number().min(0, '料金を入力してください'),
  ticketGroupId: z.string().optional()
}).refine((data) => {
  const start = new Date(`${data.date}T${data.startTime}`)
  const end = new Date(`${data.date}T${data.endTime}`)
  return end > start
}, {
  message: '終了時間は開始時間より後に設定してください',
  path: ['endTime']
})

const templateSchema = z.object({
  name: z.string().min(1, 'テンプレート名を入力してください'),
  templateDescription: z.string().optional()
})

type LessonForm = z.infer<typeof lessonSchema>
type TemplateForm = z.infer<typeof templateSchema>

interface TicketGroup {
  id: string;
  name: string;
}

function NewLessonForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isFromTemplate, setIsFromTemplate] = useState(false)
  const [ticketGroups, setTicketGroups] = useState<TicketGroup[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control
  } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      maxCapacity: 5,
      price: 0
    }
  })

  const {
    register: registerTemplate,
    handleSubmit: handleSubmitTemplate,
    formState: { errors: templateErrors },
    reset: resetTemplate
  } = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema)
  })

  // URLパラメータからテンプレートデータを取得して初期値に設定
  useEffect(() => {
    const templateId = searchParams.get('template')
    if (templateId) {
      setIsFromTemplate(true)
      
      // テンプレートデータをAPIから取得
      const fetchTemplate = async () => {
        try {
          const response = await fetch(`/api/lesson-templates/${templateId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch template')
          }
          
          const template = await response.json()
          
          // テンプレートデータをフォームに設定
          setValue('title', template.title)
          setValue('description', template.lessonDescription || '')
          setValue('startTime', template.startTime)
          setValue('endTime', template.endTime)
          setValue('maxCapacity', template.maxCapacity)
          setValue('price', template.price)
          setValue('location', template.location || '')
          setValue('instructorName', template.instructorName || '')
        } catch (error) {
          console.error('Error fetching template:', error)
          alert('テンプレートの取得に失敗しました')
        }
      }
      
      fetchTemplate()
    }
    fetchTicketGroups()
  }, [searchParams, setValue])

  const fetchTicketGroups = async () => {
    try {
      const response = await fetch('/api/admin/ticket-groups')
      if (response.ok) {
        const data = await response.json()
        setTicketGroups(data)
      }
    } catch (error) {
      console.error('Failed to fetch ticket groups:', error)
    }
  }

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
          instructorName: data.instructorName,
          location: data.location,
          price: data.price,
          ticketGroupId: data.ticketGroupId || null
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

  const onSaveTemplate = async (templateData: TemplateForm) => {
    const lessonData = watch()
    setSavingTemplate(true)

    try {
      const response = await fetch('/api/lesson-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: templateData.name,
          templateDescription: templateData.templateDescription,
          title: lessonData.title,
          lessonDescription: lessonData.description,
          startTime: lessonData.startTime,
          endTime: lessonData.endTime,
          maxCapacity: lessonData.maxCapacity,
          lessonType: 'SMALL_GROUP', // デフォルト値
          price: lessonData.price,
          location: lessonData.location,
          instructorName: lessonData.instructorName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      setShowTemplateModal(false)
      resetTemplate()
      alert('テンプレートを保存しました')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('テンプレートの保存に失敗しました')
    } finally {
      setSavingTemplate(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  <span className="sm:hidden">
                    {isFromTemplate ? 'テンプレート作成' : 'レッスン作成'}
                  </span>
                  <span className="hidden sm:inline">
                    {isFromTemplate ? 'テンプレートからレッスン作成' : '新規レッスン作成'}
                  </span>
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={() => router.back()}
                className="btn-outline flex items-center px-3 sm:px-4 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">戻る</span>
              </button>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="btn-outline flex items-center px-3 sm:px-4 py-2"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">テンプレート保存</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  レッスン名 *
                </label>
                <input
                  {...register('title')}
                  className="input"
                  placeholder="例: 初級ピラティス"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input"
                  placeholder="レッスンの詳細説明"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  インストラクター名 *
                </label>
                <input
                  {...register('instructorName')}
                  className="input"
                  placeholder="例: 田中 花子"
                />
                {errors.instructorName && (
                  <p className="text-red-600 text-sm mt-1">{errors.instructorName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開催場所
                </label>
                <input
                  {...register('location')}
                  className="input"
                  placeholder="例: スタジオA、オンライン"
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">スケジュール</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開催日 *
                </label>
                <input
                  {...register('date')}
                  type="date"
                  className="input"
                />
                {errors.date && (
                  <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始時間 *
                </label>
                <input
                  {...register('startTime')}
                  type="time"
                  className="input"
                />
                {errors.startTime && (
                  <p className="text-red-600 text-sm mt-1">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了時間 *
                </label>
                <input
                  {...register('endTime')}
                  type="time"
                  className="input"
                />
                {errors.endTime && (
                  <p className="text-red-600 text-sm mt-1">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Capacity & Price */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">定員・料金</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大定員 *
                </label>
                <input
                  {...register('maxCapacity', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="10"
                  className="input"
                />
                {errors.maxCapacity && (
                  <p className="text-red-600 text-sm mt-1">{errors.maxCapacity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  料金（円） *
                </label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="input"
                  placeholder="例: 3000"
                />
                {errors.price && (
                  <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>
            </div>

            {/* Ticket Group */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チケットグループ
              </label>
              <Controller
                name="ticketGroupId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="チケットグループを選択（オプション）" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/admin/dashboard" className="btn-outline">
              キャンセル
            </Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '作成中...' : 'レッスンを作成'}
            </button>
          </div>
        </form>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">テンプレートを保存</h3>
            <form onSubmit={handleSubmitTemplate(onSaveTemplate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  テンプレート名 *
                </label>
                <input
                  {...registerTemplate('name')}
                  className="input"
                  placeholder="例: 初級ピラティス"
                />
                {templateErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{templateErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  {...registerTemplate('templateDescription')}
                  rows={3}
                  className="input"
                  placeholder="テンプレートの説明"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="btn-outline"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn-primary" disabled={savingTemplate}>
                  {savingTemplate ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewLessonPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <NewLessonForm />
    </Suspense>
  )
}