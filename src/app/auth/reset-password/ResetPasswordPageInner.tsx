'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ResetPasswordPageInner() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [tokenValid, setTokenValid] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('無効なリセットリンクです')
      return
    }
    checkToken()
  }, [token])

  const checkToken = async () => {
    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })
      if (!response.ok) {
        setError('リセットリンクが無効または期限切れです')
      } else {
        setTokenValid(true)
      }
    } catch (err) {
      setError('トークンの確認に失敗しました')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'パスワードのリセットに失敗しました')
      } else {
        setMessage('パスワードが正常にリセットされました。ログインページに移動します。')
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    } catch (err) {
      setError('サーバーエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">無効なリンク</CardTitle>
            <CardDescription className="text-center">
              パスワードリセットリンクが無効です
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                無効なリセットリンクです。新しいリセットリンクを要求してください。
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500">
                パスワードリセットを再要求
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">新しいパスワードを設定</CardTitle>
          <CardDescription className="text-center">
            新しいパスワードを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {!tokenValid && !error && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">リンクを確認中...</p>
            </div>
          )}
          {tokenValid && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">新しいパスワード</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="新しいパスワードを入力してください"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワードを再入力してください"
                />
              </div>
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '更新中...' : 'パスワードを更新'}
              </Button>
            </form>
          )}
          {error && !tokenValid && (
            <div className="text-center">
              <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500">
                パスワードリセットを再要求
              </Link>
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
              ← ログインページに戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 