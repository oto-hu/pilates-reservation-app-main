import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'トークンとパスワードが必要です' },
        { status: 400 }
      )
    }

    // パスワードの長さをチェック
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で入力してください' },
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

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12)

    // ユーザーのパスワードを更新
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    })

    // 使用済みのトークンを削除
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    })

    return NextResponse.json(
      { message: 'パスワードが正常にリセットされました' },
      { status: 200 }
    )

  } catch (error) {
    console.error('パスワードリセットエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 