import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'member') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { consentAgreedAt: true }
    })

    return NextResponse.json({
      hasAgreed: !!user?.consentAgreedAt,
      agreedAt: user?.consentAgreedAt
    })
  } catch (error) {
    console.error('Consent status fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consent status' },
      { status: 500 }
    )
  }
}