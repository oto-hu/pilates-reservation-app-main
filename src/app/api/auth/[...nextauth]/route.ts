import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// このAPIルートを動的に実行するように設定
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }