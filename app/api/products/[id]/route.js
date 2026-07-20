import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getSession } from '@/lib/session'
import { serializeProduct, serializeProductAdmin } from '@/lib/serialize'
import { z } from 'zod'

export async function GET(request, { params }) {
  const { id } = await params
  const session = await getSession()
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin'
  const product = await prisma.product.findUnique({ where: { id: Number(id) } })
  if (!product) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (!product.isActive && !isAdmin) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json(serializeProduct(product))
}

const colorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
}).strict()

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
  costPrice: z.number().int().nonnegative().optional(),
  category: z.string().min(1).optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(colorSchema).optional(),
  images: z.array(z.string()).optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

export async function PUT(request, { params }) {
  try { await requireAdmin() } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
  const { id } = await params
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 })
  try {
    const product = await prisma.product.update({ where: { id: Number(id) }, data: parsed.data })
    return NextResponse.json(serializeProductAdmin(product))
  } catch (e) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ error: 'SLUG_TAKEN' }, { status: 409 })
  }
}

export async function DELETE(request, { params }) {
  try { await requireAdmin() } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
  const { id } = await params
  try {
    await prisma.product.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}