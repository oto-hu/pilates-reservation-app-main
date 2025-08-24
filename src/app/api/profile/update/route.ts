import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      pilatesExperience,
      motivation,
      medicalHistory,
      goals,
      // 追加項目
      howDidYouKnowUs,
      referrerName,
      otherSource,
      transportation,
      hasPilatesExperience,
      hasExerciseHabit,
      hasInjuryHistory,
      injuryDetails,
      injuryTiming,
      trialMotivations
    } = body

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        pilatesExperience,
        motivation,
        medicalHistory,
        goals,
        // 追加項目
        howDidYouKnowUs,
        referrerName,
        otherSource,
        transportation,
        hasPilatesExperience,
        hasExerciseHabit,
        hasInjuryHistory,
        injuryDetails,
        injuryTiming,
        trialMotivations,
        profileCompleted: true
      }
    })

    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        pilatesExperience: true,
        motivation: true,
        medicalHistory: true,
        goals: true,
        profileCompleted: true,
        // 追加項目
        howDidYouKnowUs: true,
        referrerName: true,
        otherSource: true,
        transportation: true,
        hasPilatesExperience: true,
        hasExerciseHabit: true,
        hasInjuryHistory: true,
        injuryDetails: true,
        injuryTiming: true,
        trialMotivations: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}