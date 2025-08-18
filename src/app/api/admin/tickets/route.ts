import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { LessonType } from '@/lib/types'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tickets = await prisma.ticket.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // レッスンタイプ名を追加
    const ticketsWithTypeName = tickets.map(ticket => ({
      ...ticket,
      lessonTypeName: ticket.lessonType === LessonType.SMALL_GROUP ? '少人数制ピラティス' : 'わいわいピラティス'
    }))

    return NextResponse.json(ticketsWithTypeName)
  } catch (error) {
    console.error('Admin tickets fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, ticketGroupId, count } = body

    console.log('Received data:', { userId, ticketGroupId, count })

    // 必須フィールドの検証
    if (!userId || !ticketGroupId || !count) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, ticketGroupId, count' },
        { status: 400 }
      )
    }

    // チケットグループを確認
    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id: ticketGroupId }
    })

    if (!ticketGroup) {
      return NextResponse.json(
        { error: 'Invalid ticket group' },
        { status: 400 }
      )
    }

    // チケットグループ名からレッスンタイプを判定
    let lessonType = LessonType.SMALL_GROUP // デフォルト
    if (ticketGroup.name.includes('わいわい')) {
      lessonType = LessonType.LARGE_GROUP
    }

    // 既存の同じチケットグループのチケットを確認
    const existingTickets = await prisma.ticket.findMany({
      where: {
        userId,
        ticketGroupId
      }
    })

    // 有効期限を5ヶ月後に設定
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 5)

    let totalRemainingCount = parseInt(count)
    
    // 既存チケットがある場合は統合
    if (existingTickets.length > 0) {
      // 既存チケットの残枚数を合計
      const existingTotal = existingTickets.reduce((sum, ticket) => sum + ticket.remainingCount, 0)
      totalRemainingCount += existingTotal

      console.log('Consolidating tickets:', {
        existingTickets: existingTickets.length,
        existingTotal,
        newCount: parseInt(count),
        totalCount: totalRemainingCount
      })

      // 既存チケットを削除
      await prisma.ticket.deleteMany({
        where: {
          userId,
          ticketGroupId
        }
      })
    }

    console.log('Creating consolidated ticket with:', {
      userId,
      lessonType,
      remainingCount: totalRemainingCount,
      expiresAt,
      ticketGroupId
    })

    const ticket = await prisma.ticket.create({
      data: {
        userId,
        name: ticketGroup.name, // チケットグループ名をチケット名として保存
        lessonType,
        remainingCount: totalRemainingCount,
        expiresAt,
        ticketGroupId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}