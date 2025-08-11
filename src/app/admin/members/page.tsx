'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Search, Download, FileText, User, Calendar, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
  trialDate: string | null
  // 追加項目
  howDidYouKnowUs: string | null
  referrerName: string | null
  otherSource: string | null
  transportation: string | null
  hasPilatesExperience: boolean | null
  hasExerciseHabit: boolean | null
  hasInjuryHistory: boolean | null
  injuryDetails: string | null
  injuryTiming: string | null
  trialMotivations: string | null
  membershipStatus: string | null
  assignedStaff: string | null
  createdAt: string
  updatedAt: string
}

export default function MembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCompleted, setFilterCompleted] = useState<string>('all')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
      return
    }

    fetchMembers()
  }, [session, status, router])

  useEffect(() => {
    filterMembers()
  }, [members, searchTerm, filterCompleted])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/admin/users')
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

  const filterMembers = () => {
    let filtered = members

    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.furigana?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.includes(searchTerm)
      )
    }

    if (filterCompleted !== 'all') {
      const isCompleted = filterCompleted === 'completed'
      filtered = filtered.filter(member => member.profileCompleted === isCompleted)
    }

    setFilteredMembers(filtered)
  }

  const exportToCSV = () => {
    const csvHeaders = [
      '会員No', '氏名', '性別', '生年月日', '年齢', '郵便番号', '住所', '体験日', 
      'ピラティス経験', '疾患', '疾患詳細', 'きっかけ', '担当者', '退会/休会', '紹介者数'
    ]
    
    const csvData = filteredMembers.map((member, index) => [
      index + 1, // 会員No（上から順に番号）
      member.name || '',
      member.gender || '',
      member.birthDate ? new Date(member.birthDate).toLocaleDateString('ja-JP') : '',
      member.age || '',
      member.postalCode || '',
      member.address || '',
      member.trialDate ? new Date(member.trialDate).toLocaleDateString('ja-JP') : '',
      member.hasPilatesExperience !== null ? (member.hasPilatesExperience ? 'あり' : 'なし') : '',
      member.hasInjuryHistory !== null ? (member.hasInjuryHistory ? 'あり' : 'なし') : '',
      member.hasInjuryHistory ? `${member.injuryDetails || ''}${member.injuryDetails && member.injuryTiming ? ' - ' : ''}${member.injuryTiming || ''}` : '',
      member.trialMotivations || '',
      member.assignedStaff || '', // 担当者（データベースから取得）
      member.membershipStatus === 'withdrawn' ? '退会' : member.membershipStatus === 'suspended' ? '休会' : '有効', // 退会/休会
      ''  // 紹介者数（管理者手入力）
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `members_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">会員管理</h1>
                <p className="text-sm text-gray-500">会員情報の閲覧・編集</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ダッシュボードに戻る
                </Button>
              </Link>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                CSV エクスポート
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* フィルター */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="氏名、フリガナ、メールアドレス、電話番号で検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={filterCompleted} onValueChange={setFilterCompleted}>
                  <SelectTrigger>
                    <SelectValue placeholder="プロフィール完了状態" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="completed">完了済み</SelectItem>
                    <SelectItem value="incomplete">未完了</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">総会員数</p>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">プロフィール完了</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.profileCompleted).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">プロフィール未完了</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => !m.profileCompleted).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 会員一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>会員一覧</CardTitle>
            <CardDescription>
              {filteredMembers.length}件の会員が見つかりました
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{member.name}</h3>
                        <span className="text-sm text-gray-500">({member.furigana})</span>
                        <Badge variant={member.profileCompleted ? 'default' : 'outline'}>
                          {member.profileCompleted ? '完了' : '未完了'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {member.phone}
                          </div>
                        )}
                        {member.address && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {member.address}
                          </div>
                        )}
                        {member.pilatesExperience && (
                          <div>
                            <span className="font-medium">経験:</span> {member.pilatesExperience}
                          </div>
                        )}
                        {member.motivation && (
                          <div>
                            <span className="font-medium">きっかけ:</span> {member.motivation}
                          </div>
                        )}
                        {member.trialDate && (
                          <div>
                            <span className="font-medium">体験日:</span> {formatDate(member.trialDate)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">登録日:</span> {formatDate(member.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/members/${member.id}`)}
                      >
                        詳細
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}