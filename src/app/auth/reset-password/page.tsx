'use client'

import { Suspense } from 'react'
import ResetPasswordPage from './ResetPasswordPageInner'

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ResetPasswordPage />
    </Suspense>
  )
} 