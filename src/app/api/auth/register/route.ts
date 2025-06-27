import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { MemberRegistrationData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const data: MemberRegistrationData = await request.json()

    // バリデーション
    if (!data.name || !data.furigana || !data.age || !data.gender || !data.email || !data.password) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    if (data.password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      )
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        name: data.name,
        furigana: data.furigana,
        age: data.age,
        gender: data.gender,
        email: data.email,
        password: hashedPassword,
        memo: data.memo,
        role: 'member'
      }
    })

    // パスワードを除いて返す
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: '会員登録が完了しました',
        user: userWithoutPassword
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '会員登録に失敗しました' },
      { status: 500 }
    )
  }
}