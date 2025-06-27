import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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

    const reservationCount = await prisma.reservation.count({
      where: {
        userId
      }
    })

    return NextResponse.json({
      hasHistory: reservationCount > 0,
      count: reservationCount
    })
  } catch (error) {
    console.error('Reservation history fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation history' },
      { status: 500 }
    )
  }
}