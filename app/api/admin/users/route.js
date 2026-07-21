import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'
import { logAdminAction } from '@/lib/admin-log'

// S-07: Role hanya bisa admin atau customer — super_admin TIDAK bisa di-set via API
const updateRoleSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(['admin', 'customer']),
}).strict()

export async function GET(request) {
  const session = await getSession()
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') // 'staff' | 'customer' | 'all'

  const where = {}
  if (filter === 'staff') where.role = { in: ['admin', 'super_admin'] }
  else if (filter === 'customer') where.role = 'customer'

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: new Date(u.createdAt).toISOString().split('T')[0],
    }))
  )
}

export async function POST(request) {
  const session = await getSession()
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'FORBIDDEN_SUPER_ADMIN_ONLY' }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, password } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
  }

  // ponytail: validasi format email & password minimum, upgrade ke zod kalau tambah endpoint
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'PASSWORD_TOO_SHORT' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
  if (existing) {
    return NextResponse.json({ error: 'EMAIL_ALREADY_EXISTS' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  // API hanya bisa create admin staff, bukan super_admin
  const newUser = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  await logAdminAction(session, 'create_staff', `Staff: ${newUser.name} (${newUser.email})`)

  return NextResponse.json(
    {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: new Date(newUser.createdAt).toISOString().split('T')[0],
    },
    { status: 201 }
  )
}

export async function PUT(request) {
  const session = await getSession()
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'FORBIDDEN_SUPER_ADMIN_ONLY' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateRoleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 })
  const { userId, role } = parsed.data

  const updated = await prisma.user.update({
    where: { id: Number(userId) },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  })

  await logAdminAction(session, 'update_user_role', `User ID: ${userId} → role: ${role}`)

  return NextResponse.json(updated)
}
