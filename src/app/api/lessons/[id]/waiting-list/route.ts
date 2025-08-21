import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { ReservationType, PaymentMethod, PaymentStatus } from '@/lib/types'
import { sendEmail, generateWaitingListRegistrationEmail } from '@/lib/notifications'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'member') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lessonId = params.id
    const userId = session.user.id

    // レッスンの存在確認
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // 既にキャンセル待ちに登録されているかチェック
    const existingWaitingList = await prisma.waitingList.findUnique({
      where: {
        lessonId_userId: {
          lessonId,
          userId
        }
      }
    })

    if (existingWaitingList) {
      return NextResponse.json(
        { error: 'キャンセル待ち登録が完了しました。メール内容をご確認ください。' },
        { status: 400 }
      )
    }

    // 体験レッスン対象者の場合、体験レッスンの重複チェック
    const hasAnyReservationHistory = await prisma.reservation.findFirst({
      where: {
        userId: userId,
        paymentStatus: { not: PaymentStatus.CANCELLED }
      }
    })

    // 体験レッスン対象者（予約履歴がない会員）の場合
    if (!hasAnyReservationHistory) {
      // 既存の体験レッスン予約をチェック
      const existingTrialReservations = await prisma.reservation.count({
        where: {
          userId: userId,
          reservationType: ReservationType.TRIAL,
          paymentStatus: { not: PaymentStatus.CANCELLED }
        }
      })

      // 他の体験レッスンキャンセル待ちをチェック
      const existingTrialWaitingList = await prisma.waitingList.count({
        where: {
          userId: userId
        }
      })

      if (existingTrialReservations > 0 || existingTrialWaitingList > 0) {
        return NextResponse.json(
          { error: '体験レッスンは1回のみご利用いただけます。既に体験レッスンの予約・キャンセル待ち、またはご利用履歴があります。' },
          { status: 400 }
        )
      }
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // キャンセル待ちに登録
    await prisma.waitingList.create({
      data: {
        lessonId,
        userId
      }
    })

    // キャンセル待ち登録完了メールを送信
    try {
      // 日本時間でフォーマット
      const lessonDate = new Date(lesson.startTime).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      })

      // 予約履歴を確認して予約タイプを判定
      const hasReservationHistory = await prisma.reservation.findFirst({
        where: {
          userId: userId,
          paymentStatus: { not: PaymentStatus.CANCELLED }
        }
      })

      const reservationType = (user.role === 'member' && !hasReservationHistory) 
        ? '体験レッスン' 
        : 'チケット利用'

      const emailData = generateWaitingListRegistrationEmail(
        user.name || '',
        lesson.title,
        lessonDate,
        lesson.location || '会場未設定',
        reservationType
      )

      emailData.to = user.email || ''
      await sendEmail(emailData)

      console.log('キャンセル待ち登録完了メールを送信しました:', {
        to: emailData.to,
        subject: emailData.subject
      })
    } catch (emailError) {
      console.error('キャンセル待ち登録完了メール送信エラー:', emailError)
      // メール送信失敗はキャンセル待ち登録成功に影響しない
    }

    return NextResponse.json(
      { message: 'Successfully joined waiting list' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error joining waiting list:', error)
    return NextResponse.json(
      { error: 'Failed to join waiting list' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'member') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lessonId = params.id
    const userId = session.user.id

    // レッスンとユーザー情報を取得（メール送信用）
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    await prisma.waitingList.delete({
      where: {
        lessonId_userId: {
          lessonId,
          userId
        }
      }
    })

    // キャンセル待ち解除メールを送信
    if (lesson && user && user.email) {
      try {
        const { sendEmail, generateWaitingListCancellationEmail } = await import('@/lib/notifications')
        
        // 日本時間でフォーマット
        const lessonDate = new Date(lesson.startTime).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Tokyo'
        })

        // 予約履歴を確認して予約タイプを判定
        const hasReservationHistory = await prisma.reservation.findFirst({
          where: {
            userId: userId,
            paymentStatus: { not: PaymentStatus.CANCELLED }
          }
        })

        const reservationType = (user.role === 'member' && !hasReservationHistory) 
          ? '体験レッスン' 
          : 'チケット利用'

        const emailData = generateWaitingListCancellationEmail(
          user.name || '',
          lesson.title,
          lessonDate,
          lesson.location || '会場未設定',
          reservationType
        )

        emailData.to = user.email
        await sendEmail(emailData)

        console.log('キャンセル待ち解除メールを送信しました:', {
          to: emailData.to,
          subject: emailData.subject
        })
      } catch (emailError) {
        console.error('キャンセル待ち解除メール送信エラー:', emailError)
        // メール送信失敗はキャンセル待ち解除成功に影響しない
      }
    }

    return NextResponse.json(
      { message: 'Successfully removed from waiting list' }
    )
  } catch (error) {
    console.error('Error removing from waiting list:', error)
    return NextResponse.json(
      { error: 'Failed to remove from waiting list' },
      { status: 500 }
    )
  }
}

