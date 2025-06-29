import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

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

    const template = await prisma.lessonTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching lesson template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson template' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const {
      name,
      templateDescription,
      title,
      lessonDescription,
      startTime,
      endTime,
      maxCapacity,
      lessonType,
      price,
      instructorName
    } = body

    const template = await prisma.lessonTemplate.update({
      where: { id: params.id },
      data: {
        name,
        templateDescription,
        title,
        lessonDescription,
        startTime,
        endTime,
        maxCapacity,
        lessonType,
        price,
        instructorName
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating lesson template:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.lessonTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting lesson template:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson template' },
      { status: 500 }
    )
  }
} 