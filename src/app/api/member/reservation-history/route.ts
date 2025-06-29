import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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

    // 過去の予約数を確認
    const pastReservations = await prisma.reservation.count({
      where: {
        userId: userId,
        lesson: {
          startTime: {
            lt: new Date()
          }
        }
      }
    })

    return NextResponse.json({
      hasHistory: pastReservations > 0
    })
  } catch (error) {
    console.error('Reservation history fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation history' },
      { status: 500 }
    )
  }
}