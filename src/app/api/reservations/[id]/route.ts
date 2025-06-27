import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const reservationId = params.id

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        lesson: {
          select: {
            title: true,
            startTime: true,
            endTime: true,
            instructorName: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // 権限チェック（会員は自分の予約のみ、管理者は全て）
    if (session?.user?.role === 'member' && reservation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Reservation fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    )
  }
}