import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, AlertTriangle, Shield, Heart } from 'lucide-react'

export default function ConsentFormPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">ピラティスレッスン同意書</h1>
          </div>
          <p className="text-lg text-gray-600">
            安全にレッスンを受講していただくため、以下の内容をご確認ください
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-2" />
                健康状態の確認
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                ピラティスは身体に負荷をかける運動です。以下の状態に該当する方は、必ず医師にご相談の上、許可を得てからご参加ください。
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>妊娠中の方</li>
                <li>心疾患、高血圧などの循環器疾患をお持ちの方</li>
                <li>腰痛、膝痛などの整形外科的疾患をお持ちの方</li>
                <li>その他、医師から運動制限を受けている方</li>
                <li>体調不良の方（発熱、風邪症状など）</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                参加における注意事項
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. 体調管理について</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>レッスン前に十分な水分補給を行ってください</li>
                    <li>体調が優れない場合は、無理をせずレッスンをお休みください</li>
                    <li>レッスン中に体調不良を感じた場合は、すぐにインストラクターにお知らせください</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. 服装・持ち物について</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>動きやすい服装でご参加ください</li>
                    <li>タオル、お水をご持参ください</li>
                    <li>マットは無料でお貸しいたします</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. レッスン中の注意事項</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>インストラクターの指示に従ってください</li>
                    <li>無理な動きは避け、自分のペースで行ってください</li>
                    <li>痛みを感じた場合は、すぐに動きを止めてください</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 text-blue-500 mr-2" />
                責任の所在
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">重要事項</h4>
                    <p className="text-yellow-700 text-sm">
                      レッスン参加中に発生した怪我や事故について、当スタジオは一切の責任を負いません。
                      参加者ご自身の責任において、安全にご参加いただくようお願いいたします。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-gray-700">
                <p>• レッスン参加前に健康状態を十分にご確認ください</p>
                <p>• 持病をお持ちの方は、事前に医師にご相談ください</p>
                <p>• 無理をせず、自分の体調と相談しながらご参加ください</p>
                <p>• 万が一、レッスン中に怪我をされた場合は、すぐにスタッフにお知らせください</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>個人情報の取り扱いについて</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">
              <p>• 予約時にご提供いただいた個人情報は、レッスン運営のためのみに使用いたします</p>
              <p>• 個人情報を第三者に提供することはありません</p>
              <p>• 個人情報は適切に管理し、不要になった時点で破棄いたします</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>キャンセルポリシー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      無料キャンセル
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700">
                    <strong>レッスン前日21:00まで</strong><br />
                    チケット利用の場合は、チケットが返還されます
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                      キャンセル料発生
                    </Badge>
                  </div>
                  <p className="text-sm text-red-700">
                    <strong>レッスン前日21:00以降</strong><br />
                    チケット利用の場合は、チケット1枚が消費されます
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-900">同意確認</CardTitle>
              <CardDescription className="text-blue-700">
                レッスンの予約時に、上記の内容に同意していただく必要があります
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  本同意書の内容をご理解いただき、同意される場合は、<br />
                  予約画面で同意チェックボックスにチェックを入れてください。
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">安全で楽しいレッスンをお楽しみください</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}