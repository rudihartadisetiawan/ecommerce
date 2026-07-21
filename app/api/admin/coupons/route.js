import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { z } from 'zod'
import { logAdminAction } from '@/lib/admin-log'

const postSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(['percentage', 'fixed']).optional(),
  value: z.number().positive(),
  minPurchase: z.number().nonnegative().optional(),
  maxUses: z.number().int().nonnegative().optional(),
  expiresAt: z.string().optional(),
})

// S-04: Whitelist ketat — tidak bisa ubah code, usedCount, createdAt, isActive
const updateSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['percentage', 'fixed']).optional(),
  value: z.number().positive().optional(),
  minPurchase: z.number().nonnegative().optional(),
  maxUses: z.number().int().nonnegative().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
}).strict() // strict: field di luar whitelist ditolak

export async function GET() {
  await requireAdmin()
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(coupons)
}

export async function POST(request) {
  const session = await requireAdmin()
  const body = await request.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 })
  const { code, type, value, minPurchase, maxUses, expiresAt } = parsed.data
  const exists = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (exists) return NextResponse.json({ error: 'Kode sudah ada' }, { status: 409 })
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type: type || 'percentage',
      value,
      minPurchase: minPurchase ?? 0,
      maxUses: maxUses ?? 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })
  await logAdminAction(session, 'create_coupon', `Coupon: ${coupon.code} (#${coupon.id})`)
  return NextResponse.json(coupon, { status: 201 })
}

export async function PUT(request) {
  const session = await requireAdmin()
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 })
  const { id, ...data } = parsed.data
  const updateData = { ...data }
  if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt)
  const coupon = await prisma.coupon.update({ where: { id: Number(id) }, data: updateData })
  await logAdminAction(session, 'update_coupon', `Coupon ID: ${id} (${coupon.code})`)
  return NextResponse.json(coupon)
}

export async function DELETE(request) {
  const session = await requireAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await prisma.coupon.delete({ where: { id: Number(id) } })
  await logAdminAction(session, 'delete_coupon', `Coupon ID: ${id}`)
  return NextResponse.json({ ok: true })
}
