import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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

    // 全会員数
    const totalMembers = await prisma.user.count({
      where: { role: 'member' }
    })

    // プロフィール完了率
    const completedProfiles = await prisma.user.count({
      where: { 
        role: 'member',
        profileCompleted: true
      }
    })

    // 年齢分布
    const ageDistribution = await prisma.user.groupBy({
      by: ['age'],
      where: { 
        role: 'member',
        age: { not: null }
      },
      _count: { age: true },
      orderBy: { age: 'asc' }
    })

    // 性別分布
    const genderDistribution = await prisma.user.groupBy({
      by: ['gender'],
      where: { 
        role: 'member',
        gender: { not: null }
      },
      _count: { gender: true }
    })

    // ピラティス経験分布
    const experienceDistribution = await prisma.user.groupBy({
      by: ['pilatesExperience'],
      where: { 
        role: 'member',
        pilatesExperience: { not: null }
      },
      _count: { pilatesExperience: true }
    })

    // 来店きっかけ分布
    const motivationDistribution = await prisma.user.groupBy({
      by: ['motivation'],
      where: { 
        role: 'member',
        motivation: { not: null }
      },
      _count: { motivation: true }
    })

    // 住所分布（市区町村レベル）
    const addressDistribution = await prisma.user.findMany({
      where: { 
        role: 'member',
        address: { not: null }
      },
      select: { address: true }
    })

    // 住所データを市区町村レベルで集計
    const addressCounts: { [key: string]: number } = {}
    addressDistribution.forEach(user => {
      if (user.address) {
        // 住所から市区町村を抽出（簡易版）
        const match = user.address.match(/(.+?[市区町村])/)
        const city = match ? match[1] : user.address.split(' ')[0]
        addressCounts[city] = (addressCounts[city] || 0) + 1
      }
    })

    const addressData = Object.entries(addressCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // 上位10位まで

    // 月別登録数（過去12ヶ月）
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlyRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        role: 'member',
        createdAt: { gte: twelveMonthsAgo }
      },
      _count: { createdAt: true }
    })

    // 月別データを整形
    const monthlyData: { [key: string]: number } = {}
    monthlyRegistrations.forEach(item => {
      const monthKey = item.createdAt.toISOString().slice(0, 7) // YYYY-MM format
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item._count.createdAt
    })

    // 年齢層別分布（10歳刻み）
    const ageGroupData: { [key: string]: number } = {}
    ageDistribution.forEach(item => {
      if (item.age) {
        const ageGroup = `${Math.floor(item.age / 10) * 10}代`
        ageGroupData[ageGroup] = (ageGroupData[ageGroup] || 0) + item._count.age
      }
    })

    const ageGroups = Object.entries(ageGroupData)
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => a.group.localeCompare(b.group))

    return NextResponse.json({
      summary: {
        totalMembers,
        completedProfiles,
        completionRate: totalMembers > 0 ? Math.round((completedProfiles / totalMembers) * 100) : 0
      },
      genderDistribution: genderDistribution.map(item => ({
        gender: item.gender,
        count: item._count.gender
      })),
      ageGroups,
      experienceDistribution: experienceDistribution.map(item => ({
        experience: item.pilatesExperience,
        count: item._count.pilatesExperience
      })),
      motivationDistribution: motivationDistribution.map(item => ({
        motivation: item.motivation,
        count: item._count.motivation
      })),
      addressDistribution: addressData,
      monthlyRegistrations: Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
    })
  } catch (error) {
    console.error('Member analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member analytics' },
      { status: 500 }
    )
  }
}