import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(
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

    const body = await request.json()
    const { adjustment } = body

    if (typeof adjustment !== 'number') {
      return NextResponse.json(
        { error: 'Invalid adjustment value' },
        { status: 400 }
      )
    }

    // 現在のチケット情報を取得
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // 新しい残数を計算（負の値にならないように制限）
    const newRemainingCount = Math.max(0, ticket.remainingCount + adjustment)

    // チケット残数を更新
    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        remainingCount: newRemainingCount
      }
    })

    return NextResponse.json({
      message: 'Ticket adjusted successfully',
      ticket: updatedTicket,
      adjustment: adjustment,
      previousCount: ticket.remainingCount,
      newCount: newRemainingCount
    })
  } catch (error) {
    console.error('Ticket adjustment error:', error)
    return NextResponse.json(
      { error: 'Failed to adjust ticket' },
      { status: 500 }
    )
  }
}