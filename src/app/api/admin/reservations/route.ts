import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { LessonType } from '@/lib/types'
import { PaymentStatus, ReservationType } from '@/lib/types'

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

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (id) {
      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: {
          lesson: true,
          user: true,
        },
      })
      if (!reservation) {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
      }
      return NextResponse.json(reservation)
    }

    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')

    const where: any = {}
    
    if (startDate || endDate) {
      where.lesson = {
        startTime: {}
      }
      if (startDate) {
        where.lesson.startTime.gte = new Date(startDate)
      }
      if (endDate) {
        where.lesson.startTime.lte = new Date(endDate)
      }
    }

    if (status && status !== 'all') {
      where.paymentStatus = status
    }

    if (type && type !== 'all') {
      where.reservationType = type
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        lesson: {
          select: {
            title: true,
            startTime: true,
            endTime: true,
            lessonType: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        lesson: {
          startTime: 'desc'
        }
      }
    })

    const reservationsWithTypeName = reservations.map(reservation => ({
      ...reservation,
      lesson: {
        ...reservation.lesson,
        lessonType: reservation.lesson.lessonType === LessonType.SMALL_GROUP ? '少人数制ピラティス' : 'わいわいピラティス'
      }
    }))

    return NextResponse.json(reservationsWithTypeName)
  } catch (error) {
    console.error('Admin reservations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 })
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { lesson: true },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (reservation.paymentStatus === PaymentStatus.CANCELLED) {
      return NextResponse.json({ error: 'This reservation is already cancelled' }, { status: 400 })
    }

    // Admin cancellation logic
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: { paymentStatus: PaymentStatus.CANCELLED },
      })

      if (reservation.reservationType === ReservationType.TICKET && reservation.userId) {
        const ticket = await tx.ticket.findFirst({
          where: {
            userId: reservation.userId,
            lessonType: reservation.lesson.lessonType,
          },
          orderBy: { expiresAt: 'desc' },
        })

        if (ticket) {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: { remainingCount: { increment: 1 } },
          })
        }
      }
    })
    
    // Process waiting list
    // This can be done outside the transaction
    try {
      const { processWaitingList } = await import('@/lib/waitingList')
      await processWaitingList(reservation.lessonId)
    } catch (error) {
       console.error('Waiting list processing failed during admin cancellation:', error)
       // Don't let waiting list failure block the cancellation success response
    }

    return NextResponse.json({ message: 'Reservation cancelled successfully by admin' })
  } catch (error) {
    console.error('Admin reservation cancellation error:', error)
    return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 })
  }
}