import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { serializeProduct, serializeProductAdmin } from '@/lib/serialize'
import { logAdminAction } from '@/lib/admin-log'
import { z } from 'zod'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const all = searchParams.get('all') === 'true'
  const q = searchParams.get('q')
  const category = searchParams.get('category')
  const featuredOnly = searchParams.get('featured') === 'true'

  const where = { AND: [] }
  if (!all) where.AND.push({ isActive: true })
  if (q) where.AND.push({ name: { contains: q } })
  if (category) where.AND.push({ category })
  if (featuredOnly) where.AND.push({ isFeatured: true })

  if (all) {
    try { await requireAdmin() } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  }

  const sort = searchParams.get('sort')
  let orderBy = { createdAt: 'desc' }
  if (sort === 'price-asc') orderBy = { price: 'asc' }
  else if (sort === 'price-desc') orderBy = { price: 'desc' }

  // ponytail: all=true return semua tanpa pagination (untuk admin & export)
  if (all) {
    const products = await prisma.product.findMany({ where, orderBy })
    return NextResponse.json(products.map(serializeProductAdmin))
  }

  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit'), 10) || 12))
  const skip = (page - 1) * limit

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take: limit }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({
    products: products.map(serializeProduct),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

// S-15: colors harus array of { name, hex } — cegah arbitrary JSON / prototype pollution
const colorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().regex(/^#?[0-9a-fA-F]{6}$/, 'Invalid hex color'),
}).strict()

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().default(''),
  price: z.number().int().nonnegative(),
  category: z.string().min(1),
  sizes: z.array(z.string()).default([]),
  colors: z.array(colorSchema).default([]),
  images: z.array(z.string()).default([]),
  stock: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

export async function POST(request) {
  let session; try { session = await requireAdmin() } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
  const body = await request.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 })
  try {
    const product = await prisma.product.create({ data: parsed.data })
    // Trigger notifikasi koleksi baru
    try {
      await prisma.notification.create({
        data: {
          type: 'new_collection',
          title: `Koleksi Baru: ${product.name}`,
          message: `${product.name} — ${product.category} — sudah tersedia di GAUL. Cek koleksi terbaru kami!`,
          link: product.slug,
        },
      })
    } catch {}
    await logAdminAction(session, 'create_product', `Product: ${product.name} (#${product.id})`)
    return NextResponse.json(serializeProductAdmin(product), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'SLUG_TAKEN' }, { status: 409 })
  }
}