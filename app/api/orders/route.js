import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getSession } from '@/lib/session'
import { serializeOrder } from '@/lib/serialize'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { z } from 'zod'
import crypto from 'crypto'

// S-09: Zod schema untuk validasi order body
const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  variant: z.record(z.string(), z.any()),
  qty: z.number().int().min(1).max(20),
})

const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shippingAddress: z.string().min(5).max(500),
  paymentMethod: z.string().min(1).max(50),
  shippingCost: z.number().nonnegative().max(500000).optional(),
  shippingCourier: z.string().max(50).optional(),
  couponCode: z.string().max(50).optional(),
})

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let where = {}
  const isStaffView = searchParams.get('all') === 'true' && (session.user.role === 'admin' || session.user.role === 'super_admin')
  if (isStaffView) {
    where = {}
  } else {
    where = { userId: Number(session.user.id) }
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // S-23: Staff (role admin) tidak boleh menerima nominal pembayaran — hanya owner (super_admin)
  let result = orders.map(serializeOrder)
  if (isStaffView && session.user.role === 'admin') {
    result = result.map(o => ({ ...o, total: null, paymentRef: null }))
  }
  return NextResponse.json(result)
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
  const parsed = orderCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 })
  const { items, shippingAddress, paymentMethod, shippingCost = 0, shippingCourier = '', couponCode } = parsed.data
  const shipping = shippingCost // sudah divalidasi Zod max 500000

  // Rate limit by IP for guests, by userId for authenticated
  const ip = getClientIP(request)
  const rateLimitKey = session?.user?.id ? `order:${session.user.id}` : `order:${ip}`
  if (!rateLimit(rateLimitKey, session?.user?.id ? 10 : 3, 60000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS', message: 'Terlalu banyak pesanan dalam waktu singkat. Coba lagi sebentar lagi.' }, { status: 429 })
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
      return NextResponse.json({ error: 'PRODUCT_UNAVAILABLE', productId: it.productId, message: 'Salah satu produk tidak tersedia.' }, { status: 400 })
    }
    // Cek stok per varian jika tersedia
    const varKey = `${it.variant?.size || ''}-${it.variant?.colorName || it.variant?.color || ''}`
    const varStock = product.stockPerVariant?.[varKey]
    if (varStock !== undefined && varStock !== null) {
      if (varStock < it.qty) {
        return NextResponse.json({ error: 'OUT_OF_STOCK', productId: it.productId, variant: varKey, message: 'Maaf, stok tidak mencukupi untuk pesanan ini.' }, { status: 400 })
      }
    } else if (product.stock < it.qty) {
      return NextResponse.json({ error: 'OUT_OF_STOCK', productId: it.productId, message: 'Maaf, stok tidak mencukupi untuk pesanan ini.' }, { status: 400 })
    }
    total += product.price * it.qty
    // Simpan nama warna di variant.color — hex hanya dipakai untuk swatch
    const variant = { ...it.variant }
    if (variant.color && /^#[0-9a-fA-F]{6}$/.test(String(variant.color))) {
      const m = (product.colors || []).find(c => String(c.hex || '').toLowerCase() === String(variant.color).toLowerCase())
      if (m?.name) variant.color = m.name
    }
    variant.colorName = variant.colorName || variant.color
    orderItemsData.push({
      productId: product.id,
      variant,
      qty: it.qty,
      priceAtPurchase: product.price,
    })
  }

  // Validasi kupon (BELUM increment — dilakukan setelah order berhasil)
  let discount = 0
  let appliedCoupon = null
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
    if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses)) {
      if (total >= coupon.minPurchase) {
        discount = coupon.type === 'percentage' ? Math.round(total * coupon.value / 100) : coupon.value
        discount = Math.min(discount, total)
        appliedCoupon = coupon
      }
    }
  }

  // Total = subtotal produk + ongkir - diskon
  total = total + shipping - discount

  // S-18: Generate unique order ID — retry 5x, fallback ke timestamp-based
  let id = genOrderId()
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await prisma.order.findUnique({ where: { id } })
    if (!exists) break
    id = genOrderId() // regenerate
    if (attempt === 4) {
      // Fallback: include milliseconds untuk uniqueness
      id = `GAUL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
    }
  }

  // S-03 fix: Wrap order + coupon increment + stock decrement dalam transaksi
  let order
  try {
    order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
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

    // Increment coupon usedCount HANYA setelah order berhasil
    if (appliedCoupon) {
      await tx.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: { increment: 1 } },
      })
    }

    // Kurangi stok (atomic — guard against overselling)
    for (const it of orderItemsData) {
      const product = await tx.product.findUnique({ where: { id: it.productId }, select: { stockPerVariant: true, stock: true } })
      if (product?.stockPerVariant) {
        const varKey = `${it.variant?.size || ''}-${it.variant?.colorName || it.variant?.color || ''}`
        const updated = { ...product.stockPerVariant }
        if (updated[varKey] !== undefined) {
          updated[varKey] = Math.max(0, (updated[varKey] ?? 0) - it.qty)
        }
        // Atomic: hanya update jika stok cukup
        const result = await tx.product.updateMany({
          where: { id: it.productId, stock: { gte: it.qty } },
          data: { stockPerVariant: updated, stock: { decrement: it.qty } },
        })
        if (result.count === 0) throw new Error('OUT_OF_STOCK')
      } else {
        const result = await tx.product.updateMany({
          where: { id: it.productId, stock: { gte: it.qty } },
          data: { stock: { decrement: it.qty } },
        })
        if (result.count === 0) throw new Error('OUT_OF_STOCK')
      }
    }

    return created
    })
  } catch (e) {
    if (e?.message === 'OUT_OF_STOCK') {
      return NextResponse.json({ error: 'OUT_OF_STOCK', message: 'Maaf, stok tidak mencukupi untuk pesanan ini.' }, { status: 400 })
    }
    console.error('[orders POST] gagal membuat pesanan:', e)
    return NextResponse.json({ error: 'ORDER_CREATE_FAILED', message: 'Gagal membuat pesanan. Coba lagi.' }, { status: 500 })
  }

  return NextResponse.json(serializeOrder(order), { status: 201 })
}