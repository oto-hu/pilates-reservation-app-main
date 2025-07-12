const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updateAdmin() {
  try {
    console.log('管理者アカウントの更新を開始します...')
    
    // 1. 既存のadminアカウントを削除
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (existingAdmin) {
      console.log('既存のadminアカウントを削除中...')
      await prisma.user.delete({
        where: { email: 'admin@example.com' }
      })
      console.log('既存のadminアカウントを削除しました')
    } else {
      console.log('既存のadminアカウントは見つかりませんでした')
    }
    
    // 2. 新しい管理者アカウントを作成
    console.log('新しい管理者アカウントを作成中...')
    const hashedPassword = await bcrypt.hash('preal-group250508', 10)
    
    const newAdmin = await prisma.user.create({
      data: {
        name: 'Tadasuke',
        email: 'preal.pilates@gmail.com',
        password: hashedPassword,
        role: 'admin',
        furigana: 'タダスケ',
        memo: 'システム管理者（全権限）'
      }
    })
    
    console.log('✅ 新しい管理者アカウントが作成されました:')
    console.log('  名前:', newAdmin.name)
    console.log('  メール:', newAdmin.email)
    console.log('  ロール:', newAdmin.role)
    console.log('  作成日時:', newAdmin.createdAt)
    console.log('')
    console.log('📝 ログイン情報:')
    console.log('  メール: preal.pilates@gmail.com')
    console.log('  パスワード: preal-group250508')
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdmin() 