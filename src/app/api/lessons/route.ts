import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')

    const where: any = {}
    if (start) {
      where.startTime = {
        gte: new Date(start)
      }
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        reservations: true,
        waitingList: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    console.log('Fetched lessons:', lessons.length)
    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    // エラーが発生しても空配列を返す
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, startTime, endTime, maxCapacity, instructorName, location, price, ticketGroupId } = body

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxCapacity,
        instructorName,
        location,
        price,
        ticketGroupId: ticketGroupId || null,
        lessonType: 'SMALL_GROUP' // デフォルト値
      }
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    )
  }
}