import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
})

export async function POST(request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 })
  }
  const { name, email, password, phone } = parsed.data

  // Dual key rate limit: per-IP + per-email — IP spoofing tidak bypass
  const ip = getClientIP(request)
  if (!rateLimit(`register:${ip}`, 3, 3600000) || !rateLimit(`register-email:${email.toLowerCase()}`, 3, 3600000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (exists) return NextResponse.json({ error: 'EMAIL_TAKEN' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash, phone },
  })
  return NextResponse.json({ ok: true }, { status: 201 })
}