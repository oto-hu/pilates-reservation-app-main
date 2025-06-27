// src/app/api/reservations/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { PaymentMethod, PaymentStatus, ReservationType } from '@/lib/types'
import { sendEmail, generateReservationConfirmationEmail } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { 
      lessonId, 
      userId,
      customerName, 
      customerEmail, 
      customerPhone, 
      medicalInfo,
      reservationType,
      paymentMethod,
      agreeToConsent 
    } = body

    // バリデーション
    if (!reservationType || !Object.values(ReservationType).includes(reservationType)) {
      return NextResponse.json(
        { error: '予約タイプが不正です' },
        { status: 400 }
      )
    }

    // Check if lesson exists and has capacity
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        reservations: {
          where: {
            paymentStatus: {
              not: 'CANCELLED'
            }
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    if (lesson.reservations.length >= lesson.maxCapacity) {
      return NextResponse.json(
        { error: 'Lesson is full' },
        { status: 400 }
      )
    }

    // Check if lesson is in the past
    if (new Date(lesson.startTime) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot book past lessons' },
        { status: 400 }
      )
    }

    // 予約タイプ別のバリデーション
    if (reservationType === ReservationType.TRIAL) {
      // 体験レッスンは初回のみ
      if (userId) {
        const existingReservations = await prisma.reservation.count({
          where: { userId }
        })
        if (existingReservations > 0) {
          return NextResponse.json(
            { error: '体験レッスンは初回のみご利用いただけます' },
            { status: 400 }
          )
        }
      }
    }

    if (reservationType === ReservationType.TICKET) {
      // チケット利用の場合、有効なチケットがあるかチェック
      if (!userId) {
        return NextResponse.json(
          { error: 'チケット利用にはログインが必要です' },
          { status: 401 }
        )
      }

      const availableTicket = await prisma.ticket.findFirst({
        where: {
          userId,
          lessonType: lesson.lessonType,
          remainingCount: { gt: 0 },
          expiresAt: { gt: new Date() }
        }
      })

      if (!availableTicket) {
        return NextResponse.json(
          { error: '利用可能なチケットがありません' },
          { status: 400 }
        )
      }
    }

    // トランザクション内で予約作成と関連処理を実行
    const result = await prisma.$transaction(async (tx) => {
      // 同意書への同意が必要な場合の処理
      if (userId && agreeToConsent) {
        await tx.user.update({
          where: { id: userId },
          data: { consentAgreedAt: new Date() }
        })
      }

      // 予約作成
      const reservation = await tx.reservation.create({
        data: {
          lessonId,
          userId,
          customerName,
          customerEmail,
          customerPhone,
          medicalInfo,
          reservationType,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING
        },
        include: {
          lesson: true
        }
      })

      // チケット利用の場合、チケットを消費
      if (reservationType === ReservationType.TICKET && userId) {
        await tx.ticket.updateMany({
          where: {
            userId,
            lessonType: lesson.lessonType,
            remainingCount: { gt: 0 },
            expiresAt: { gt: new Date() }
          },
          data: {
            remainingCount: { decrement: 1 }
          }
        })
      }

      return { reservation }
    })

    // メール通知を送信（非同期処理）
    try {
      const lessonDate = new Date(result.reservation.lesson.startTime).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      const reservationTypeName = {
        [ReservationType.TRIAL]: '体験レッスン',
        [ReservationType.DROP_IN]: '単回利用',
        [ReservationType.TICKET]: 'チケット利用'
      }[reservationType]
      
      const paymentInfo = {
        [ReservationType.TRIAL]: '当日PayPay払い（1,000円）',
        [ReservationType.DROP_IN]: `当日PayPay払い（${lesson.lessonType === 'SMALL_GROUP' ? '3,500円' : '3,000円'}）`,
        [ReservationType.TICKET]: 'チケット1枚'
      }[reservationType]
      
      const emailData = generateReservationConfirmationEmail(
        customerName,
        result.reservation.lesson.title,
        lessonDate,
        reservationTypeName,
        paymentInfo
      )
      
      emailData.to = customerEmail
      await sendEmail(emailData)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // メール送信失敗は予約成功に影響しない
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}