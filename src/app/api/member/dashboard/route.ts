import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { LessonType } from '@/lib/types'

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

    // チケット情報を取得
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { expiresAt: 'asc' }
    })

    // レッスンタイプ名を追加
    const ticketsWithTypeName = tickets.map(ticket => ({
      ...ticket,
      lessonTypeName: ticket.lessonType === LessonType.SMALL_GROUP ? '少人数制ピラティス' : 'わいわいピラティス'
    }))

    // 今後の予約を取得
    const upcomingReservations = await prisma.reservation.findMany({
      where: {
        userId,
        lesson: {
          startTime: {
            gte: new Date()
          }
        }
      },
      include: {
        lesson: {
          select: {
            title: true,
            startTime: true
          }
        }
      },
      orderBy: {
        lesson: {
          startTime: 'asc'
        }
      }
    })

    return NextResponse.json({
      tickets: ticketsWithTypeName,
      upcomingReservations
    })
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}