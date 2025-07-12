import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

// GET: すべてのチケットカテゴリを取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const ticketGroups = await prisma.ticketGroup.findMany({
      include: {
        tickets: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(ticketGroups)
  } catch (error) {
    console.error('Admin ticket groups fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket groups' },
      { status: 500 }
    )
  }
}

// POST: 新しいチケットカテゴリを作成
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
    const { name } = body

    const ticketGroup = await prisma.ticketGroup.create({
      data: {
        name
      }
    })

    return NextResponse.json(ticketGroup, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket group:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket group' },
      { status: 500 }
    )
  }
} 