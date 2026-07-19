import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireUser() {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

export async function requireAdmin() {
  const session = await requireUser()
  // Re-fetch user from DB so role changes (demotion) take effect immediately,
  // not waiting for JWT token expiry (default 30 days)
  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { role: true },
  })
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) throw new Error('FORBIDDEN')
  return session
}