import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { LessonType } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const member = await prisma.user.findUnique({
      where: {
        id: params.id,
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
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // パスワードを除外し、チケットにレッスンタイプ名を追加
    const { password, ...memberWithoutPassword } = member
    const memberWithTicketNames = {
      ...memberWithoutPassword,
      tickets: member.tickets.map(ticket => ({
        ...ticket,
        lessonTypeName: ticket.ticketGroup?.name || (ticket.lessonType === LessonType.SMALL_GROUP ? '少人数制ピラティス' : 'わいわいピラティス')
      }))
    }

    return NextResponse.json(memberWithTicketNames)
  } catch (error) {
    console.error('Member fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    )
  }
}