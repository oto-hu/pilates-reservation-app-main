import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/notifications'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    // 入力値の検証
    if (!name || !email) {
      return NextResponse.json(
        { error: '名前とメールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // データベースでユーザーを検索
    const user = await prisma.user.findFirst({
      where: {
        name: name,
        email: email
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '名前とメールアドレスが一致するユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // パスワードが存在しない場合
    if (!user.password) {
      return NextResponse.json(
        { error: 'このアカウントにはパスワードが設定されていません' },
        { status: 400 }
      )
    }

    // 既存のリセットトークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })

    // 新しいリセットトークンを生成
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1時間後

    // リセットトークンをデータベースに保存
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: token,
        expires: expires
      }
    })

    // リセットURLを生成
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

    // パスワードリセットメールを送信
    const emailData = {
      to: user.email!,
      subject: '【Preal(プリール)】パスワードリセット',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            パスワードリセット
          </h2>
          <p>${user.name}様</p>
          <p>パスワードリセットのリクエストを受け付けました。</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">アカウント情報</h3>
            <p><strong>お名前:</strong> ${user.name}</p>
            <p><strong>メールアドレス:</strong> ${user.email}</p>
          </div>
          <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">パスワードリセット</h3>
            <p>以下のリンクをクリックして、新しいパスワードを設定してください。</p>
            <p style="margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                パスワードをリセット
              </a>
            </p>
            <p style="font-size: 12px; color: #666;">
              このリンクは1時間後に無効になります。
            </p>
          </div>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">セキュリティに関する注意</h4>
            <ul style="color: #856404; margin: 0;">
              <li>このリンクは本人のみが使用してください</li>
              <li>新しいパスワードは他人に教えないでください</li>
              <li>セキュリティのため、定期的にパスワードの変更をお勧めします</li>
            </ul>
          </div>
          <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
          <p style="margin-top: 30px;">
            Preal(プリール)<br>
            お問い合わせ: preal.pilates@gmail.com
          </p>
        </div>
      `,
      text: `
${user.name}様

パスワードリセットのリクエストを受け付けました。

【アカウント情報】
お名前: ${user.name}
メールアドレス: ${user.email}

【パスワードリセット】
以下のリンクをクリックして、新しいパスワードを設定してください。

${resetUrl}

このリンクは1時間後に無効になります。

【セキュリティに関する注意】
・このリンクは本人のみが使用してください
・新しいパスワードは他人に教えないでください
・セキュリティのため、定期的にパスワードの変更をお勧めします

ご不明な点がございましたら、お気軽にお問い合わせください。

ピラティススタジオ
お問い合わせ: preal.pilates@gmail.com
      `
    }

    const emailSent = await sendEmail(emailData)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'メールの送信に失敗しました。しばらく時間をおいて再度お試しください' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'パスワードリセット用のメールを送信しました' },
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