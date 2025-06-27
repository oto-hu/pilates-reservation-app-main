import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface Params {
  params: { id: string }
}

// PUT: チケットカテゴリを更新
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const updatedGroup = await prisma.ticketGroup.update({
      where: { id: params.id },
      data: { name },
    })
    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error(`Failed to update ticket group ${params.id}:`, error)
    return NextResponse.json({ error: 'Failed to update ticket group' }, { status: 500 })
  }
}

// DELETE: チケットカテゴリを削除
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 関連するTicketとLessonのticketGroupIdをnullにする
    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { ticketGroupId: params.id },
        data: { ticketGroupId: null },
      }),
      prisma.lesson.updateMany({
        where: { ticketGroupId: params.id },
        data: { ticketGroupId: null },
      }),
      prisma.ticketGroup.delete({
        where: { id: params.id },
      })
    ])
    
    return NextResponse.json({ message: 'Ticket group deleted successfully' })
  } catch (error) {
    console.error(`Failed to delete ticket group ${params.id}:`, error)
    return NextResponse.json({ error: 'Failed to delete ticket group' }, { status: 500 })
  }
} 