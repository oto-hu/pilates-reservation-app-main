// src/app/api/reservations/new-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { PaymentMethod, PaymentStatus, ReservationType } from '@/lib/types'
import { sendEmail, generateReservationConfirmationEmail } from '@/lib/notifications'
import { z } from 'zod'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

const newUserReservationSchema = z.object({
  // 会員登録情報
  name: z.string().min(1, '氏名は必須です'),
  furigana: z.string().min(1, 'フリガナは必須です'),
  age: z.number().min(0, '年齢は0以上である必要があります'),
  gender: z.string().min(1, '性別は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  memo: z.string().optional(),
  
  // 予約情報
  lessonId: z.string().min(1, 'レッスンIDは必須です'),
  customerPhone: z.string().min(10, '電話番号を入力してください'),
  medicalInfo: z.string().optional(),
  reservationType: z.nativeEnum(ReservationType),
  agreeToConsent: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = newUserReservationSchema.parse(body)

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // レッスンの存在確認
    const lesson = await prisma.lesson.findUnique({
      where: { id: validatedData.lessonId },
      include: { reservations: true }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // 定員チェック
    if (lesson.reservations.length >= lesson.maxCapacity) {
      return NextResponse.json(
        { error: 'Lesson is full' },
        { status: 400 }
      )
    }

    // 予約可能時間チェック（レッスン開始30分前まで）
    const lessonStartTime = new Date(lesson.startTime)
    const currentTime = new Date()
    const thirtyMinutesBeforeStart = new Date(lessonStartTime.getTime() - 30 * 60 * 1000)
    
    if (currentTime > thirtyMinutesBeforeStart) {
      return NextResponse.json(
        { error: 'Reservation is no longer available for this lesson' },
        { status: 400 }
      )
    }

    // パスワードのハッシュ化
    const hashedPassword = await hash(validatedData.password, 12)

    // トランザクションでユーザー作成と予約作成を同時実行
    const result = await prisma.$transaction(async (tx) => {
      // ユーザーの作成
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          furigana: validatedData.furigana,
          age: validatedData.age,
          gender: validatedData.gender,
          email: validatedData.email,
          phone: validatedData.customerPhone,
          password: hashedPassword,
          memo: validatedData.memo || '',
          role: 'member',
          consentAgreedAt: validatedData.agreeToConsent ? new Date() : null
        }
      })

      // 予約を作成
      const reservation = await tx.reservation.create({
        data: {
          lessonId: validatedData.lessonId,
          userId: user.id,
          customerName: validatedData.name,
          customerEmail: validatedData.email,
          customerPhone: validatedData.customerPhone,
          medicalInfo: validatedData.medicalInfo,
          reservationType: validatedData.reservationType,
          paymentMethod: PaymentMethod.PAY_AT_STUDIO,
          paymentStatus: 'PENDING'
        },
        include: {
          lesson: true,
          user: true
        }
      })

      return { user, reservation }
    })

    // メール通知を送信（非同期処理）
    try {
      // 日本時間でフォーマット
      const lessonDate = new Date(result.reservation.lesson.startTime).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      })
      
      const reservationTypeName = {
        [ReservationType.TRIAL]: '体験レッスン',
        [ReservationType.DROP_IN]: '単回利用',
        [ReservationType.TICKET]: 'チケット利用'
      }[validatedData.reservationType as ReservationType]
      
      const paymentInfo = {
        [ReservationType.TRIAL]: '当日PayPay払い（1,000円）',
        [ReservationType.DROP_IN]: `当日PayPay払い（${lesson.lessonType === 'SMALL_GROUP' ? '3,500円' : '3,000円'}）`,
        [ReservationType.TICKET]: 'チケット1枚'
      }[validatedData.reservationType as ReservationType]
      
      const emailData = generateReservationConfirmationEmail(
        validatedData.name,
        result.reservation.lesson.title,
        lessonDate,
        reservationTypeName,
        paymentInfo
      )
      
      emailData.to = validatedData.email
      await sendEmail(emailData)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // メール送信失敗は予約成功に影響しない
    }

    return NextResponse.json({ 
      user: result.user, 
      reservation: result.reservation 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating new user reservation:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
} 