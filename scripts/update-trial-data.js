// scripts/update-trial-data.js
// 既存会員の体験日を体験予約データから自動設定するスクリプト
// このスクリプトは既存データのみを更新し、削除は一切行いません

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateTrialData() {
  console.log('既存会員の体験日データ更新を開始します...')
  console.log('※このスクリプトはデータを削除せず、更新のみ行います')

  try {
    // 1. 体験日がNULLで、体験予約履歴がある会員を取得
    const usersWithTrialReservations = await prisma.user.findMany({
      where: {
        trialDate: null, // 体験日が未設定
      },
      include: {
        reservations: {
          where: {
            reservationType: 'TRIAL',
            paymentStatus: {
              not: 'CANCELLED' // キャンセルされていない予約のみ
            }
          },
          include: {
            lesson: true
          },
          orderBy: {
            createdAt: 'asc' // 最初の体験予約を取得
          }
        }
      }
    })

    console.log(`体験日が未設定の会員: ${usersWithTrialReservations.length}人`)

    let updatedCount = 0

    for (const user of usersWithTrialReservations) {
      if (user.reservations.length > 0) {
        // 最初の体験予約の日時を体験日として設定
        const firstTrialReservation = user.reservations[0]
        const trialDate = firstTrialReservation.lesson.startTime

        console.log(`会員 ${user.name || user.email} の体験日を設定: ${trialDate.toLocaleDateString('ja-JP')}`)

        // 体験日を更新（既存データを削除せず、trialDateのみ更新）
        await prisma.user.update({
          where: { id: user.id },
          data: {
            trialDate: trialDate
          }
        })

        updatedCount++
      }
    }

    console.log(`\n✅ 体験日更新完了: ${updatedCount}人の会員データを更新しました`)

    // 2. 住所・郵便番号が未設定の会員の確認
    const usersWithoutAddress = await prisma.user.findMany({
      where: {
        OR: [
          { postalCode: null },
          { address: null },
          { postalCode: '' },
          { address: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        postalCode: true,
        address: true,
        createdAt: true
      }
    })

    console.log(`\n住所・郵便番号が未設定の会員: ${usersWithoutAddress.length}人`)
    
    if (usersWithoutAddress.length > 0) {
      console.log('住所・郵便番号が未設定の会員は、体験予約フォームで入力されていない可能性があります')
      console.log('これらの会員の情報は管理者画面から手動で更新できます')
      
      // サンプルを表示（最大5件）
      console.log('\nサンプル（最大5件）:')
      usersWithoutAddress.slice(0, 5).forEach(user => {
        console.log(`- ${user.name || user.email}: 郵便番号=${user.postalCode || '未設定'}, 住所=${user.address || '未設定'}`)
      })
    }

    // 3. 完了状況の確認
    const totalUsers = await prisma.user.count({
      where: { role: 'member' }
    })
    
    const usersWithTrialDate = await prisma.user.count({
      where: { 
        role: 'member',
        trialDate: { not: null }
      }
    })

    const usersWithCompleteAddress = await prisma.user.count({
      where: {
        role: 'member',
        postalCode: { not: null },
        address: { not: null },
        postalCode: { not: '' },
        address: { not: '' }
      }
    })

    console.log(`\n📊 データ完了状況:`)
    console.log(`総会員数: ${totalUsers}人`)
    console.log(`体験日設定済み: ${usersWithTrialDate}人 (${Math.round(usersWithTrialDate/totalUsers*100)}%)`)
    console.log(`住所完備: ${usersWithCompleteAddress}人 (${Math.round(usersWithCompleteAddress/totalUsers*100)}%)`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプト実行時の確認
if (require.main === module) {
  console.log('⚠️  このスクリプトは既存会員の体験日データを更新します')
  console.log('既存データは削除されず、体験日の追加のみ行われます')
  console.log('')
  
  updateTrialData()
    .then(() => {
      console.log('\n✅ スクリプト実行完了')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ スクリプト実行エラー:', error)
      process.exit(1)
    })
}

module.exports = { updateTrialData }