import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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

    const templates = await prisma.lessonTemplate.findMany({
      where: {
        createdBy: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching lesson templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const template = await prisma.lessonTemplate.create({
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
        instructorName,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson template:', error)
    return NextResponse.json(
      { error: 'Failed to create lesson template' },
      { status: 500 }
    )
  }
} 