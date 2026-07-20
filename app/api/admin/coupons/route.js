import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET() {
  await requireAdmin()
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(coupons)
}

export async function POST(request) {
  await requireAdmin()
  const body = await request.json()
  const { code, type, value, minPurchase, maxUses, expiresAt } = body
  if (!code || !value) return NextResponse.json({ error: 'Code dan value wajib' }, { status: 400 })
  const exists = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (exists) return NextResponse.json({ error: 'Kode sudah ada' }, { status: 409 })
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type: type || 'percentage',
      value: Number(value),
      minPurchase: Number(minPurchase) || 0,
      maxUses: Number(maxUses) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })
  return NextResponse.json(coupon, { status: 201 })
}

export async function PUT(request) {
  await requireAdmin()
  const body = await request.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const updateData = { ...data }
  if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt)
  if (data.value !== undefined) updateData.value = Number(data.value)
  if (data.minPurchase !== undefined) updateData.minPurchase = Number(data.minPurchase)
  if (data.maxUses !== undefined) updateData.maxUses = Number(data.maxUses)
  const coupon = await prisma.coupon.update({ where: { id: Number(id) }, data: updateData })
  return NextResponse.json(coupon)
}

export async function DELETE(request) {
  await requireAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await prisma.coupon.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
