import { prisma } from '@/lib/prisma'
import { ReservationType, PaymentMethod, PaymentStatus } from '@/lib/types'

export async function processWaitingList(lessonId: string) {
  try {
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

    const result = await prisma.$transaction(async (tx) => {
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
    })

    return result

  } catch (error) {
    console.error('Process waiting list error:', error)
    return null
  }
}