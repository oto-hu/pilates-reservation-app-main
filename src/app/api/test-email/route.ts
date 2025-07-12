import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, generateCancellationConfirmationEmail } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    // テスト用のキャンセルメールを生成
    const emailData = generateCancellationConfirmationEmail(
      'テスト太郎',
      'テストピラティスレッスン',
      '2024年1月15日（月）10:00',
      true
    )
    
    // 送信先をsyou0445@gmail.comに設定
    emailData.to = 'syou0445@gmail.com'
    
    // メール送信
    const success = await sendEmail(emailData)
    
    if (success) {
      return NextResponse.json({ 
        message: 'テストメール送信成功',
        to: emailData.to,
        subject: emailData.subject
      })
    } else {
      return NextResponse.json({ 
        error: 'テストメール送信失敗' 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('テストメール送信エラー:', error)
    return NextResponse.json({ 
      error: 'テストメール送信エラー' 
    }, { status: 500 })
  }
} 