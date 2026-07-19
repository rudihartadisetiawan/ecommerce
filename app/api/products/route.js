import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { serializeProduct } from '@/lib/serialize'
import { z } from 'zod'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const all = searchParams.get('all') === 'true'
  const q = searchParams.get('q')
  const category = searchParams.get('category')

  const where = { AND: [] }
  if (!all) where.AND.push({ isActive: true })
  if (q) where.AND.push({ name: { contains: q } })
  if (category) where.AND.push({ category })

  if (all) {
    try { await requireAdmin() } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  }

  const sort = searchParams.get('sort')
  let orderBy = { createdAt: 'desc' }
  if (sort === 'price-asc') orderBy = { price: 'asc' }
  else if (sort === 'price-desc') orderBy = { price: 'desc' }

  const products = await prisma.product.findMany({ where, orderBy })
  return NextResponse.json(products.map(serializeProduct))
}

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().default(''),
  price: z.number().int().nonnegative(),
  category: z.string().min(1),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.any()).default([]),
  images: z.array(z.string()).default([]),
  stock: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
})

export async function POST(request) {
  try { await requireAdmin() } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
  const body = await request.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 })
  try {
    const product = await prisma.product.create({ data: parsed.data })
    return NextResponse.json(serializeProduct(product), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'SLUG_TAKEN' }, { status: 409 })
  }
}