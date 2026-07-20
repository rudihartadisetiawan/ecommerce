import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getSession } from '@/lib/session'
import { serializeOrder } from '@/lib/serialize'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let where = {}
  if (searchParams.get('all') === 'true' && (session.user.role === 'admin' || session.user.role === 'super_admin')) {
    where = {}
  } else {
    where = { userId: Number(session.user.id) }
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders.map(serializeOrder))
}

function genOrderId() {
  const timeStr = Date.now().toString(36).toUpperCase().slice(-4)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  // ponytail: crypto.randomBytes over Math.random untuk unpredictable order ID
  const buf = crypto.randomBytes(4)
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[buf[i] % chars.length]
  return `GAUL-${timeStr}${s}`
}

export async function POST(request) {
  const session = await getSession()
  // ponytail: guest checkout — tidak perlu session

  const body = await request.json()
  const { items, shippingAddress, paymentMethod, shippingCost = 0, shippingCourier = '', couponCode } = body
  if (!Array.isArray(items) || items.length === 0 || !shippingAddress || !paymentMethod) {
    return NextResponse.json({ error: 'INVALID' }, { status: 400 })
  }
  // Validasi shippingCost — max Rp500.000 untuk cegah manipulasi
  const shipping = Math.min(Math.max(0, Number(shippingCost) || 0), 500000)

  // Rate limit by IP for guests, by userId for authenticated
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitKey = session?.user?.id ? `order:${session.user.id}` : `order:${ip}`
  if (!rateLimit(rateLimitKey, session?.user?.id ? 10 : 3, 60000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  // Validasi & hitung subtotal dari DB (jangan percaya harga klien)
  let total = 0
  const orderItemsData = []
  const MAX_QTY_PER_ITEM = 20
  for (const it of items) {
    if (!it.productId || !it.variant || !it.qty || it.qty < 1 || it.qty > MAX_QTY_PER_ITEM) {
      return NextResponse.json({ error: 'INVALID_ITEM_QTY' }, { status: 400 })
    }
    const product = await prisma.product.findUnique({ where: { id: Number(it.productId) } })
    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'PRODUCT_UNAVAILABLE', productId: it.productId }, { status: 400 })
    }
    // Cek stok per varian jika tersedia
    const varKey = `${it.variant?.size || ''}-${it.variant?.colorName || it.variant?.color || ''}`
    const varStock = product.stockPerVariant?.[varKey]
    if (varStock !== undefined && varStock !== null) {
      if (varStock < it.qty) {
        return NextResponse.json({ error: 'OUT_OF_STOCK', productId: it.productId, variant: varKey }, { status: 400 })
      }
    } else if (product.stock < it.qty) {
      return NextResponse.json({ error: 'OUT_OF_STOCK', productId: it.productId }, { status: 400 })
    }
    total += product.price * it.qty
    orderItemsData.push({
      productId: product.id,
      variant: it.variant,
      qty: it.qty,
      priceAtPurchase: product.price,
    })
  }

  // Validasi & aplikasi kupon
  let discount = 0
  let appliedCoupon = null
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
    if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses)) {
      if (total >= coupon.minPurchase) {
        discount = coupon.type === 'percentage' ? Math.round(total * coupon.value / 100) : coupon.value
        discount = Math.min(discount, total)
        appliedCoupon = coupon
        await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
      }
    }
  }

  // Total = subtotal produk + ongkir - diskon
  total = total + shipping - discount

  let id
  for (let attempt = 0; attempt < 5; attempt++) {
    id = genOrderId()
    const exists = await prisma.order.findUnique({ where: { id } })
    if (!exists) break
  }

  const order = await prisma.order.create({
    data: {
      id,
      userId: session?.user?.id ? Number(session.user.id) : null,
      total,
      shippingAddress,
      paymentMethod: shippingCourier ? `${paymentMethod} | Kurir: ${shippingCourier}` : paymentMethod,
      items: { create: orderItemsData },
    },
    include: { items: { include: { product: true } } },
  })

  // Kurangi stok (decrement per varian jika ada stockPerVariant)
  await Promise.all(orderItemsData.map(async (it) => {
    const product = await prisma.product.findUnique({ where: { id: it.productId }, select: { stockPerVariant: true } })
    if (product?.stockPerVariant) {
      const varKey = `${it.variant?.size || ''}-${it.variant?.colorName || it.variant?.color || ''}`
      const updated = { ...product.stockPerVariant }
      if (updated[varKey] !== undefined) updated[varKey] = Math.max(0, updated[varKey] - it.qty)
      await prisma.product.update({
        where: { id: it.productId },
        data: { stockPerVariant: updated, stock: { decrement: it.qty } },
      })
    } else {
      await prisma.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.qty } },
      })
    }
  }))

  return NextResponse.json(serializeOrder(order), { status: 201 })
}