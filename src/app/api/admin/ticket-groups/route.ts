import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET: すべてのチケットカテゴリを取得
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ticketGroups = await prisma.ticketGroup.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(ticketGroups)
  } catch (error) {
    console.error('Failed to fetch ticket groups:', error)
    return NextResponse.json({ error: 'Failed to fetch ticket groups' }, { status: 500 })
  }
}

// POST: 新しいチケットカテゴリを作成
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const newGroup = await prisma.ticketGroup.create({
      data: { name },
    })
    return NextResponse.json(newGroup, { status: 201 })
  } catch (error) {
    console.error('Failed to create ticket group:', error)
    return NextResponse.json({ error: 'Failed to create ticket group' }, { status: 500 })
  }
} 