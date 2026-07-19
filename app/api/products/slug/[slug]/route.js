import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { serializeProduct } from '@/lib/serialize'

export async function GET(request, { params }) {
  const { slug } = await params
  const session = await getSession()
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin'
  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (!product.isActive && !isAdmin) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json(serializeProduct(product))
}