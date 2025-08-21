import { ReservationType, PaymentMethod, PaymentStatus } from '@/lib/types'

// 動的インポートでPrismaクライアントを取得
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  return prisma
}

export async function processWaitingList(lessonId: string) {
  try {
    const prisma = await getPrisma()
    
    const waitingListEntry = await prisma.waitingList.findFirst({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
        lesson: true
      }
    })

    if (!waitingListEntry) {
      return null
    }

    // ユーザーの予約履歴を確認（体験レッスン対象者の判定）
    const hasReservationHistory = await prisma.reservation.findFirst({
      where: {
        userId: waitingListEntry.userId,
        paymentStatus: { not: PaymentStatus.CANCELLED }
      }
    })

    // 体験レッスンの利用履歴を確認
    const hasTrialHistory = await prisma.reservation.findFirst({
      where: {
        userId: waitingListEntry.userId,
        reservationType: ReservationType.TRIAL,
        paymentStatus: { not: PaymentStatus.CANCELLED }
      }
    })

    const canUseTrialOption = waitingListEntry.user.role === 'member' && !hasReservationHistory && !hasTrialHistory

    // 体験レッスン対象者の場合
    if (canUseTrialOption) {
      // 体験レッスンで予約を作成（チケット不要）
    } else {
      // 既存会員の場合はチケットをチェック
      const availableTicket = await prisma.ticket.findFirst({
        where: {
          userId: waitingListEntry.userId,
          lessonType: waitingListEntry.lesson.lessonType,
          remainingCount: { gt: 0 },
          expiresAt: { gt: new Date() }
        }
      })

      if (!availableTicket) {
        await prisma.waitingList.delete({
          where: { id: waitingListEntry.id }
        })
        return processWaitingList(lessonId)
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 体験レッスン対象者の場合
      if (canUseTrialOption) {
        const reservation = await tx.reservation.create({
          data: {
            lessonId,
            userId: waitingListEntry.userId,
            customerName: waitingListEntry.user.name || '',
            customerEmail: waitingListEntry.user.email || '',
            customerPhone: '',
            reservationType: ReservationType.TRIAL,
            paymentMethod: PaymentMethod.PAY_AT_STUDIO,
            paymentStatus: PaymentStatus.PENDING
          },
          include: {
            lesson: true
          }
        })

        await tx.waitingList.delete({
          where: { id: waitingListEntry.id }
        })

        return { reservation, user: waitingListEntry.user }
      } else {
        // 既存会員（チケット利用）の場合
        const availableTicket = await tx.ticket.findFirst({
          where: {
            userId: waitingListEntry.userId,
            lessonType: waitingListEntry.lesson.lessonType,
            remainingCount: { gt: 0 },
            expiresAt: { gt: new Date() }
          }
        })

        if (!availableTicket) {
          throw new Error('利用可能なチケットが見つかりません')
        }

        const reservation = await tx.reservation.create({
          data: {
            lessonId,
            userId: waitingListEntry.userId,
            customerName: waitingListEntry.user.name || '',
            customerEmail: waitingListEntry.user.email || '',
            customerPhone: '',
            reservationType: ReservationType.TICKET,
            paymentMethod: PaymentMethod.TICKET,
            paymentStatus: PaymentStatus.PENDING
          },
          include: {
            lesson: true
          }
        })

        await tx.ticket.update({
          where: { id: availableTicket.id },
          data: {
            remainingCount: { decrement: 1 }
          }
        })

        await tx.waitingList.delete({
          where: { id: waitingListEntry.id }
        })

        return { reservation, user: waitingListEntry.user }
      }
    })

    // キャンセル待ちから予約確定時のメール通知を送信
    try {
      const { sendEmail, generateWaitingListConfirmationEmail } = await import('@/lib/notifications')
      
      // 日本時間でフォーマット
      const lessonDate = new Date(result.reservation.lesson.startTime).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      })
      
      // 体験レッスンかどうかを判定
      const isTrialLesson = result.reservation.reservationType === ReservationType.TRIAL
      
      const emailData = generateWaitingListConfirmationEmail(
        result.user.name || '',
        result.reservation.lesson.title,
        lessonDate,
        isTrialLesson
      )
      
      emailData.to = result.user.email || ''
      await sendEmail(emailData)
      
      console.log('キャンセル待ちから予約確定のメール通知を送信しました:', {
        to: emailData.to,
        subject: emailData.subject
      })
    } catch (emailError) {
      console.error('キャンセル待ち予約確定メール送信エラー:', emailError)
      // メール送信失敗は予約確定に影響しない
    }

    return result

  } catch (error) {
    console.error('Process waiting list error:', error)
    return null
  }
}