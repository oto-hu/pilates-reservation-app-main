import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { PaymentStatus, ReservationType } from '@/lib/types'
import { processWaitingList } from '@/lib/waitingList'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const reservationId = params.id
    const { forceCancel } = await request.json()

    // 予約の存在確認
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        lesson: true,
        user: true
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック（会員は自分の予約のみ、管理者は全て）
    if (session?.user?.role === 'member' && reservation.userId !== session.user.id) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    // 既にキャンセル済みかチェック
    if (reservation.paymentStatus === PaymentStatus.CANCELLED) {
      return NextResponse.json(
        { error: 'この予約は既にキャンセルされています' },
        { status: 400 }
      )
    }

    // レッスン開始時刻の確認
    const lessonStartTime = new Date(reservation.lesson.startTime)
    const now = new Date()
    
    // レッスンが既に終了している場合はキャンセル不可
    if (lessonStartTime <= now) {
      return NextResponse.json(
        { error: 'レッスンが既に開始または終了しているため、キャンセルできません' },
        { status: 400 }
      )
    }

    // キャンセル期限の計算（前日21:00）
    const cancelDeadline = new Date(lessonStartTime)
    cancelDeadline.setDate(cancelDeadline.getDate() - 1)
    cancelDeadline.setHours(21, 0, 0, 0)

    const isWithinFreeCancel = now <= cancelDeadline
    const isLateCancellation = !isWithinFreeCancel

    // 期限後キャンセルで強制実行フラグがない場合は警告を返す
    if (isLateCancellation && !forceCancel && reservation.reservationType === ReservationType.TICKET) {
      return NextResponse.json({
        requiresConfirmation: true,
        message: 'キャンセル期限（前日21:00）を過ぎています。キャンセルするとチケットが1枚消費されますが、よろしいですか？',
        deadline: cancelDeadline.toISOString(),
        isLateCancellation: true
      })
    }

    // キャンセル処理をトランザクション内で実行
    const result = await prisma.$transaction(async (tx) => {
      // 予約をキャンセル状態に更新
      const cancelledReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
          updatedAt: new Date()
        },
        include: {
          lesson: true,
          user: true
        }
      })

      // チケット利用予約で無料キャンセル期限内の場合、チケットを返還
      if (reservation.reservationType === ReservationType.TICKET && 
          reservation.userId && 
          isWithinFreeCancel) {
        
        // 該当するチケットを探して残数を増やす
        const ticket = await tx.ticket.findFirst({
          where: {
            userId: reservation.userId,
            lessonType: reservation.lesson.lessonType
          },
          orderBy: {
            expiresAt: 'desc' // 最も期限の長いチケットに返還
          }
        })

        if (ticket) {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              remainingCount: { increment: 1 }
            }
          })
        }
      }

      return {
        reservation: cancelledReservation,
        ticketReturned: reservation.reservationType === ReservationType.TICKET && isWithinFreeCancel,
        isLateCancellation
      }
    })

    // キャンセル待ちリストの処理（トランザクション外で実行）
    let waitingListResult = null
    try {
      waitingListResult = await processWaitingList(reservation.lessonId)
    } catch (error) {
      console.error('Waiting list processing error:', error)
      // キャンセル待ち処理が失敗してもキャンセル自体は成功扱い
    }

    // レスポンスメッセージの生成
    let message = 'キャンセルが完了しました'
    if (reservation.reservationType === ReservationType.TICKET) {
      if (isWithinFreeCancel) {
        message += '。チケットが返還されました'
      } else {
        message += '。期限後キャンセルのため、チケット1枚が消費されました'
      }
    }

    if (waitingListResult) {
      message += '。キャンセル待ちの方の予約が自動確定されました'
    }

    return NextResponse.json({
      message,
      reservation: result.reservation,
      ticketReturned: result.ticketReturned,
      isLateCancellation: result.isLateCancellation,
      waitingListProcessed: !!waitingListResult
    })

  } catch (error) {
    console.error('Cancellation error:', error)
    return NextResponse.json(
      { error: 'キャンセル処理に失敗しました' },
      { status: 500 }
    )
  }
}