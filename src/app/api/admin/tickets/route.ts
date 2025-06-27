import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { LessonType } from '@/lib/types'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, count, lessonType, ticketGroupId } = await request.json()

    if (!userId || !count || !ticketGroupId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 既存の同じカテゴリのチケットを探す
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        userId,
        ticketGroupId,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 3) // 有効期限は3ヶ月後

    if (existingTicket) {
      // 既存チケットがあれば枚数を追加
      await prisma.ticket.update({
        where: { id: existingTicket.id },
        data: {
          remainingCount: {
            increment: count,
          },
          expiresAt, // 有効期限も更新
        },
      })
    } else {
      // なければ新規作成
      await prisma.ticket.create({
        data: {
          userId,
          remainingCount: count,
          expiresAt,
          lessonType: 'SMALL_GROUP', // この値はもはや重要ではないが、スキーマ定義上必要
          ticketGroupId,
        },
      })
    }

    return NextResponse.json({ message: 'Tickets granted successfully' })
  } catch (error) {
    console.error('Failed to grant tickets:', error)
    return NextResponse.json({ error: 'Failed to grant tickets' }, { status: 500 })
  }
}