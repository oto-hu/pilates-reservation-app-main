const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    // 既存の管理者ユーザーをチェック
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      console.log('管理者ユーザーは既に存在します:', existingAdmin.email)
      return existingAdmin
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // 管理者ユーザーを作成
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        role: 'admin',
        password: hashedPassword
      }
    })

    console.log('管理者ユーザーを作成しました:', adminUser.email)
    return adminUser
  } catch (error) {
    console.error('管理者ユーザーの作成に失敗しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
  .then(() => {
    console.log('完了')
    process.exit(0)
  })
  .catch((error) => {
    console.error('エラー:', error)
    process.exit(1)
  }) 