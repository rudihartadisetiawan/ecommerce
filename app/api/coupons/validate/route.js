import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  const body = await request.json()
  const { code, subtotal } = body
  if (!code) return NextResponse.json({ error: 'CODE_REQUIRED' }, { status: 400 })

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: 'Kode kupon tidak valid' }, { status: 400 })
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Kupon sudah kedaluwarsa' }, { status: 400 })
  }

  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Kupon sudah habis digunakan' }, { status: 400 })
  }

  const subtotalNum = Number(subtotal) || 0
  if (subtotalNum < coupon.minPurchase) {
    return NextResponse.json({ error: `Min. belanja Rp${coupon.minPurchase.toLocaleString('id-ID')}` }, { status: 400 })
  }

  let discount = 0
  if (coupon.type === 'percentage') {
    discount = Math.round(subtotalNum * coupon.value / 100)
  } else {
    discount = coupon.value
  }
  // Discount tidak boleh melebihi subtotal
  discount = Math.min(discount, subtotalNum)

  return NextResponse.json({
    valid: true,
    discount,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    totalAfter: subtotalNum - discount,
  })
}
