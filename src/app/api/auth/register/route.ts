import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      furigana,
      birthDate,
      age,
      gender,
      postalCode,
      address,
      email,
      password,
      memo,
      emergencyContactName,
      emergencyContactFurigana,
      emergencyContactPhone,
      emergencyContactRelation
    } = body

    // 必須フィールドの検証
    if (!name || !furigana || !birthDate || !gender || !email || !password) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12)

    // 生年月日をDate型に変換
    const birthDateObj = new Date(birthDate)

    // ユーザーの作成
    const user = await prisma.user.create({
      data: {
        name,
        furigana,
        birthDate: birthDateObj,
        age: age ? parseInt(age) : null,
        gender,
        postalCode,
        address,
        email,
        password: hashedPassword,
        memo,
        emergencyContactName,
        emergencyContactFurigana,
        emergencyContactPhone,
        emergencyContactRelation,
        role: 'member'
      }
    })

    // パスワードを除いたユーザー情報を返す
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