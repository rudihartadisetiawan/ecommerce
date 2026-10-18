import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { rateLimit } from './rate-limit'

export const authOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/account/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.toLowerCase()
        if (!rateLimit(`login:${email}`, 5, 900000)) return null // 5 attempts / 15 menit
        const user = await prisma.user.findUnique({
          where: { email },
        })
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null

        // Log admin/super_admin login
        if (user.role === 'admin' || user.role === 'super_admin') {
          // Support both NextRequest (req.headers.get) and plain object (req.headers['key'])
          const h = req?.headers
          const getHeader = (key) => (typeof h?.get === 'function' ? h.get(key) : h?.[key])
          const ip = getHeader('x-forwarded-for')?.split(',')?.[0]?.trim()
            || getHeader('x-real-ip') || getHeader('host') || null
          prisma.loginLog.create({
            data: { userId: user.id, name: user.name, role: user.role, ip },
          }).catch(() => {})
        }

        return { id: String(user.id), name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session, newSession }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      // update() dari client (mis. ganti nama di halaman profil)
      if (trigger === 'update') {
        const data = newSession || session
        if (data?.name) token.name = data.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Validasi token ke DB — tolak sesi basi (user sudah dihapus / DB diganti),
        // dan ambil role terkini supaya promosi/demosi langsung berlaku
        const user = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { id: true, role: true },
        })
        if (!user) return null
        session.user.id = token.id
        session.user.role = user.role
        // sinkron dari token — supaya hasil update (trigger "update") langsung terlihat
        if (token.name) session.user.name = token.name
        if (token.email) session.user.email = token.email
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}