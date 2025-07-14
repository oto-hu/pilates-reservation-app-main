'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, FileText } from 'lucide-react'

interface LessonTemplate {
  id: string
  name: string
  templateDescription?: string
  title: string
  lessonDescription?: string
  startTime: string
  endTime: string
  maxCapacity: number
  lessonType: 'SMALL_GROUP' | 'LARGE_GROUP'
  price: number
  instructorName?: string
  createdAt: string
}

export default function LessonTemplatesPage() {
  const [templates, setTemplates] = useState<LessonTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/lesson-templates')
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
      setError('テンプレートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('このテンプレートを削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/lesson-templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      setTemplates(templates.filter(template => template.id !== templateId))
      alert('テンプレートを削除しました')
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('テンプレートの削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
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
              <Link href="/admin/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">レッスンテンプレート</h1>
                <p className="text-sm text-gray-600">保存されたテンプレートの管理</p>
              </div>
            </div>
            <Link
              href="/admin/lessons/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              新規レッスン作成
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">テンプレートがありません</h3>
            <p className="text-gray-600 mb-6">
              レッスン作成時にテンプレートとして保存すると、ここに表示されます。
            </p>
            <Link
              href="/admin/lessons/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              最初のレッスンを作成
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    {template.templateDescription && (
                      <p className="text-sm text-gray-600 mt-1">{template.templateDescription}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/lessons/new?template=${template.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="このテンプレートでレッスン作成"
                    >
                      <Plus className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{template.title}</p>
                    {template.lessonDescription && (
                      <p className="text-sm text-gray-600">{template.lessonDescription}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">時間</p>
                      <p className="font-medium">{template.startTime} - {template.endTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">定員</p>
                      <p className="font-medium">{template.maxCapacity}名</p>
                    </div>
                    <div>
                      <p className="text-gray-600">料金</p>
                      <p className="font-medium">¥{template.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">タイプ</p>
                      <p className="font-medium">
                        {template.lessonType === 'SMALL_GROUP' ? '少人数' : '大人数'}
                      </p>
                    </div>
                  </div>

                  {template.instructorName && (
                    <div>
                      <p className="text-sm text-gray-600">インストラクター</p>
                      <p className="text-sm font-medium">{template.instructorName}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  作成日: {new Date(template.createdAt).toLocaleDateString('ja-JP')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 