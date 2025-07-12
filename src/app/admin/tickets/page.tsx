'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Ticket, User, Calendar, ArrowLeft } from 'lucide-react'
import { LessonType, User as UserType, Ticket as TicketType } from '@/lib/types'
import Link from 'next/link'

interface MemberWithTickets extends UserType {
  tickets: (TicketType & { lessonTypeName: string })[]
}

interface TicketGroup {
  id: string;
  name: string;
}

export default function TicketManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [members, setMembers] = useState<MemberWithTickets[]>([])
  const [filteredMembers, setFilteredMembers] = useState<MemberWithTickets[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<MemberWithTickets | null>(null)
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [ticketGroups, setTicketGroups] = useState<TicketGroup[]>([])
  const [grantForm, setGrantForm] = useState({
    ticketGroupId: '',
    count: 1
  })
  const [loading, setLoading] = useState(true)
  const [granting, setGranting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
      return
    }

    fetchMembers()
    fetchTicketGroups()
  }, [session, status, router])

  useEffect(() => {
    const filtered = members.filter(member => 
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.furigana?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredMembers(filtered)
  }, [members, searchTerm])

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

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/admin/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGrantTickets = async () => {
    if (!selectedMember || !grantForm.ticketGroupId || grantForm.count <= 0) return

    setGranting(true)
    try {
      const response = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedMember.id,
          ticketGroupId: grantForm.ticketGroupId,
          count: grantForm.count
        }),
      })

      if (response.ok) {
        setShowGrantForm(false)
        setSelectedMember(null)
        setGrantForm({ ticketGroupId: '', count: 1 })
        fetchMembers()
        alert('チケットを付与しました')
      } else {
        const data = await response.json()
        alert(data.error || 'チケットの付与に失敗しました')
      }
    } catch (error) {
      console.error('Failed to grant tickets:', error)
      alert('チケットの付与に失敗しました')
    } finally {
      setGranting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiryTime = new Date(expiryDate).getTime()
    const now = new Date().getTime()
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000)
    return expiryTime <= thirtyDaysFromNow && expiryTime > now
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0 flex items-center">
            <Link href="/admin/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                チケット管理
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                会員のチケット残数を確認し、新しいチケットを付与できます
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">会員検索</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="名前、フリガナ、メールアドレスで検索"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {member.furigana} • {member.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedMember(member)
                      setShowGrantForm(true)
                    }}
                    className="ml-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    チケット付与
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {member.tickets && member.tickets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {member.tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Ticket className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="font-medium">{ticket.lessonTypeName}</span>
                          </div>
                          <div className="text-xl font-bold text-blue-600">
                            {ticket.remainingCount}枚
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">有効期限</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-700">
                              {formatDate(ticket.expiresAt.toString())}
                            </span>
                            {isExpired(ticket.expiresAt.toString()) && (
                              <Badge variant="destructive">期限切れ</Badge>
                            )}
                            {isExpiringSoon(ticket.expiresAt.toString()) && !isExpired(ticket.expiresAt.toString()) && (
                              <Badge variant="outline" className="border-orange-500 text-orange-600">
                                期限間近
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>チケットがありません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">該当する会員が見つかりません</p>
            </CardContent>
          </Card>
        )}

        {showGrantForm && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>チケット付与</CardTitle>
                <p className="text-sm text-gray-600">
                  {selectedMember.name}さんにチケットを付与します
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-group">チケットカテゴリ</Label>
                  <Select
                    value={grantForm.ticketGroupId}
                    onValueChange={(value) => setGrantForm({ ...grantForm, ticketGroupId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="チケットカテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket-count">付与枚数</Label>
                  <Input
                    id="ticket-count"
                    type="number"
                    min="1"
                    max="50"
                    value={grantForm.count}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">有効期限について</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    有効期限は付与日から5ヶ月後に自動設定されます
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowGrantForm(false)
                      setSelectedMember(null)
                      setGrantForm({ ticketGroupId: '', count: 1 })
                    }}
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleGrantTickets}
                    disabled={granting || !grantForm.ticketGroupId || grantForm.count <= 0}
                    className="flex-1"
                  >
                    {granting ? '付与中...' : 'チケット付与'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}