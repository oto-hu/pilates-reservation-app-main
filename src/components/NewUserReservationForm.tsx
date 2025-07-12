'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Clock, Users, Building2, UserCheck, AlertCircle, Ticket, CreditCard, Loader2, User, Mail, Phone, Calendar as CalendarIcon } from 'lucide-react'
import { Lesson, PaymentMethod, CreateReservationData, ReservationType, LessonType, NewUserReservationData } from '@/lib/types'
import { formatDateTime, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const newUserReservationSchema = z.object({
  // 会員登録情報
  name: z.string().min(1, '氏名を入力してください'),
  furigana: z.string().min(1, 'フリガナを入力してください'),
  age: z.number().min(0, '年齢を入力してください'),
  gender: z.string().min(1, '性別を選択してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  memo: z.string().optional(),
  
  // 予約情報
  customerPhone: z.string().min(10, '電話番号を入力してください'),
  medicalInfo: z.string().optional(),
  reservationType: z.nativeEnum(ReservationType),
  agreeToConsent: z.boolean().optional()
})

type NewUserReservationForm = z.infer<typeof newUserReservationSchema>

interface NewUserReservationFormProps {
  lesson: Lesson
  onSubmit: (data: NewUserReservationData) => Promise<void>
  submitting: boolean
}

export default function NewUserReservationForm({ lesson, onSubmit, submitting }: NewUserReservationFormProps) {
  const [selectedReservationType, setSelectedReservationType] = useState<ReservationType>(ReservationType.TRIAL)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<NewUserReservationForm>({
    resolver: zodResolver(newUserReservationSchema),
    defaultValues: {
      reservationType: ReservationType.TRIAL
    }
  })

  const getReservationTypePrice = (type: ReservationType) => {
    switch (type) {
      case ReservationType.TRIAL:
        return '1,000円'
      case ReservationType.DROP_IN:
        return lesson ? `${lesson.price.toLocaleString()}円` : 'N/A'
      case ReservationType.TICKET:
        return 'チケット1枚'
      default:
        return ''
    }
  }

  const handleFormSubmit = async (data: NewUserReservationForm) => {
    // NewUserReservationData型に変換
    const reservationData: NewUserReservationData = {
      ...data,
      lessonId: lesson.id
    }
    await onSubmit(reservationData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Info */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{lesson.title}</h2>
          
          <div className="space-y-3 text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-primary-500" />
              <span>{formatDateTime(new Date(lesson.startTime))}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-primary-500" />
              <span>
                {formatTime(new Date(lesson.startTime))} - {formatTime(new Date(lesson.endTime))}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3 text-primary-500" />
              <span>残り {lesson.maxCapacity - lesson.reservations.length}/{lesson.maxCapacity} 席</span>
            </div>
            {lesson.instructorName && (
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 mr-3 text-primary-500" />
                <span>インストラクター: {lesson.instructorName}</span>
              </div>
            )}
            <div className="flex items-center">
              <span className="mr-3 text-xl">💴</span>
              <span className="font-bold text-lg text-primary-600">{lesson.price.toLocaleString()}円 (単回利用の場合)</span>
            </div>
          </div>

          {lesson.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600">{lesson.description}</p>
            </div>
          )}
        </div>

        {/* New User Registration and Reservation Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">新規会員登録・レッスン予約</h3>

          <div className="space-y-6">
            {/* 会員登録情報 */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-4 w-4 mr-2" />
                会員登録情報
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 氏名 */}
                <div>
                  <label className="form-label">氏名 *</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* フリガナ */}
                <div>
                  <label className="form-label">フリガナ *</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('furigana')}
                  />
                  {errors.furigana && (
                    <p className="text-red-500 text-sm mt-1">{errors.furigana.message}</p>
                  )}
                </div>

                {/* 年齢 */}
                <div>
                  <label className="form-label">年齢 *</label>
                  <input
                    type="number"
                    className="form-input"
                    {...register('age', { valueAsNumber: true })}
                  />
                  {errors.age && (
                    <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
                  )}
                </div>

                {/* 性別 */}
                <div>
                  <label className="form-label">性別 *</label>
                  <select className="form-input" {...register('gender')}>
                    <option value="">選択してください</option>
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                  )}
                </div>

                {/* メールアドレス */}
                <div className="md:col-span-2">
                  <label className="form-label flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* パスワード */}
                <div className="md:col-span-2">
                  <label className="form-label">パスワード *</label>
                  <input
                    type="password"
                    className="form-input"
                    {...register('password')}
                    placeholder="8文字以上で入力してください"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* 備考 */}
                <div className="md:col-span-2">
                  <label className="form-label">備考</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    {...register('memo')}
                    placeholder="ご要望やご質問があればご記入ください"
                  />
                  {errors.memo && (
                    <p className="text-red-500 text-sm mt-1">{errors.memo.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 予約情報 */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                予約情報
              </h4>
              
              <div className="space-y-4">
                {/* 電話番号 */}
                <div>
                  <label className="form-label flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    電話番号 *
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    {...register('customerPhone')}
                  />
                  {errors.customerPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                  )}
                </div>

                {/* 予約タイプ */}
                <div>
                  <label className="form-label">予約タイプ *</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value={ReservationType.TRIAL}
                        {...register('reservationType')}
                        className="mr-2"
                        checked={selectedReservationType === ReservationType.TRIAL}
                        onChange={() => setSelectedReservationType(ReservationType.TRIAL)}
                      />
                      <span>体験レッスン ({getReservationTypePrice(ReservationType.TRIAL)})</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value={ReservationType.DROP_IN}
                        {...register('reservationType')}
                        className="mr-2"
                        checked={selectedReservationType === ReservationType.DROP_IN}
                        onChange={() => setSelectedReservationType(ReservationType.DROP_IN)}
                      />
                      <span>単回利用 ({getReservationTypePrice(ReservationType.DROP_IN)})</span>
                    </label>
                  </div>
                  {errors.reservationType && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservationType.message}</p>
                  )}
                </div>

                {/* 医療情報 */}
                <div>
                  <label className="form-label">医療情報</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    {...register('medicalInfo')}
                    placeholder="持病や注意事項があればご記入ください"
                  />
                  {errors.medicalInfo && (
                    <p className="text-red-500 text-sm mt-1">{errors.medicalInfo.message}</p>
                  )}
                </div>

                {/* 同意チェック */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('agreeToConsent')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">
                      同意書に同意します *
                    </span>
                  </label>
                  {errors.agreeToConsent && (
                    <p className="text-red-500 text-sm mt-1">同意書への同意が必要です</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                '会員登録・レッスン予約を完了する'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 