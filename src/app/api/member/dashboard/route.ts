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

    // ユーザーの予約情報を取得
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: userId
      },
      include: {
        lesson: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // ユーザーのチケット情報を取得
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        expiresAt: 'asc'
      }
    })

    // キャンセル待ち情報を取得
    const waitingList = await prisma.waitingList.findMany({
      where: {
        userId: userId
      },
      include: {
        lesson: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      reservations,
      tickets,
      waitingList
    })
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}