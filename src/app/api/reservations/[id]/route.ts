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
    console.log('Reservation access attempt:', {
      reservationId: params.id,
      hasSession: !!session,
      userRole: session?.user?.role,
      userId: session?.user?.id
    })

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        lesson: true,
        user: true
      }
    })

    if (!reservation) {
      console.log('Reservation not found:', params.id)
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    console.log('Reservation found:', {
      reservationId: reservation.id,
      reservationUserId: reservation.userId,
      sessionUserId: session?.user?.id,
      isAdmin: session?.user?.role === 'admin',
      isOwner: reservation.userId === session?.user?.id
    })

    // ★ 新規会員登録直後の予約確認は一時的にセッションチェックを緩和
    // ただし、セッションがある場合は従来通りの制限
    if (session) {
      if (session.user.role !== 'admin' && reservation.userId !== session.user.id) {
        // 新規会員登録直後の予約確認の場合は、予約のユーザーIDとセッションのユーザーIDが異なる場合がある
        // この場合、予約のユーザーが新規作成されたユーザーか確認する
        const reservationUser = await prisma.user.findUnique({
          where: { id: reservation.userId },
          select: { createdAt: true, email: true }
        })
        
        // 予約ユーザーが1時間以内に作成された新規ユーザーかチェック
        const isRecentUser = reservationUser && 
          new Date(reservationUser.createdAt) > new Date(Date.now() - 60 * 60 * 1000)
        
        if (!isRecentUser) {
          console.log('Access denied - 403 Forbidden:', {
            userRole: session.user.role,
            reservationUserId: reservation.userId,
            sessionUserId: session.user.id
          })
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          )
        }
      }
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    )
  }
}