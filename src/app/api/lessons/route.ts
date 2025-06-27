import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    let where = {}
    
    if (startDate && endDate) {
      where = {
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        reservations: {
          where: {
            paymentStatus: {
              not: 'CANCELLED'
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      maxCapacity, 
      instructorName, 
      price,
      ticketGroupId 
    } = body

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxCapacity,
        instructorName,
        price,
        lessonType: 'SMALL_GROUP',
        ticketGroupId,
      },
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    )
  }
}