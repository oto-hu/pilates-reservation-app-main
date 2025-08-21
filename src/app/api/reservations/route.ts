// src/app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { PaymentMethod, PaymentStatus, ReservationType } from '@/lib/types'
import { sendEmail, generateReservationConfirmationEmail } from '@/lib/notifications'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      lessonId,
      customerName,
      customerEmail,
      customerPhone,
      medicalInfo,
      reservationType,
      paymentMethod,
      agreeToConsent
    } = body

    // レッスンの存在確認
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { reservations: true }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // 定員チェック（キャンセルされた予約は除外）
    const activeReservations = lesson.reservations.filter(r => r.paymentStatus !== 'CANCELLED')
    if (activeReservations.length >= lesson.maxCapacity) {
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

    // デバッグ用：受信した予約タイプをログ出力
    console.log('Received reservation request:', {
      userId: session.user.id,
      userRole: session.user.role,
      reservationType: reservationType,
      reservationTypeType: typeof reservationType,
      lessonId: lessonId
    })

    // 体験レッスンの重複チェック
    if (reservationType === ReservationType.TRIAL || reservationType === 'TRIAL') {
      if (session.user.role === 'member') {
        console.log('Checking trial lesson duplication for user:', session.user.id)
        
        const existingTrialReservations = await prisma.reservation.count({
          where: {
            userId: session.user.id,
            reservationType: ReservationType.TRIAL,
            paymentStatus: { not: PaymentStatus.CANCELLED }
          }
        })

        console.log('Existing trial reservations count:', existingTrialReservations)

        if (existingTrialReservations > 0) {
          return NextResponse.json(
            { error: '体験レッスンは1回のみご利用いただけます。既に体験レッスンの予約またはご利用履歴があります。' },
            { status: 400 }
          )
        }
      }
    }

    // チケット使用の場合の処理
    if (reservationType === ReservationType.TICKET && session.user.role === 'member') {
      const availableTickets = await prisma.ticket.findMany({
        where: {
          userId: session.user.id,
          remainingCount: { gt: 0 },
          expiresAt: { gt: new Date() },
          ticketGroupId: lesson.ticketGroupId
        }
      })

      if (availableTickets.length === 0) {
        return NextResponse.json(
          { error: 'No available tickets' },
          { status: 400 }
        )
      }

      // チケットを消費
      await prisma.ticket.update({
        where: { id: availableTickets[0].id },
        data: { remainingCount: availableTickets[0].remainingCount - 1 }
      })
    }

    // 同意書の同意確認
    if (agreeToConsent && session.user.role === 'member') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { consentAgreedAt: new Date() }
      })
    }

    // 予約を作成
    const reservation = await prisma.reservation.create({
      data: {
        lessonId,
        userId: session.user.id,
        customerName,
        customerEmail,
        customerPhone,
        medicalInfo,
        reservationType,
        paymentMethod,
        paymentStatus: paymentMethod === PaymentMethod.PAY_AT_STUDIO ? 'PENDING' : 'PAID'
      },
      include: {
        lesson: true
      }
    })

    // メール通知を送信（非同期処理）
    try {
      // 日本時間でフォーマット
      const lessonDate = new Date(reservation.lesson.startTime).toLocaleDateString('ja-JP', {
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
      }[reservationType as ReservationType]
      
      const paymentInfo = {
        [ReservationType.TRIAL]: '当日PayPay払い（1,000円）',
        [ReservationType.DROP_IN]: `当日PayPay払い（${lesson.lessonType === 'SMALL_GROUP' ? '3,500円' : '3,000円'}）`,
        [ReservationType.TICKET]: 'チケット1枚'
      }[reservationType as ReservationType]
      
      const emailData = generateReservationConfirmationEmail(
        customerName,
        reservation.lesson.title,
        lessonDate,
        reservation.lesson.location ?? '会場未設定',
        reservationTypeName,
        paymentInfo,
        reservationType === ReservationType.TRIAL
      )
      
      emailData.to = customerEmail
      await sendEmail(emailData)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // メール送信失敗は予約成功に影響しない
    }

    return NextResponse.json({ reservation }, { status: 201 })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}