import { NextRequest, NextResponse } from 'next/server'
import { processWaitingList } from '@/lib/waitingList'

export async function POST(request: NextRequest) {
  try {
    const { lessonId } = await request.json()
    
    if (!lessonId) {
      return NextResponse.json({ 
        error: 'lessonId is required' 
      }, { status: 400 })
    }

    // キャンセル待ち処理を実行
    const result = await processWaitingList(lessonId)
    
    if (result) {
      return NextResponse.json({ 
        message: 'キャンセル待ちから予約確定が完了しました',
        reservation: result.reservation,
        user: result.user
      })
    } else {
      return NextResponse.json({ 
        message: 'キャンセル待ちリストが空です',
        waitingListEmpty: true
      })
    }
    
  } catch (error) {
    console.error('キャンセル待ちテストエラー:', error)
    return NextResponse.json({ 
      error: 'キャンセル待ち処理エラー' 
    }, { status: 500 })
  }
} 