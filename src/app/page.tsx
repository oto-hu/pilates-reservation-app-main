import Link from 'next/link'
import { Calendar, Clock, Users, CreditCard } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ピラティススタジオ</h1>
              <p className="text-gray-600">グループレッスン予約システム</p>
            </div>
            <Link href="/admin/login" className="text-gray-500 hover:text-gray-700">
              管理者ログイン
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            心と体を整える
            <span className="text-primary-500 block">ピラティスレッスン</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            少人数制のグループレッスンで、あなたのペースに合わせたピラティスを体験してください。
            オンラインで簡単に予約できます。
          </p>
          <Link
            href="/reserve"
            className="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Calendar className="mr-2 h-5 w-5" />
            レッスン予約はこちら
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            予約システムの特徴
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">簡単予約</h4>
              <p className="text-gray-600">カレンダーから空き枠を選んで簡単に予約できます</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-secondary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">少人数制</h4>
              <p className="text-gray-600">最大5名の少人数制で質の高いレッスンを提供</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">前日まで変更可</h4>
              <p className="text-gray-600">前日までなら予約の変更・キャンセルが可能</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-secondary-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2">支払い方法選択</h4>
              <p className="text-gray-600">オンライン決済または当日支払いを選択可能</p>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                スタジオについて
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                20〜40代の女性を中心に、心と体の健康をサポートするピラティススタジオです。
                経験豊富なインストラクターが、一人ひとりのレベルに合わせて丁寧に指導いたします。
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                  初心者から上級者まで対応
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                  清潔で快適なスタジオ環境
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                  必要な器具は全て完備
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg p-8 text-center">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">今すぐ予約</h4>
              <p className="text-gray-600 mb-6">
                お気軽にレッスンを体験してください
              </p>
              <Link
                href="/reserve"
                className="btn-primary inline-flex items-center px-6 py-3 text-lg"
              >
                <Calendar className="mr-2 h-5 w-5" />
                予約ページへ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h5 className="text-2xl font-bold mb-4">ピラティススタジオ</h5>
            <p className="text-gray-400">
              © 2024 Pilates Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}