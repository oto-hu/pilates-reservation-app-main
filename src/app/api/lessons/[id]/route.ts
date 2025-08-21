import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS request handler for CORS preflight
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

// 1件のレッスンを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        reservations: true,
        waitingList: true
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

// 1件のレッスンを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startTime, endTime, maxCapacity, instructorName, location, price, ticketGroupId } = body

    const lesson = await prisma.lesson.update({
      where: { id: params.id },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxCapacity,
        instructorName,
        location,
        price,
        ticketGroupId: ticketGroupId || null
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

// 1件のレッスンを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // レッスンの存在確認
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        reservations: {
          where: {
            paymentStatus: { not: 'CANCELLED' }
          }
        },
        waitingList: true
      }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'レッスンが見つかりません' },
        { status: 404 }
      )
    }

    // 予約が存在する場合は削除を拒否
    if (lesson.reservations.length > 0) {
      return NextResponse.json(
        { 
          error: 'このレッスンには予約が入っているため削除できません',
          details: `${lesson.reservations.length}件の予約があります。先に予約をキャンセルしてから削除してください。`
        },
        { status: 400 }
      )
    }

    // キャンセル待ちが存在する場合は削除を拒否
    if (lesson.waitingList.length > 0) {
      return NextResponse.json(
        { 
          error: 'このレッスンにはキャンセル待ちが登録されているため削除できません',
          details: `${lesson.waitingList.length}件のキャンセル待ちがあります。先にキャンセル待ちを解除してから削除してください。`
        },
        { status: 400 }
      )
    }

    // 予約・キャンセル待ちがない場合のみ削除実行
    await prisma.lesson.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'レッスンを削除しました',
      deletedLesson: {
        id: lesson.id,
        title: lesson.title
      }
    })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json(
      { error: 'レッスンの削除に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const body = await request.json()
    const { title, description, startTime, endTime, maxCapacity, instructorName, lessonType, price } = body

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxCapacity: maxCapacity || 5,
        instructorName,
        lessonType: lessonType || 'SMALL_GROUP',
        price
      }
    })

    return new NextResponse(JSON.stringify(lesson), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error creating lesson:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to create lesson' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}