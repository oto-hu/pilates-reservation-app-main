import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  furigana: z.string().min(1, 'フリガナは必須です'),
  age: z.number().min(0, '年齢は0以上である必要があります'),
  gender: z.string().min(1, '性別は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  memo: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // パスワードのハッシュ化
    const hashedPassword = await hash(validatedData.password, 12)

    // ユーザーの作成
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        furigana: validatedData.furigana,
        age: validatedData.age,
        gender: validatedData.gender,
        email: validatedData.email,
        password: hashedPassword,
        memo: validatedData.memo || '',
        role: 'member'
      }
    })

    return NextResponse.json(
      { message: '会員登録が完了しました' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '会員登録に失敗しました' },
      { status: 500 }
    )
  }
}