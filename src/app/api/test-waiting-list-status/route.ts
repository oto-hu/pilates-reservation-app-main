import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    
    if (!lessonId) {
      return NextResponse.json({ 
        error: 'lessonId is required' 
      }, { status: 400 })
    }

    // キャンセル待ちリストを取得
    const waitingList = await prisma.waitingList.findMany({
      where: { lessonId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        lesson: {
          select: {
            id: true,
            title: true,
            startTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // レッスン情報も取得
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        reservations: {
          where: {
            paymentStatus: {
              not: 'CANCELLED'
            }
          }
        }
      }
    })

    return NextResponse.json({
      lessonId,
      waitingList,
      lesson,
      waitingListCount: waitingList.length,
      reservationCount: lesson?.reservations.length || 0,
      maxCapacity: lesson?.maxCapacity || 0
    })
    
  } catch (error) {
    console.error('キャンセル待ち状態確認エラー:', error)
    return NextResponse.json({ 
      error: 'キャンセル待ち状態確認エラー' 
    }, { status: 500 })
  }
} 