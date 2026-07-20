import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
})

export async function POST(request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
  }

  const { token, password } = parsed.data

  // S-08: Hash incoming token sebelum lookup — token di DB sudah di-hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  const reset = await prisma.passwordReset.findUnique({ where: { token: hashedToken } })
  if (!reset) {
    return NextResponse.json({ error: 'Token tidak valid' }, { status: 400 })
  }
  if (reset.usedAt) {
    return NextResponse.json({ error: 'Token sudah digunakan' }, { status: 400 })
  }
  if (reset.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Token sudah kedaluwarsa' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: reset.email } })
  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  })

  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { usedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
