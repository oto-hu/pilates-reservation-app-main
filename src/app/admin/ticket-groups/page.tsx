'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'

interface TicketGroup {
  id: string
  name: string
}

const ticketGroupSchema = z.object({
  name: z.string().min(1, 'カテゴリ名を入力してください'),
})

type TicketGroupForm = z.infer<typeof ticketGroupSchema>

export default function TicketGroupsPage() {
  const [ticketGroups, setTicketGroups] = useState<TicketGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGroup, setEditingGroup] = useState<TicketGroup | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TicketGroupForm>({
    resolver: zodResolver(ticketGroupSchema),
  })

  useEffect(() => {
    fetchTicketGroups()
  }, [])

  const fetchTicketGroups = async () => {
    try {
      const response = await fetch('/api/admin/ticket-groups')
      if (response.ok) {
        const data = await response.json()
        setTicketGroups(data)
      }
    } catch (error) {
      console.error('Failed to fetch ticket groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: TicketGroupForm) => {
    const url = editingGroup ? `/api/admin/ticket-groups/${editingGroup.id}` : '/api/admin/ticket-groups'
    const method = editingGroup ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchTicketGroups()
        reset()
        setEditingGroup(null)
        alert(editingGroup ? 'カテゴリを更新しました' : 'カテゴリを作成しました')
      } else {
        alert('操作に失敗しました')
      }
    } catch (error) {
      console.error('Failed to save ticket group:', error)
      alert('操作に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('このカテゴリを削除しますか？関連するレッスンやチケットから紐付けが解除されます。')) {
      try {
        const response = await fetch(`/api/admin/ticket-groups/${id}`, { method: 'DELETE' })
        if (response.ok) {
          fetchTicketGroups()
          alert('カテゴリを削除しました')
        } else {
          alert('削除に失敗しました')
        }
      } catch (error) {
        console.error('Failed to delete ticket group:', error)
        alert('削除に失敗しました')
      }
    }
  }

  const handleEdit = (group: TicketGroup) => {
    setEditingGroup(group)
    setValue('name', group.name)
  }

  const cancelEdit = () => {
    setEditingGroup(null)
    reset()
  }

  if (loading) return <p>読み込み中...</p>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Link href="/admin/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold">チケットカテゴリ管理</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingGroup ? 'カテゴリ編集' : '新規カテゴリ作成'}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">カテゴリ名</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              {editingGroup && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  キャンセル
                </Button>
              )}
              <Button type="submit">
                {editingGroup ? '更新' : '作成'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>カテゴリ一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ticketGroups.map(group => (
                <div key={group.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <span className="font-medium">{group.name}</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(group)}>
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(group.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {ticketGroups.length === 0 && (
              <p className="text-center text-gray-500 py-8">チケットカテゴリがありません。</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 