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
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  if (!rateLimit(`order:${session.user.id}`, 10, 60000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const body = await request.json()
  const { items, shippingAddress, paymentMethod, shippingCost = 0, shippingCourier = '' } = body
  if (!Array.isArray(items) || items.length === 0 || !shippingAddress || !paymentMethod) {
    return NextResponse.json({ error: 'INVALID' }, { status: 400 })
  }
  // Validasi shippingCost — max Rp500.000 untuk cegah manipulasi
  const shipping = Math.min(Math.max(0, Number(shippingCost) || 0), 500000)

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
    if (product.stock < it.qty) {
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

  // Total = subtotal produk + ongkir (dari RajaOngkir, sudah divalidasi di atas)
  total += shipping

  let id
  for (let attempt = 0; attempt < 5; attempt++) {
    id = genOrderId()
    const exists = await prisma.order.findUnique({ where: { id } })
    if (!exists) break
  }

  const order = await prisma.order.create({
    data: {
      id,
      userId: Number(session.user.id),
      total,
      shippingAddress,
      paymentMethod: shippingCourier ? `${paymentMethod} | Kurir: ${shippingCourier}` : paymentMethod,
      items: { create: orderItemsData },
    },
    include: { items: { include: { product: true } } },
  })

  // Kurangi stok
  await Promise.all(orderItemsData.map((it) =>
    prisma.product.update({
      where: { id: it.productId },
      data: { stock: { decrement: it.qty } },
    })
  ))

  return NextResponse.json(serializeOrder(order), { status: 201 })
}