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
// import { Checkbox } from '@/components/ui/checkbox' // 存在しないためコメントアウト
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
    goals: '',
    // 追加項目
    howDidYouKnowUs: '',
    referrerName: '',
    otherSource: '',
    transportation: '',
    hasPilatesExperience: null as boolean | null,
    hasExerciseHabit: null as boolean | null,
    hasInjuryHistory: null as boolean | null,
    injuryDetails: '',
    injuryTiming: '',
    trialMotivations: [] as string[]
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
          goals: data.goals || '',
          // 追加項目
          howDidYouKnowUs: data.howDidYouKnowUs || '',
          referrerName: data.referrerName || '',
          otherSource: data.otherSource || '',
          transportation: data.transportation || '',
          hasPilatesExperience: data.hasPilatesExperience,
          hasExerciseHabit: data.hasExerciseHabit,
          hasInjuryHistory: data.hasInjuryHistory,
          injuryDetails: data.injuryDetails || '',
          injuryTiming: data.injuryTiming || '',
          trialMotivations: data.trialMotivations ? data.trialMotivations.split(',') : []
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
      const submitData = {
        ...formData,
        trialMotivations: formData.trialMotivations.join(',')
      }
      
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
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

  const handleInputChange = (field: string, value: string | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMotivationToggle = (motivation: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      trialMotivations: checked 
        ? [...prev.trialMotivations, motivation]
        : prev.trialMotivations.filter(m => m !== motivation)
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
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center min-w-0 flex-1">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">プロフィール設定</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">追加情報を入力してプロフィールを完成させましょう</p>
              </div>
            </div>
            <div className="flex items-center ml-4 flex-shrink-0">
              <Link href="/member/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">戻る</span>
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
              {/* 当スタジオをどちらでお知りになりましたか */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">●当スタジオをどちらでお知りになりましたか？</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="howDidYouKnowUs">きっかけ</Label>
                    <Select 
                      value={formData.howDidYouKnowUs} 
                      onValueChange={(value) => handleInputChange('howDidYouKnowUs', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ホームページ">ホームページ</SelectItem>
                        <SelectItem value="店頭看板・店頭チラシ">店頭看板・店頭チラシ</SelectItem>
                        <SelectItem value="インスタグラム">インスタグラム</SelectItem>
                        <SelectItem value="ポスティングチラシ">ポスティングチラシ</SelectItem>
                        <SelectItem value="紹介">紹介</SelectItem>
                        <SelectItem value="その他">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.howDidYouKnowUs === '紹介' && (
                    <div className="space-y-2">
                      <Label htmlFor="referrerName">紹介者名</Label>
                      <Input
                        id="referrerName"
                        type="text"
                        placeholder="紹介者のお名前を入力してください"
                        value={formData.referrerName}
                        onChange={(e) => handleInputChange('referrerName', e.target.value)}
                      />
                    </div>
                  )}
                  
                  {formData.howDidYouKnowUs === 'その他' && (
                    <div className="space-y-2">
                      <Label htmlFor="otherSource">その他の詳細</Label>
                      <Input
                        id="otherSource"
                        type="text"
                        placeholder="詳細を入力してください"
                        value={formData.otherSource}
                        onChange={(e) => handleInputChange('otherSource', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 交通手段 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">●交通手段を教えてください</h3>
                <div className="space-y-2">
                  <Select 
                    value={formData.transportation} 
                    onValueChange={(value) => handleInputChange('transportation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="交通手段を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="徒歩or自転車">徒歩or自転車</SelectItem>
                      <SelectItem value="車">車</SelectItem>
                      <SelectItem value="バス">バス</SelectItem>
                      <SelectItem value="電車">電車</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ピラティス経験 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">●ピラティスのご経験はございますか？</h3>
                <div className="space-y-2">
                  <div className="flex gap-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="hasPilatesExperience"
                        checked={formData.hasPilatesExperience === false}
                        onChange={() => handleInputChange('hasPilatesExperience', false)}
                        className="text-blue-600"
                      />
                      <span>なし</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="hasPilatesExperience"
                        checked={formData.hasPilatesExperience === true}
                        onChange={() => handleInputChange('hasPilatesExperience', true)}
                        className="text-blue-600"
                      />
                      <span>あり</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 運動習慣 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">●現在、運動習慣はございますか？</h3>
                <div className="space-y-2">
                  <div className="flex gap-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="hasExerciseHabit"
                        checked={formData.hasExerciseHabit === false}
                        onChange={() => handleInputChange('hasExerciseHabit', false)}
                        className="text-blue-600"
                      />
                      <span>なし</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="hasExerciseHabit"
                        checked={formData.hasExerciseHabit === true}
                        onChange={() => handleInputChange('hasExerciseHabit', true)}
                        className="text-blue-600"
                      />
                      <span>あり</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 怪我や病気の履歴 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">●現在、過去に怪我や病気、手術経験はございますか？</h3>
                <div className="space-y-4">
                  <div className="flex gap-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="hasInjuryHistory"
                        checked={formData.hasInjuryHistory === false}
                        onChange={() => handleInputChange('hasInjuryHistory', false)}
                        className="text-blue-600"
                      />
                      <span>なし</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="hasInjuryHistory"
                        checked={formData.hasInjuryHistory === true}
                        onChange={() => handleInputChange('hasInjuryHistory', true)}
                        className="text-blue-600"
                      />
                      <span>あり</span>
                    </label>
                  </div>
                  
                  {formData.hasInjuryHistory === true && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label htmlFor="injuryDetails">内容</Label>
                        <Input
                          id="injuryDetails"
                          type="text"
                          placeholder="怪我や病気の内容を入力してください"
                          value={formData.injuryDetails}
                          onChange={(e) => handleInputChange('injuryDetails', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="injuryTiming">いつ頃</Label>
                        <Input
                          id="injuryTiming"
                          type="text"
                          placeholder="時期を入力してください（例：2020年頃）"
                          value={formData.injuryTiming}
                          onChange={(e) => handleInputChange('injuryTiming', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 体験のきっかけや目的 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">●体験のきっかけや目的を教えてください（複数回答可）</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    '姿勢改善',
                    '痛み改善', 
                    'ダイエット',
                    '体幹強化',
                    '運動不足解消',
                    '慢性的な疲労'
                  ].map((motivation) => (
                    <label key={motivation} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.trialMotivations.includes(motivation)}
                        onChange={(e) => handleMotivationToggle(motivation, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{motivation}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">既存のプロフィール項目</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* ピラティス経験レベル */}
                <div className="space-y-2">
                  <Label htmlFor="pilatesExperience">ピラティス経験レベル</Label>
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