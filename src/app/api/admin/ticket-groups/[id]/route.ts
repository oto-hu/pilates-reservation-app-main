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

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!ticketGroup) {
      return NextResponse.json(
        { error: 'Ticket group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(ticketGroup)
  } catch (error) {
    console.error('Error fetching ticket group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket group' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ticketGroup = await prisma.ticketGroup.update({
      where: { id: params.id },
      data: { name }
    })

    return NextResponse.json(ticketGroup)
  } catch (error) {
    console.error('Error updating ticket group:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket group' },
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

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.ticketGroup.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Ticket group deleted successfully' })
  } catch (error) {
    console.error('Error deleting ticket group:', error)
    return NextResponse.json(
      { error: 'Failed to delete ticket group' },
      { status: 500 }
    )
  }
} 