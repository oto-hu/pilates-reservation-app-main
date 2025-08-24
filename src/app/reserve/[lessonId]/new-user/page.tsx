'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Lesson, NewUserReservationData } from '@/lib/types'
import NewUserReservationForm from '@/components/NewUserReservationForm'

interface NewUserReservationPageProps {
  params: {
    lessonId: string
  }
}

export default function NewUserReservationPage({ params }: NewUserReservationPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWaitlist = searchParams.get('waitlist') === 'true'
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchLesson()
  }, [params.lessonId])

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons?start=${new Date().toISOString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch lesson')
      }

      const lessons = await response.json()
      const currentLesson = lessons.find((l: Lesson) => l.id === params.lessonId)
      
      if (!currentLesson) {
        router.push('/reserve')
        return
      }
      
      setLesson(currentLesson)
    } catch (error) {
      console.error('Error fetching lesson:', error)
      router.push('/reserve')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: NewUserReservationData): Promise<{ userId: string; customerName: string; customerEmail: string }> => {
    if (!lesson) throw new Error('Lesson not found')

    setSubmitting(true)

    try {
      if (isWaitlist) {
        // キャンセル待ち登録の場合
        console.log('📤 キャンセル待ち登録データ:', data);

        // まず新規会員登録
        const userResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: data.name,
            furigana: data.furigana,
            email: data.email,
            password: data.password,
            birthDate: data.birthDate,
            age: data.age,
            gender: data.gender,
            postalCode: data.postalCode,
            address: data.address,
            emergencyContactName: data.emergencyContactName,
            emergencyContactFurigana: data.emergencyContactFurigana,
            emergencyContactPhone: data.emergencyContactPhone,
            emergencyContactRelation: data.emergencyContactRelation,
            memo: data.memo
          })
        })

        if (!userResponse.ok) {
          const errorData = await userResponse.json()
          throw new Error(errorData.error || 'Failed to create user')
        }

        const userResult = await userResponse.json()
        console.log('✅ 新規会員登録完了:', userResult);

        // 会員登録後、Next-authでログインしてキャンセル待ち登録
        const loginResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false
        })

        if (loginResult?.ok) {
          console.log('✅ 自動ログイン成功');
          
          // 少し待機してセッションが確立されるまで待つ
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // キャンセル待ちに登録
          const waitlistResponse = await fetch(`/api/lessons/${lesson.id}/waiting-list`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (waitlistResponse.ok) {
            console.log('✅ キャンセル待ち登録完了');
            
            // 成功ページへリダイレクト（キャンセル待ち完了）
            setTimeout(() => {
              router.replace(`/member/dashboard`)
            }, 1000);

            return {
              userId: userResult.user.id,
              customerName: userResult.user.name,
              customerEmail: userResult.user.email
            };
          } else {
            const errorData = await waitlistResponse.json().catch(() => ({}))
            console.error('キャンセル待ち登録エラー:', errorData)
            throw new Error('キャンセル待ち登録に失敗しました')
          }
        } else {
          console.error('自動ログインエラー:', loginResult?.error)
          throw new Error('自動ログインに失敗しました')
        }
      } else {
        // 通常の新規ユーザー予約の場合
        const reservationData: NewUserReservationData = {
          ...data,
          lessonId: lesson.id
        }

        console.log('📤 送信データ:', reservationData);

        const response = await fetch('/api/reservations/new-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reservationData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create reservation')
        }

        const result = await response.json()
        console.log('✅ ユーザー・予約作成完了:', result);

        // 新規ユーザーの自動ログイン処理を追加
        console.log('📤 新規ユーザーの自動ログインを実行...');
        const loginResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false
        })

        if (loginResult?.ok) {
          console.log('✅ 自動ログイン成功');
          
          // 少し待機してセッションが確立されるまで待つ
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error('自動ログインエラー:', loginResult?.error)
          // ログインに失敗してもエラーにはしない（予約は既に完了しているため）
        }

        // NewUserReservationFormに返すためのユーザー情報
        const userInfo = {
          userId: result.user.id,
          customerName: result.user.name,
          customerEmail: result.user.email
        };

        console.log('🔄 ユーザー情報をNewUserReservationFormに返します:', userInfo);

        // 成功ページへのリダイレクトは同意書保存完了後に行う
        // router.replace() を使用して同意書ページを履歴から削除
        setTimeout(() => {
          router.replace(`/reserve/complete?reservationId=${result.reservation.id}&newUser=true`)
        }, 2000); // 同意書保存の時間を考慮

        return userInfo;
      }

    } catch (error) {
      console.error('Error creating reservation/waitlist:', error)
      alert(error instanceof Error ? error.message : '登録に失敗しました')
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">レッスン情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return null
  }

  const availableSpots = lesson.maxCapacity - lesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED').length
  const lessonStartTime = new Date(lesson.startTime)
  const currentTime = new Date()
  const thirtyMinutesBeforeStart = new Date(lessonStartTime.getTime() - 30 * 60 * 1000)
  const isPast = currentTime > thirtyMinutesBeforeStart
  const isFull = availableSpots <= 0

  if (isPast || (isFull && !isWaitlist)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <Link href="/trial" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">予約不可</h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isPast ? 'このレッスンは終了しています' : 'このレッスンは満席です'}
            </h2>
            
            <p className="text-gray-600 mb-8">
              他のレッスンをご検討ください
            </p>
            
            <Link href="/trial" className="btn-primary">
              体験レッスン一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/trial" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isWaitlist ? '新規会員登録・キャンセル待ち' : '新規会員登録・レッスン予約'}
              </h1>
              <p className="text-sm text-gray-600">
                {isWaitlist ? '会員登録とキャンセル待ち登録を同時に行います' : '会員登録とレッスン予約を同時に行います'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <NewUserReservationForm
        lesson={lesson}
        onSubmit={handleSubmit}
        submitting={submitting}
        isWaitlist={isWaitlist}
      />
    </div>
  )
} 