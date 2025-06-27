import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { ReservationType, PaymentMethod, PaymentStatus } from '@/lib/types'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const lessonId = params.id

    if (!session || session.user.role !== 'member') {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // レッスンの存在確認
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        reservations: {
          where: {
            paymentStatus: {
              not: PaymentStatus.CANCELLED
            }
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

    // レッスンが満席かチェック
    if (lesson.reservations.length < lesson.maxCapacity) {
      return NextResponse.json(
        { error: 'このレッスンは満席ではありません。直接予約してください' },
        { status: 400 }
      )
    }

    // レッスン開始時刻のチェック
    if (new Date(lesson.startTime) <= new Date()) {
      return NextResponse.json(
        { error: 'レッスンが既に開始または終了しているため、キャンセル待ちに登録できません' },
        { status: 400 }
      )
    }

    // 既にキャンセル待ちに登録済みかチェック
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
        { error: '既にこのレッスンのキャンセル待ちに登録されています' },
        { status: 400 }
      )
    }

    // 既に同じレッスンに予約済みかチェック
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        lessonId,
        userId,
        paymentStatus: {
          not: PaymentStatus.CANCELLED
        }
      }
    })

    if (existingReservation) {
      return NextResponse.json(
        { error: '既にこのレッスンに予約されています' },
        { status: 400 }
      )
    }

    // 利用可能なチケットがあるかチェック
    const availableTicket = await prisma.ticket.findFirst({
      where: {
        userId,
        lessonType: lesson.lessonType,
        remainingCount: { gt: 0 },
        expiresAt: { gt: new Date() }
      }
    })

    if (!availableTicket) {
      return NextResponse.json(
        { error: 'キャンセル待ちにはチケットが必要です。有効なチケットがありません' },
        { status: 400 }
      )
    }

    // キャンセル待ちに登録
    const waitingListEntry = await prisma.waitingList.create({
      data: {
        lessonId,
        userId
      },
      include: {
        lesson: {
          select: {
            title: true,
            startTime: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'キャンセル待ちに登録しました。空きが出た場合、自動的に予約が確定されます',
      waitingList: waitingListEntry
    })

  } catch (error) {
    console.error('Waiting list registration error:', error)
    return NextResponse.json(
      { error: 'キャンセル待ちの登録に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const lessonId = params.id

    if (!session || session.user.role !== 'member') {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // キャンセル待ちエントリの存在確認
    const waitingListEntry = await prisma.waitingList.findUnique({
      where: {
        lessonId_userId: {
          lessonId,
          userId
        }
      }
    })

    if (!waitingListEntry) {
      return NextResponse.json(
        { error: 'キャンセル待ちに登録されていません' },
        { status: 404 }
      )
    }

    // キャンセル待ちから削除
    await prisma.waitingList.delete({
      where: {
        id: waitingListEntry.id
      }
    })

    return NextResponse.json({
      message: 'キャンセル待ちから削除しました'
    })

  } catch (error) {
    console.error('Waiting list removal error:', error)
    return NextResponse.json(
      { error: 'キャンセル待ちの削除に失敗しました' },
      { status: 500 }
    )
  }
}

