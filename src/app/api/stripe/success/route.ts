import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Find the reservation with this Stripe session
    const reservation = await prisma.reservation.findFirst({
      where: {
        stripeSessionId: sessionId
      },
      include: {
        lesson: true
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // Update the payment status if payment was successful
    if (session.payment_status === 'paid') {
      const updatedReservation = await prisma.reservation.update({
        where: {
          id: reservation.id
        },
        data: {
          paymentStatus: 'PAID'
        },
        include: {
          lesson: true
        }
      })

      return NextResponse.json({
        reservation: updatedReservation
      })
    }

    return NextResponse.json({
      reservation
    })

  } catch (error) {
    console.error('Error handling Stripe success:', error)
    return NextResponse.json(
      { error: 'Failed to process payment success' },
      { status: 500 }
    )
  }
}