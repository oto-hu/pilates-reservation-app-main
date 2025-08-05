'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { User, Save, ArrowLeft, Calendar, MapPin, Phone, Mail, AlertTriangle, Settings, CreditCard, Plus, Minus } from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: string
  name: string | null
  lessonType: string
  remainingCount: number
  expiresAt: string
  createdAt: string
  updatedAt: string
  lessonTypeName?: string
}

interface Member {
  id: string
  name: string
  furigana: string
  birthDate: string | null
  age: number | null
  gender: string | null
  postalCode: string | null
  address: string | null
  email: string
  phone: string | null
  emergencyContactName: string | null
  emergencyContactFurigana: string | null
  emergencyContactPhone: string | null
  emergencyContactRelation: string | null
  pilatesExperience: string | null
  motivation: string | null
  medicalHistory: string | null
  goals: string | null
  profileCompleted: boolean
  membershipStatus: string | null
  tickets?: Ticket[]
  createdAt: string
  updatedAt: string
}

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Member>>({})
  const [ticketAdjustments, setTicketAdjustments] = useState<{[key: string]: number}>({})

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
      return
    }

    fetchMember()
  }, [session, status, router, params.id])

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/admin/members/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMember(data)
        setFormData(data)
      }
    } catch (error) {
      console.error('Failed to fetch member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedMember = await response.json()
        setMember(updatedMember)
        setFormData(updatedMember)
        alert('会員情報が更新されました')
      } else {
        throw new Error('Failed to update member')
      }
    } catch (error) {
      console.error('Member update error:', error)
      alert('会員情報の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleTicketAdjustment = async (ticketId: string, adjustment: number) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adjustment }),
      })

      if (response.ok) {
        // 会員情報を再取得してチケット情報を更新
        await fetchMember()
        alert('チケット残数が調整されました')
      } else {
        throw new Error('Failed to adjust ticket')
      }
    } catch (error) {
      console.error('Ticket adjustment error:', error)
      alert('チケット残数の調整に失敗しました')
    }
  }

  const getMembershipStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">有効</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">休会</Badge>
      case 'withdrawn':
        return <Badge className="bg-red-100 text-red-800">退会</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800">有効</Badge>
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">会員が見つかりません</p>
          <Link href="/admin/members">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              会員一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">会員詳細</h1>
                <p className="text-sm text-gray-500">{member.name}さんの情報</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getMembershipStatusBadge(member.membershipStatus)}
              <Badge variant={member.profileCompleted ? 'default' : 'outline'}>
                {member.profileCompleted ? 'プロフィール完了' : 'プロフィール未完了'}
              </Badge>
              <Link href="/admin/members">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  会員一覧に戻る
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">氏名 *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="furigana">フリガナ</Label>
                  <Input
                    id="furigana"
                    value={formData.furigana || ''}
                    onChange={(e) => handleInputChange('furigana', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">生年月日</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="age">年齢</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">性別</Label>
                  <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="性別を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男性">男性</SelectItem>
                      <SelectItem value="女性">女性</SelectItem>
                      <SelectItem value="その他">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 住所情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                住所情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">郵便番号</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="address">住所</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 緊急連絡先 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                緊急連絡先
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContactName">氏名</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactFurigana">フリガナ</Label>
                  <Input
                    id="emergencyContactFurigana"
                    value={formData.emergencyContactFurigana || ''}
                    onChange={(e) => handleInputChange('emergencyContactFurigana', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone">電話番号</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone || ''}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactRelation">続柄</Label>
                  <Input
                    id="emergencyContactRelation"
                    value={formData.emergencyContactRelation || ''}
                    onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 追加情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                追加情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pilatesExperience">ピラティス経験</Label>
                  <Select 
                    value={formData.pilatesExperience || ''} 
                    onValueChange={(value) => handleInputChange('pilatesExperience', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="経験レベルを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="初心者">初心者（未経験）</SelectItem>
                      <SelectItem value="初級者">初級者（数回経験あり）</SelectItem>
                      <SelectItem value="中級者">中級者（定期的に通っている）</SelectItem>
                      <SelectItem value="上級者">上級者（長期間継続）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="motivation">来店きっかけ</Label>
                  <Select 
                    value={formData.motivation || ''} 
                    onValueChange={(value) => handleInputChange('motivation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="きっかけを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="友人・知人の紹介">友人・知人の紹介</SelectItem>
                      <SelectItem value="インターネット検索">インターネット検索</SelectItem>
                      <SelectItem value="SNS">SNS（Instagram、Facebook等）</SelectItem>
                      <SelectItem value="チラシ・広告">チラシ・広告</SelectItem>
                      <SelectItem value="通りがかり">通りがかり</SelectItem>
                      <SelectItem value="その他">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="medicalHistory">疾患履歴・健康状態</Label>
                <Textarea
                  id="medicalHistory"
                  value={formData.medicalHistory || ''}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="goals">目標</Label>
                <Textarea
                  id="goals"
                  value={formData.goals || ''}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* 会員ステータス管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                会員ステータス管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="membershipStatus">会員ステータス</Label>
                  <Select 
                    value={formData.membershipStatus || 'active'} 
                    onValueChange={(value) => handleInputChange('membershipStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ステータスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">有効</SelectItem>
                      <SelectItem value="suspended">休会</SelectItem>
                      <SelectItem value="withdrawn">退会</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* チケット管理 */}
          {member.tickets && member.tickets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  チケット管理
                </CardTitle>
                <CardDescription>
                  チケット残数の手動調整が可能です。適切に処理されなかった場合の修正にご利用ください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {member.tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{ticket.lessonTypeName || ticket.name}</h4>
                          <p className="text-sm text-gray-600">
                            残り{ticket.remainingCount}回 | 
                            有効期限: {new Date(ticket.expiresAt).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleTicketAdjustment(ticket.id, -1)}
                            disabled={ticket.remainingCount <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="mx-2 min-w-[2rem] text-center font-medium">
                            {ticket.remainingCount}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleTicketAdjustment(ticket.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* システム情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                システム情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>登録日:</strong> {formatDate(member.createdAt)}</p>
                </div>
                <div>
                  <p><strong>最終更新:</strong> {formatDate(member.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 保存ボタン */}
          <div className="flex justify-end space-x-4">
            <Link href="/admin/members">
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '会員情報を保存'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}