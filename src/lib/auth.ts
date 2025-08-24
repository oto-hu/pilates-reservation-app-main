import { NextAuthOptions, User as NextAuthUser, Session as NextAuthSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'

// 動的インポートでPrismaクライアントを取得
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  return prisma
}

// --- 型拡張 ---
declare module 'next-auth' {
  interface User {
    id: string
    role: string
    name: string | null
  }
  interface Session {
    user: {
      id: string
      name: string | null
      email: string | null
      image: string | null
      role: string
    }
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    sub: string
  }
}
// --- 型拡張ここまで ---

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const prisma = await getPrisma()
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email!,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/'
  }
}