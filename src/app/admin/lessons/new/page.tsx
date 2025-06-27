'use client'

import { useState, useEffect } from 'react'
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

export default function NewLessonPage() {
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
          instructorName: lessonData.instructorName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      alert('テンプレートを保存しました')
      setShowTemplateModal(false)
      resetTemplate()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('テンプレートの保存に失敗しました')
    } finally {
      setSavingTemplate(false)
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
              <h1 className="text-xl font-bold text-gray-900">
                {isFromTemplate ? 'テンプレートからレッスン作成' : '新規レッスン作成'}
              </h1>
              <p className="text-sm text-gray-600">
                {isFromTemplate ? 'テンプレートの内容を編集してレッスンを作成' : 'レッスン情報を入力してください'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isFromTemplate && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">テンプレートから作成中</h3>
            <p className="text-sm text-blue-700">
              テンプレートの内容が初期値として設定されています。必要に応じて編集してください。
            </p>
          </div>
        )}

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
                最大人数 *
              </label>
              <input
                type="number"
                className="form-input"
                min={1}
                max={10}
                {...register('maxCapacity', { valueAsNumber: true })}
              />
              {errors.maxCapacity && (
                <p className="form-error">{errors.maxCapacity.message}</p>
              )}
            </div>

            {/* Ticket Group */}
            <div>
              <label className="form-label flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                チケットカテゴリ（任意）
              </label>
              <Controller
                name="ticketGroupId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="このレッスンで使えるチケットを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">カテゴリなし（チケット利用不可）</SelectItem>
                      {ticketGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                ここで選択したカテゴリのチケットのみ、このレッスンの予約に利用できます。
              </p>
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
                placeholder="例: 3000"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="form-error">{errors.price.message}</p>
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
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
            <div className="flex space-x-4">
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
            {!isFromTemplate && (
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="w-full btn-outline py-3 flex items-center justify-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>テンプレートとして保存</span>
              </button>
            )}
          </div>
        </form>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">テンプレートとして保存</h3>
              <form onSubmit={handleSubmitTemplate(onSaveTemplate)} className="space-y-4">
                <div>
                  <label className="form-label">テンプレート名 *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="例: 初心者向けピラティス"
                    {...registerTemplate('name')}
                  />
                  {templateErrors.name && (
                    <p className="form-error">{templateErrors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">テンプレートの説明</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="このテンプレートの用途や特徴（任意）"
                    {...registerTemplate('templateDescription')}
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="btn-outline flex-1 py-2"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={savingTemplate}
                    className="btn-primary flex-1 py-2 disabled:opacity-50"
                  >
                    {savingTemplate ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Help */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">レッスン作成のヒント</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• レッスン名は分かりやすく、レベルを含めると良いでしょう</li>
            <li>• 説明欄では対象者や持ち物について記載してください</li>
            <li>• 定員は通常3〜5人程度が適切です</li>
            <li>• レッスン時間は準備・片付けの時間も含めて設定してください</li>
            <li>• よく使うレッスン設定は「テンプレートとして保存」で再利用できます</li>
          </ul>
        </div>
      </div>
    </div>
  )
}