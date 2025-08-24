import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { ReservationType, PaymentStatus } from '@/lib/types'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'member') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    console.log('Checking reservation history for user:', userId);

    // 体験レッスンの予約数を確認（キャンセルされたものは除外）
    // 完了済みと予約済み両方を含める
    const trialReservations = await prisma.reservation.count({
      where: {
        userId: userId,
        reservationType: ReservationType.TRIAL,
        // キャンセルされた予約は除外
        paymentStatus: {
          not: PaymentStatus.CANCELLED
        }
      }
    })

    console.log('Trial reservations count:', trialReservations);

    // デバッグ用：すべての体験レッスン予約を取得
    const allTrialReservations = await prisma.reservation.findMany({
      where: {
        userId: userId,
        reservationType: ReservationType.TRIAL,
      },
      include: {
        lesson: true
      }
    })

    console.log('All trial reservations for user:', allTrialReservations.map((r: any) => ({
      id: r.id,
      lessonStartTime: r.lesson.startTime,
      paymentStatus: r.paymentStatus,
      isPast: new Date(r.lesson.startTime) < new Date(),
      isCancelled: r.paymentStatus === PaymentStatus.CANCELLED
    })));

    const result = {
      hasHistory: trialReservations > 0
    }

    console.log('Reservation history result:', result);

    return NextResponse.json(result)
  } catch (error) {
    console.error('Reservation history fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation history' },
      { status: 500 }
    )
  }
}