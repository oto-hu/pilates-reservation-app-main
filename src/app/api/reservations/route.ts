import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentMethod, PaymentStatus } from '@/lib/types'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lessonId, customerName, customerEmail, customerPhone, paymentMethod } = body

    // Check if lesson exists and has capacity
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        reservations: {
          where: {
            paymentStatus: {
              not: 'CANCELLED'
            }
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    if (lesson.reservations.length >= lesson.maxCapacity) {
      return NextResponse.json(
        { error: 'Lesson is full' },
        { status: 400 }
      )
    }

    // Check if lesson is in the past
    if (new Date(lesson.startTime) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot book past lessons' },
        { status: 400 }
      )
    }

    let reservation
    let checkoutUrl = null

    if (paymentMethod === PaymentMethod.PAY_NOW) {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: lesson.title,
                description: `${new Date(lesson.startTime).toLocaleDateString('ja-JP')} ${new Date(lesson.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}〜${new Date(lesson.endTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
              },
              unit_amount: 3000 // 3000円 = 30.00 JPY
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserve/complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${lessonId}`,
        metadata: {
          lessonId,
          customerName,
          customerEmail,
          customerPhone
        }
      })

      // Create reservation with Stripe session
      reservation = await prisma.reservation.create({
        data: {
          lessonId,
          customerName,
          customerEmail,
          customerPhone,
          paymentMethod: PaymentMethod.PAY_NOW,
          paymentStatus: PaymentStatus.PENDING,
          stripeSessionId: session.id
        },
        include: {
          lesson: true
        }
      })

      checkoutUrl = session.url

    } else {
      // Create reservation for studio payment
      reservation = await prisma.reservation.create({
        data: {
          lessonId,
          customerName,
          customerEmail,
          customerPhone,
          paymentMethod: PaymentMethod.PAY_AT_STUDIO,
          paymentStatus: PaymentStatus.PENDING
        },
        include: {
          lesson: true
        }
      })
    }

    return NextResponse.json({
      reservation,
      checkoutUrl
    })

  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}