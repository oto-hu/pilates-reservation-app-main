'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ProfileData {
  id: string
  name: string
  email: string
  pilatesExperience: string | null
  motivation: string | null
  medicalHistory: string | null
  goals: string | null
  profileCompleted: boolean
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    pilatesExperience: '',
    motivation: '',
    medicalHistory: '',
    goals: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'member') {
      router.push('/auth/login')
      return
    }

    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile/update')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        setFormData({
          pilatesExperience: data.pilatesExperience || '',
          motivation: data.motivation || '',
          medicalHistory: data.medicalHistory || '',
          goals: data.goals || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData(data.user)
        alert('プロフィールが更新されました')
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert('プロフィールの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
              <User className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">プロフィール設定</h1>
                <p className="text-sm text-gray-500">追加情報を入力してプロフィールを完成させましょう</p>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/member/dashboard">
                <Button variant="outline" size="sm" className="sm:size-default">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">ダッシュボードに戻る</span>
                  <span className="sm:hidden">戻る</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>プロフィール追加情報</CardTitle>
            <CardDescription>
              より良いレッスン体験を提供するため、以下の情報をご入力ください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* ピラティス経験 */}
                <div className="space-y-2">
                  <Label htmlFor="pilatesExperience">ピラティス経験</Label>
                  <Select 
                    value={formData.pilatesExperience} 
                    onValueChange={(value) => handleInputChange('pilatesExperience', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="経験レベルを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="初心者">初心者（未経験）</SelectItem>
                      <SelectItem value="初級者">初級者（数回経験あり）</SelectItem>
                      <SelectItem value="中級者">中級者（定期的に通っている）</SelectItem>
                      <SelectItem value="上級者">上級者（長期間継続）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 来店きっかけ */}
                <div className="space-y-2">
                  <Label htmlFor="motivation">来店きっかけ</Label>
                  <Select 
                    value={formData.motivation} 
                    onValueChange={(value) => handleInputChange('motivation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="きっかけを選択してください" />
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

              {/* 疾患履歴・健康状態 */}
              <div className="space-y-2">
                <Label htmlFor="medicalHistory">疾患履歴・健康状態</Label>
                <Textarea
                  id="medicalHistory"
                  placeholder="現在治療中の疾患、過去の大きな病気やけが、アレルギー、服用中の薬など、レッスンに影響する可能性のある健康状態をご記入ください。特にない場合は「特になし」とご記入ください。"
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* 目標 */}
              <div className="space-y-2">
                <Label htmlFor="goals">ピラティスで達成したい目標</Label>
                <Textarea
                  id="goals"
                  placeholder="体力向上、柔軟性向上、姿勢改善、ダイエット、リラックスなど、ピラティスを通して達成したい目標をご記入ください。"
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* 保存ボタン */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                <Link href="/member/dashboard">
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : 'プロフィールを保存'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}