import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
})

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  if (!rateLimit(`register:${ip}`, 3, 3600000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 })
  }
  const { name, email, password, phone } = parsed.data
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (exists) return NextResponse.json({ error: 'EMAIL_TAKEN' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash, phone },
  })
  return NextResponse.json({ ok: true }, { status: 201 })
}