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

    const users = await prisma.user.findMany({
      where: {
        role: 'member'
      },
      select: {
        id: true,
        name: true,
        furigana: true,
        birthDate: true,
        age: true,
        gender: true,
        postalCode: true,
        address: true,
        email: true,
        phone: true,
        emergencyContactName: true,
        emergencyContactFurigana: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        pilatesExperience: true,
        motivation: true,
        medicalHistory: true,
        goals: true,
        profileCompleted: true,
        trialDate: true,
        howDidYouKnowUs: true,
        referrerName: true,
        otherSource: true,
        transportation: true,
        hasPilatesExperience: true,
        hasExerciseHabit: true,
        hasInjuryHistory: true,
        injuryDetails: true,
        injuryTiming: true,
        trialMotivations: true,
        membershipStatus: true,
        assignedStaff: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}