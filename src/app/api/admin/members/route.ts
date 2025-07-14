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

    // 会員のみを取得（管理者は除く）
    const members = await prisma.user.findMany({
      where: {
        role: 'member'
      },
      include: {
        tickets: {
          include: {
            ticketGroup: true
          },
          orderBy: {
            expiresAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // パスワードを除外し、チケットにレッスンタイプ名を追加
    const membersWithoutPassword = members.map(member => {
      const { password, ...memberWithoutPassword } = member
      return {
        ...memberWithoutPassword,
        tickets: member.tickets.map(ticket => ({
          ...ticket,
          lessonTypeName: ticket.ticketGroup?.name || (ticket.lessonType === LessonType.SMALL_GROUP ? '少人数制ピラティス' : 'わいわいピラティス')
        }))
      }
    })

    return NextResponse.json(membersWithoutPassword)
  } catch (error) {
    console.error('Members fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}