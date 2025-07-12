'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Users, UserCheck, ArrowLeft, LogIn, User } from 'lucide-react'

export default function MemberReservePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user?.role === 'member') {
      // 会員の場合は直接予約ページにリダイレクト
      router.push('/reserve')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (session?.user?.role === 'member') {
    // 会員の場合はリダイレクト中
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">予約ページに移動中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">会員様のレッスン予約</h1>
                <p className="text-gray-600">会員ログイン後にレッスン予約を行います</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <User className="h-16 w-16 text-primary-500 mr-4" />
              <h2 className="text-4xl font-bold text-gray-900">会員様専用</h2>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              会員様はログイン後にレッスン予約・チケット管理・予約履歴の確認ができます
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-primary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">レッスン予約</h3>
                <p className="text-sm text-gray-600">チケット利用または単回利用でレッスンを予約</p>
              </div>
              <div className="text-center">
                <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="h-8 w-8 text-secondary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">チケット管理</h3>
                <p className="text-sm text-gray-600">チケット残数・有効期限を確認</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">予約管理</h3>
                <p className="text-sm text-gray-600">予約の確認・キャンセル・変更</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-800 mb-3">会員様の特典</h3>
              <ul className="text-blue-700 space-y-2 text-left">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  チケット利用でお得な料金でレッスン受講
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  キャンセル待ち機能の利用
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  予約履歴の確認
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  マイページでのチケット残数確認
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg w-full justify-center"
              >
                <LogIn className="mr-2 h-5 w-5" />
                会員ログイン
              </Link>
              
              <div className="text-center">
                <p className="text-gray-600 mb-2">まだ会員登録をされていない方は</p>
                <Link
                  href="/auth/register"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  新規会員登録はこちら
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            会員様の便利な機能
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">簡単予約</h4>
              <p className="text-gray-600">チケット利用でワンクリックで予約完了</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-secondary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">キャンセル待ち</h4>
              <p className="text-gray-600">満席時にキャンセル待ち登録可能</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">予約管理</h4>
              <p className="text-gray-600">予約の確認・キャンセルがいつでも可能</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            会員様はログインしてレッスン予約を始めましょう
          </h3>
          <p className="text-xl text-white/90 mb-8">
            チケット利用でお得にレッスンを受講できます
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 hover:bg-gray-50 text-lg font-semibold rounded-lg transition-colors shadow-lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              会員ログイン
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 text-lg font-semibold rounded-lg transition-colors"
            >
              <User className="mr-2 h-5 w-5" />
              新規会員登録
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
} 