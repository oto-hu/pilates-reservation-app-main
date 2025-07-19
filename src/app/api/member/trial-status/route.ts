import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ユーザーの体験レッスン予約履歴を取得
    // キャンセルされた予約は除外し、完了または予約中の体験レッスンのみをカウント
    const trialReservations = await prisma.reservation.findMany({
      where: {
        userId: session.user.id,
        reservationType: 'TRIAL',
        paymentStatus: {
          not: 'CANCELLED'
        }
      },
      include: {
        lesson: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 体験レッスンを予約済みかどうかを判定
    const hasTrialReservation = trialReservations.length > 0

    return NextResponse.json({
      hasTrialReservation,
      trialReservations: trialReservations.map(reservation => ({
        id: reservation.id,
        lessonTitle: reservation.lesson.title,
        paymentStatus: reservation.paymentStatus,
        createdAt: reservation.createdAt
      }))
    })

  } catch (error) {
    console.error('Error checking trial status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 