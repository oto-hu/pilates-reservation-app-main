import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { ReservationType, PaymentMethod, PaymentStatus } from '@/lib/types'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'member') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lessonId = params.id
    const userId = session.user.id

    // レッスンの存在確認
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // 既にキャンセル待ちに登録されているかチェック
    const existingWaitingList = await prisma.waitingList.findUnique({
      where: {
        lessonId_userId: {
          lessonId,
          userId
        }
      }
    })

    if (existingWaitingList) {
      return NextResponse.json(
        { error: 'Already on waiting list' },
        { status: 400 }
      )
    }

    // キャンセル待ちに登録
    await prisma.waitingList.create({
      data: {
        lessonId,
        userId
      }
    })

    return NextResponse.json(
      { message: 'Successfully joined waiting list' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error joining waiting list:', error)
    return NextResponse.json(
      { error: 'Failed to join waiting list' },
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

    if (!session || session.user.role !== 'member') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lessonId = params.id
    const userId = session.user.id

    await prisma.waitingList.delete({
      where: {
        lessonId_userId: {
          lessonId,
          userId
        }
      }
    })

    return NextResponse.json(
      { message: 'Successfully removed from waiting list' }
    )
  } catch (error) {
    console.error('Error removing from waiting list:', error)
    return NextResponse.json(
      { error: 'Failed to remove from waiting list' },
      { status: 500 }
    )
  }
}

