import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 期間の取得（デフォルトは過去30日）
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // ユーザー統計（期間内登録者）
    const users = await prisma.user.findMany({
      where: {
        role: 'member',
        createdAt: { gte: startDate }
      },
      include: {
        reservations: {
          include: {
            lesson: true
          }
        }
      }
    })

    // 全会員数（期間制限なし）
    const totalMembers = await prisma.user.count({
      where: { role: 'member' }
    })

    // 男女比
    const genderStats = users.reduce((acc, user) => {
      const gender = user.gender || '未設定'
      acc[gender] = (acc[gender] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 年代別統計
    const ageStats = users.reduce((acc, user) => {
      if (user.age) {
        const ageGroup = Math.floor(user.age / 10) * 10
        const ageRange = `${ageGroup}代`
        acc[ageRange] = (acc[ageRange] || 0) + 1
      } else {
        acc['未設定'] = (acc['未設定'] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // リピーター分析（2回以上予約したユーザー）
    const repeatUsers = users.filter(user => user.reservations.length >= 2)
    const firstTimeUsers = users.filter(user => user.reservations.length === 1)
    const noReservationUsers = users.filter(user => user.reservations.length === 0)

    // 予約統計
    const allReservations = await prisma.reservation.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        lesson: true,
        user: true
      }
    })

    // 予約タイプ別統計
    const reservationTypeStats = allReservations.reduce((acc, reservation) => {
      const type = reservation.reservationType
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 月別予約数
    const monthlyReservations = allReservations.reduce((acc, reservation) => {
      const month = new Date(reservation.createdAt).toISOString().slice(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // レッスン別人気度
    const lessonPopularity = allReservations.reduce((acc, reservation) => {
      const lessonTitle = reservation.lesson.title
      acc[lessonTitle] = (acc[lessonTitle] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 平均年齢
    const usersWithAge = users.filter(user => user.age)
    const averageAge = usersWithAge.length > 0 
      ? Math.round(usersWithAge.reduce((sum, user) => sum + user.age!, 0) / usersWithAge.length)
      : 0

    // 新規登録者数（期間別）
    const newUsersByMonth = users.reduce((acc, user) => {
      const month = new Date(user.createdAt).toISOString().slice(0, 7)
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // キャンセル率
    const cancelledReservations = allReservations.filter(r => r.paymentStatus === 'CANCELLED')
    const cancellationRate = allReservations.length > 0 
      ? Math.round((cancelledReservations.length / allReservations.length) * 100)
      : 0

    return NextResponse.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      userStats: {
        total: totalMembers, // 全会員数（期間制限なし）
        newUsers: users.length, // 期間内の新規登録者数
        genderStats,
        ageStats,
        averageAge,
        repeatUsers: repeatUsers.length,
        firstTimeUsers: firstTimeUsers.length,
        noReservationUsers: noReservationUsers.length,
        repeatRate: users.length > 0 ? Math.round((repeatUsers.length / users.length) * 100) : 0
      },
      reservationStats: {
        total: allReservations.length,
        typeStats: reservationTypeStats,
        monthlyStats: monthlyReservations,
        lessonPopularity,
        cancellationRate,
        cancelledCount: cancelledReservations.length
      },
      newUsersByMonth
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
} 