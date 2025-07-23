'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Clock, Users, Building2, UserCheck, AlertCircle, Ticket, CreditCard, Loader2, User, Mail, Phone, Calendar as CalendarIcon } from 'lucide-react'
import { Lesson, PaymentMethod, CreateReservationData, ReservationType, LessonType, NewUserReservationData } from '@/lib/types'
import { formatDate, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import ConsentForm from './ConsentForm'

const newUserReservationSchema = z.object({
  // 会員登録情報
  name: z.string().min(1, '氏名を入力してください'),
  furigana: z.string().min(1, 'フリガナを入力してください'),
  birthDate: z.string().min(1, '生年月日を入力してください'),
  age: z.string().optional(),
  gender: z.string().min(1, '性別を選択してください'),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  emergencyContactName: z.string().optional(),
  emergencyContactFurigana: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  memo: z.string().optional(),
  
  // 予約情報
  reservationType: z.nativeEnum(ReservationType)
})

type NewUserReservationForm = z.infer<typeof newUserReservationSchema>

interface NewUserReservationFormProps {
  lesson: Lesson
  onSubmit: (data: NewUserReservationData) => Promise<{ userId: string; customerName: string; customerEmail: string }>
  submitting: boolean
}

export default function NewUserReservationForm({ lesson, onSubmit, submitting }: NewUserReservationFormProps) {
  const [selectedReservationType, setSelectedReservationType] = useState<ReservationType>(ReservationType.TRIAL)
  const [showConsentForm, setShowConsentForm] = useState(false)
  const [formData, setFormData] = useState<NewUserReservationData | null>(null)
  const [consentPdfBlob, setConsentPdfBlob] = useState<Blob | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<NewUserReservationForm>({
    resolver: zodResolver(newUserReservationSchema),
    defaultValues: {
      reservationType: ReservationType.TRIAL
    }
  })

  const birthDate = watch('birthDate')
  const postalCode = watch('postalCode')

  // 年齢を自動計算
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

  // 生年月日が変更されたときに年齢を自動計算
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValue('birthDate', value)
    const age = calculateAge(value)
    setValue('age', age)
  }

  // 郵便番号から住所を取得
  const fetchAddressFromPostalCode = async (postalCode: string) => {
    try {
      // 郵便番号を正規化（ハイフンを除去）
      const normalizedPostalCode = postalCode.replace(/[^0-9]/g, '')
      
      if (normalizedPostalCode.length !== 7) {
        return
      }

      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalizedPostalCode}`)
      const data = await response.json()
      
      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0]
        const address = `${result.address1}${result.address2}${result.address3}`
        setValue('address', address)
      }
    } catch (error) {
      console.error('住所の取得に失敗しました:', error)
    }
  }

  // 郵便番号が変更されたときに住所を自動取得
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValue('postalCode', value)
    
    // 郵便番号が7桁（ハイフン含む場合は8桁）になったら住所を取得
    const normalizedValue = value.replace(/[^0-9]/g, '')
    if (normalizedValue.length === 7) {
      fetchAddressFromPostalCode(value)
    }
  }

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
    // フォームデータを保存して同意書を表示
    const reservationData: NewUserReservationData = {
      ...data,
      lessonId: lesson.id
    }
    setFormData(reservationData)
    setShowConsentForm(true)
  }

  const handleConsentComplete = async (pdfBlob: Blob) => {
    console.log('=== ConsentComplete - PDF受信 ===');
    console.log('PDF Blob received:', pdfBlob);
    
    // PDFブロブを保存
    setConsentPdfBlob(pdfBlob);
    
    if (formData) {
      console.log('📤 ユーザー作成・予約作成を実行...');
      
      try {
        // まずユーザー作成と予約作成を実行（戻り値でuserIdを取得）
        const result = await onSubmit(formData);
        
        console.log('✅ ユーザー作成完了:', result);
        
        // ユーザー作成後、同意書をサーバーに保存
        if (result.userId && pdfBlob) {
          console.log('📤 同意書をサーバーに保存中...');
          await saveConsentFormToServer(pdfBlob, result.userId, result.customerName, result.customerEmail);
        }
      } catch (error) {
        console.error('❌ ユーザー作成エラー:', error);
      }
    }
  }

  const saveConsentFormToServer = async (pdfBlob: Blob, userId: string, customerName: string, customerEmail: string) => {
    try {
      const formData = new FormData();
      formData.append('file', pdfBlob, '署名済み_グループレッスン同意書.pdf');
      formData.append('userId', userId);
      formData.append('customerName', customerName);
      formData.append('customerEmail', customerEmail);

      console.log('📤 Sending consent form to server...', { userId, customerName, customerEmail });

      const response = await fetch('/api/consent-forms', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        throw new Error('サーバーへの保存に失敗しました');
      }

      const result = await response.json();
      console.log('✅ 同意書がサーバーに保存されました:', result);
    } catch (error) {
      console.error('❌ 同意書サーバー保存エラー:', error);
      // エラーは記録するが、ユーザー作成は既に完了しているので処理は続行
    }
  }

  // 同意書フォームが表示されている場合
  if (showConsentForm) {
    console.log('=== NewUserReservationForm ConsentForm Props Debug ===');
    console.log('formData:', formData);
    console.log('Passing to ConsentForm:', {
      customerName: formData?.name,
      customerEmail: formData?.email,
      userId: 'undefined (new user)' // 新規ユーザーなのでuserIdはない
    });
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ConsentForm 
            onConsentComplete={handleConsentComplete}
          />
        </div>
      </div>
    )
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
              <span>{formatDate(new Date(lesson.startTime))}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-primary-500" />
              <span>
                {formatTime(new Date(lesson.startTime))} - {formatTime(new Date(lesson.endTime))}
              </span>
            </div>
            {lesson.instructorName && (
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 mr-3 text-primary-500" />
                <span>インストラクター: {lesson.instructorName}</span>
              </div>
            )}
            {lesson.location && (
              <div className="flex items-center">
                <span className="mr-3 text-primary-500">📍</span>
                <span>開催場所: {lesson.location}</span>
              </div>
            )}
            <div className="flex items-center">
              <span className="mr-3 text-xl">💴</span>
              <span className="font-bold text-lg text-primary-600">体験レッスン: 1,000円</span>
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
              
              <div className="space-y-4">
                {/* 基本情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 氏名 */}
                  <div>
                    <label className="form-label">氏名 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      {...register('name')}
                      placeholder="山田太郎"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* フリガナ */}
                  <div>
                    <label className="form-label">フリガナ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      {...register('furigana')}
                      placeholder="ヤマダタロウ"
                    />
                    {errors.furigana && (
                      <p className="text-red-500 text-sm mt-1">{errors.furigana.message}</p>
                    )}
                  </div>

                  {/* 生年月日 */}
                  <div>
                    <label className="form-label">生年月日 <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      {...register('birthDate')}
                      onChange={handleBirthDateChange}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.birthDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.birthDate.message}</p>
                    )}
                  </div>

                  {/* 年齢 */}
                  <div>
                    <label className="form-label">年齢</label>
                    <input
                      type="number"
                      className="form-input"
                      {...register('age')}
                      placeholder="自動計算"
                      readOnly
                    />
                    {errors.age && (
                      <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
                    )}
                  </div>

                  {/* 性別 */}
                  <div>
                    <label className="form-label">性別 <span className="text-red-500">*</span></label>
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
                </div>

                {/* 住所情報 */}
                <div className="space-y-4">
                  <div>
                    <label className="form-label">郵便番号 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      {...register('postalCode')}
                      onChange={handlePostalCodeChange}
                      placeholder="123-4567"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">住所 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      {...register('address')}
                      placeholder="東京都渋谷区..."
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>
                </div>

                {/* 連絡先情報 */}
                <div className="space-y-4">
                  <div>
                    <label className="form-label flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      {...register('email')}
                      placeholder="example@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">パスワード <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      className="form-input"
                      {...register('password')}
                      placeholder="6文字以上で入力してください"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                {/* 自由記載欄 */}
                <div>
                  <label className="form-label">自由記載欄</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    {...register('memo')}
                    placeholder="事前に伝えておきたいことやレッスン中に考慮が必要な事項等あれば、ご自由にご記入ください。　(例)〇〇に痛みがある、△△に手術歴がある、□□を治療中など"
                  />
                  {errors.memo && (
                    <p className="text-red-500 text-sm mt-1">{errors.memo.message}</p>
                  )}
                </div>

                {/* 緊急連絡先 */}
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">緊急連絡先</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">緊急連絡先氏名</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('emergencyContactName')}
                        placeholder="山田花子"
                      />
                      {errors.emergencyContactName && (
                        <p className="text-red-500 text-sm mt-1">{errors.emergencyContactName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">緊急連絡先フリガナ</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('emergencyContactFurigana')}
                        placeholder="ヤマダハナコ"
                      />
                      {errors.emergencyContactFurigana && (
                        <p className="text-red-500 text-sm mt-1">{errors.emergencyContactFurigana.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">緊急連絡先電話番号</label>
                      <input
                        type="tel"
                        className="form-input"
                        {...register('emergencyContactPhone')}
                        placeholder="090-1234-5678"
                      />
                      {errors.emergencyContactPhone && (
                        <p className="text-red-500 text-sm mt-1">{errors.emergencyContactPhone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">緊急連絡先との関係</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('emergencyContactRelation')}
                        placeholder="配偶者、親、子など"
                      />
                      {errors.emergencyContactRelation && (
                        <p className="text-red-500 text-sm mt-1">{errors.emergencyContactRelation.message}</p>
                      )}
                    </div>
                  </div>
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
                {/* 予約タイプ（体験レッスンのみ） */}
                <div>
                  <label className="form-label">予約タイプ <span className="text-red-500">*</span></label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value={ReservationType.TRIAL}
                        {...register('reservationType')}
                        className="mr-2"
                        checked={true}
                        readOnly
                      />
                      <span>体験レッスン ({getReservationTypePrice(ReservationType.TRIAL)})</span>
                    </label>
                  </div>
                  {errors.reservationType && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservationType.message}</p>
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
                '同意書に進む'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
