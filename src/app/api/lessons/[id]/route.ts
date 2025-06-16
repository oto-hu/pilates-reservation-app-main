import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: params.id
      },
      include: {
        reservations: {
          where: {
            paymentStatus: {
              not: 'CANCELLED'
            }
          },
          orderBy: {
            createdAt: 'asc'
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

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, startTime, endTime, maxCapacity } = body

    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: params.id },
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

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Check if reducing capacity below current reservations
    if (maxCapacity < existingLesson.reservations.length) {
      return NextResponse.json(
        { error: `Cannot reduce capacity below current reservations (${existingLesson.reservations.length})` },
        { status: 400 }
      )
    }

    const lesson = await prisma.lesson.update({
      where: {
        id: params.id
      },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxCapacity
      },
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

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if lesson exists and has reservations
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: params.id },
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

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    if (existingLesson.reservations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete lesson with existing reservations' },
        { status: 400 }
      )
    }

    await prisma.lesson.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    )
  }
}