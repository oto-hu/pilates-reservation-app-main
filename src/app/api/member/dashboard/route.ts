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

    // 今後の予約情報を取得（レッスン終了時間までを今後の予約として扱う）
    const now = new Date()
    
    const upcomingReservations = await prisma.reservation.findMany({
      where: {
        userId: userId,
        lesson: {
          endTime: {
            gte: now // レッスン終了時間が現在時刻以降
          }
        }
      },
      include: {
        lesson: {
          select: {
            title: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        lesson: {
          startTime: 'asc'
        }
      }
    })

    // ユーザーのチケット情報を取得（lessonTypeNameを追加）
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        expiresAt: 'asc'
      }
    })

    // チケットにlessonTypeNameを追加（ticket.nameを優先、なければデフォルト名）
    const ticketsWithTypeName = tickets.map(ticket => ({
      ...ticket,
      lessonTypeName: ticket.name || (ticket.lessonType === 'SMALL_GROUP' ? '少人数制ピラティス' : 'わいわいピラティス')
    }))

    console.log('Debug - ユーザーID:', userId)
    console.log('Debug - 現在時刻:', now)
    console.log('Debug - 今後の予約数:', upcomingReservations.length)

    return NextResponse.json({
      upcomingReservations,
      tickets: ticketsWithTypeName
    })
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}