import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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

    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
        membershipStatus: true,
        assignedStaff: true,
        createdAt: true,
        updatedAt: true
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
    console.error('User fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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
    
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: body.name,
        furigana: body.furigana,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        age: body.age,
        gender: body.gender,
        postalCode: body.postalCode,
        address: body.address,
        email: body.email,
        phone: body.phone,
        emergencyContactName: body.emergencyContactName,
        emergencyContactFurigana: body.emergencyContactFurigana,
        emergencyContactPhone: body.emergencyContactPhone,
        emergencyContactRelation: body.emergencyContactRelation,
        pilatesExperience: body.pilatesExperience,
        motivation: body.motivation,
        medicalHistory: body.medicalHistory,
        goals: body.goals,
        membershipStatus: body.membershipStatus,
        assignedStaff: body.assignedStaff
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
        membershipStatus: true,
        assignedStaff: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
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

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}