import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'トークンが提供されていません' },
        { status: 400 }
      )
    }

    // データベースでトークンを検索
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: token },
      include: { user: true }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: '無効なリセットトークンです' },
        { status: 404 }
      )
    }

    // トークンの有効期限をチェック
    if (resetToken.expires < new Date()) {
      // 期限切れのトークンを削除
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      })
      
      return NextResponse.json(
        { error: 'リセットトークンの有効期限が切れています' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'トークンが有効です',
        userId: resetToken.userId,
        userName: resetToken.user.name
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('トークン検証エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 