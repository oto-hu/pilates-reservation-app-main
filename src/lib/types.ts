// src/lib/types.ts
export interface Lesson {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  maxCapacity: number
  price: number
  lessonType: LessonType
  location?: string
  reservations: Reservation[]
  waitingList: WaitingList[]
  createdAt: Date
  updatedAt: Date
  instructorName?: string
  ticketGroupId?: string | null
}

export interface Reservation {
  id: string
  lessonId: string
  userId?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  medicalInfo?: string
  reservationType: ReservationType
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  stripeSessionId?: string
  createdAt: Date
  updatedAt: Date
  lesson?: Lesson
  user?: User
}

export enum PaymentMethod {
  PAY_NOW = 'PAY_NOW',
  PAY_AT_STUDIO = 'PAY_AT_STUDIO',
  TICKET = 'TICKET'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum ReservationType {
  TRIAL = 'TRIAL',
  DROP_IN = 'DROP_IN',
  TICKET = 'TICKET'
}

export enum LessonType {
  SMALL_GROUP = 'SMALL_GROUP',
  LARGE_GROUP = 'LARGE_GROUP'
}

export interface User {
  id: string
  name?: string
  furigana?: string
  age?: number
  gender?: string
  email?: string
  phone?: string
  password?: string
  role: string
  memo?: string
  consentAgreedAt?: Date
  createdAt: Date
  updatedAt: Date
  reservations?: Reservation[]
  tickets?: Ticket[]
  waitingList?: WaitingList[]
}

export interface Ticket {
  id: string
  userId: string
  name?: string
  lessonType: LessonType
  remainingCount: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  user?: User
  ticketGroupId?: string | null
}

export interface WaitingList {
  id: string
  lessonId: string
  userId: string
  createdAt: Date
  lesson?: Lesson
  user?: User
}

export interface CreateReservationData {
  lessonId: string
  userId?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  medicalInfo?: string
  reservationType: ReservationType
  paymentMethod: PaymentMethod
  agreeToConsent?: boolean
}

export interface NewUserReservationData {
  // 会員登録情報
  name: string
  furigana: string
  birthDate: string
  age?: string
  gender: string
  postalCode?: string
  address?: string
  email: string
  password: string
  emergencyContactName?: string
  emergencyContactFurigana?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  memo?: string
  
  // 予約情報
  lessonId: string
  reservationType: ReservationType
}

// 会員登録情報のみの型（将来の拡張用）
export interface MemberRegistrationData {
  name: string
  furigana: string
  age: number
  gender: string
  email: string
  password: string
  memo?: string
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
    waitingListCount: number
  }
}