const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTicketGroups() {
  try {
    console.log('チケットグループを作成中...')

    // 少人数制ピラティスチケットグループ
    const smallGroup = await prisma.ticketGroup.upsert({
      where: { name: '少人数制ピラティス' },
      update: {},
      create: {
        name: '少人数制ピラティス'
      }
    })
    console.log('✅ 少人数制ピラティスチケットグループを作成しました:', smallGroup.id)

    // わいわいピラティスチケットグループ
    const largeGroup = await prisma.ticketGroup.upsert({
      where: { name: 'わいわいピラティス' },
      update: {},
      create: {
        name: 'わいわいピラティス'
      }
    })
    console.log('✅ わいわいピラティスチケットグループを作成しました:', largeGroup.id)

    console.log('\n🎉 すべてのチケットグループが正常に作成されました！')
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTicketGroups() 