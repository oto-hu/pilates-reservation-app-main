'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface RegisterFormData {
  name: string
  furigana: string
  birthDate: string
  age: string
  gender: string
  postalCode: string
  address: string
  email: string
  password: string
  confirmPassword: string
  memo: string
  emergencyContactName: string
  emergencyContactFurigana: string
  emergencyContactPhone: string
  emergencyContactRelation: string
}

function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    furigana: '',
    birthDate: '',
    age: '',
    gender: '',
    postalCode: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: '',
    memo: '',
    emergencyContactName: '',
    emergencyContactFurigana: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return ''
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return (age - 1).toString()
    }
    return age.toString()
  }

  const handleBirthDateChange = (value: string) => {
    handleInputChange('birthDate', value)
    const age = calculateAge(value)
    handleInputChange('age', age)
  }

  const validateForm = () => {
    if (!formData.name || !formData.furigana || !formData.birthDate || !formData.gender || !formData.email || 
        !formData.password || !formData.confirmPassword) {
      setError('必須項目を入力してください')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      return false
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('正しいメールアドレスを入力してください')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          furigana: formData.furigana,
          birthDate: formData.birthDate,
          age: parseInt(formData.age) || 0,
          gender: formData.gender,
          postalCode: formData.postalCode,
          address: formData.address,
          email: formData.email,
          password: formData.password,
          memo: formData.memo,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactFurigana: formData.emergencyContactFurigana,
          emergencyContactPhone: formData.emergencyContactPhone,
          emergencyContactRelation: formData.emergencyContactRelation
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '登録に失敗しました')
      } else {
        setMessage('会員登録が完了しました。ログインページに移動します。')
        setTimeout(() => {
          router.push('/auth/login?message=registration-success')
        }, 2000)
      }
    } catch (err) {
      setError('登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">新規会員登録</CardTitle>
          <CardDescription className="text-center">
            会員情報を入力して登録してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">氏名 <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="山田太郎"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="furigana">フリガナ <span className="text-red-500">*</span></Label>
                  <Input
                    id="furigana"
                    type="text"
                    required
                    value={formData.furigana}
                    onChange={(e) => handleInputChange('furigana', e.target.value)}
                    placeholder="ヤマダタロウ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">生年月日 <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                      value={formData.birthDate?.split('-')[0] || ''}
                      onChange={(e) => {
                        const currentDate = formData.birthDate || ''
                        const [, month, day] = currentDate.split('-')
                        const newDate = `${e.target.value}-${month || '01'}-${day || '01'}`
                        handleBirthDateChange(newDate)
                      }}
                    >
                      <option value="">年</option>
                      {Array.from({ length: 100 }, (_, i) => {
                        const year = new Date().getFullYear() - i
                        return (
                          <option key={year} value={year}>
                            {year}年
                          </option>
                        )
                      })}
                    </select>
                    
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                      value={formData.birthDate?.split('-')[1] || ''}
                      onChange={(e) => {
                        const currentDate = formData.birthDate || ''
                        const [year, , day] = currentDate.split('-')
                        const newDate = `${year || new Date().getFullYear()}-${e.target.value.padStart(2, '0')}-${day || '01'}`
                        handleBirthDateChange(newDate)
                      }}
                    >
                      <option value="">月</option>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1
                        return (
                          <option key={month} value={month}>
                            {month}月
                          </option>
                        )
                      })}
                    </select>
                    
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                      value={formData.birthDate?.split('-')[2] || ''}
                      onChange={(e) => {
                        const currentDate = formData.birthDate || ''
                        const [year, month] = currentDate.split('-')
                        const newDate = `${year || new Date().getFullYear()}-${month || '01'}-${e.target.value.padStart(2, '0')}`
                        handleBirthDateChange(newDate)
                      }}
                    >
                      <option value="">日</option>
                      {Array.from({ length: 31 }, (_, i) => {
                        const day = i + 1
                        return (
                          <option key={day} value={day}>
                            {day}日
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">年齢</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="自動計算"
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">性別 <span className="text-red-500">*</span></Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="性別を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男性</SelectItem>
                    <SelectItem value="female">女性</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">郵便番号</Label>
                <Input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="東京都渋谷区..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード <span className="text-red-500">*</span></Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="6文字以上"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">パスワード（確認） <span className="text-red-500">*</span></Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="パスワードを再入力"
                  />
                </div>
              </div>
            </div>

            {/* 自由記載欄 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">自由記載欄</h3>
              <div className="space-y-2">
                <Textarea
                  id="memo"
                  value={formData.memo}
                  onChange={(e) => handleInputChange('memo', e.target.value)}
                  placeholder="事前に伝えておきたいことやレッスン中に考慮が必要な事項等あれば、ご自由にご記入ください。　(例)〇〇に痛みがある、△△に手術歴がある、□□を治療中など"
                  rows={4}
                />
              </div>
            </div>

            {/* 緊急連絡先 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">緊急連絡先</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">緊急連絡先氏名</Label>
                  <Input
                    id="emergencyContactName"
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    placeholder="山田花子"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactFurigana">緊急連絡先フリガナ</Label>
                  <Input
                    id="emergencyContactFurigana"
                    type="text"
                    value={formData.emergencyContactFurigana}
                    onChange={(e) => handleInputChange('emergencyContactFurigana', e.target.value)}
                    placeholder="ヤマダハナコ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">緊急連絡先電話番号</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    placeholder="090-1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelation">続柄</Label>
                  <Select value={formData.emergencyContactRelation} onValueChange={(value) => handleInputChange('emergencyContactRelation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="続柄を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="配偶者">配偶者</SelectItem>
                      <SelectItem value="親">親</SelectItem>
                      <SelectItem value="子">子</SelectItem>
                      <SelectItem value="兄弟姉妹">兄弟姉妹</SelectItem>
                      <SelectItem value="その他">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登録中...' : '会員登録'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
              ログイン
            </Link>
          </div>

          <div className="mt-2 text-center text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-500">
              ← ホームに戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
} 