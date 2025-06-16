export interface Lesson {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  maxCapacity: number
  reservations: Reservation[]
  createdAt: Date
  updatedAt: Date
  instructorName: string
}

export interface Reservation {
  id: string
  lessonId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  stripeSessionId?: string
  createdAt: Date
  updatedAt: Date
  lesson?: Lesson
}

export enum PaymentMethod {
  PAY_NOW = 'PAY_NOW',
  PAY_AT_STUDIO = 'PAY_AT_STUDIO'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface CreateReservationData {
  lessonId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: PaymentMethod
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    lesson: Lesson
    availableSpots: number
    isFull: boolean
  }
}