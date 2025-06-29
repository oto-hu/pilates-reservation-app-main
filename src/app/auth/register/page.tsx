'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MemberRegistrationData } from '@/lib/types'

const genders = [
  { value: '男性', label: '男性' },
  { value: '女性', label: '女性' },
  { value: 'その他', label: 'その他' },
  { value: '回答しない', label: '回答しない' },
]

function RegisterPageContent() {
  const [formData, setFormData] = useState<MemberRegistrationData>({
    name: '',
    furigana: '',
    age: 0,
    gender: '',
    email: '',
    password: '',
    memo: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openGenderSelector, setOpenGenderSelector] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '会員登録に失敗しました')
      }

      router.push('/auth/login?message=registration-success')
    } catch (err) {
      setError(err instanceof Error ? err.message : '会員登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof MemberRegistrationData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = field === 'age' ? parseInt(e.target.value) || 0 : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }))
    setOpenGenderSelector(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white p-8 rounded-lg border shadow-sm space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">会員登録</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントを作成してピラティスレッスンを予約しましょう
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">氏名 *</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange('name')}
              placeholder="山田太郎"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="furigana">フリガナ *</Label>
            <Input
              id="furigana"
              type="text"
              required
              value={formData.furigana}
              onChange={handleInputChange('furigana')}
              placeholder="ヤマダタロウ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">年齢 *</Label>
            <Input
              id="age"
              type="number"
              required
              min="0"
              max="120"
              value={formData.age || ''}
              onChange={handleInputChange('age')}
              placeholder="30"
            />
          </div>

          <div className="space-y-2">
            <Label>性別 *</Label>
            <Popover open={openGenderSelector} onOpenChange={setOpenGenderSelector}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openGenderSelector}
                  className="w-full justify-between"
                >
                  {formData.gender
                    ? genders.find((gender) => gender.value === formData.gender)?.label
                    : "性別を選択してください"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="性別を検索..." />
                  <CommandEmpty>見つかりません</CommandEmpty>
                  <CommandGroup>
                    {genders.map((gender) => (
                      <CommandItem
                        key={gender.value}
                        value={gender.value}
                        onSelect={(currentValue) => {
                          handleGenderChange(currentValue === formData.gender ? "" : currentValue)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.gender === gender.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {gender.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="example@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード *</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="8文字以上で入力してください"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">自由記載欄</Label>
            <Textarea
              id="memo"
              value={formData.memo}
              onChange={handleInputChange('memo')}
              placeholder="ご質問やご要望などがあればご記入ください"
              rows={3}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登録中...' : '会員登録'}
          </Button>

          <div className="mt-4 text-center text-sm">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
              ログイン
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  )
}