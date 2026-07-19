import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { serializeProduct } from '@/lib/serialize'

export async function GET(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const idsOnly = searchParams.get('idsOnly') === 'true'
  const checkProductId = searchParams.get('productId')

  const userId = Number(session.user.id)

  if (checkProductId) {
    const item = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId: Number(checkProductId) },
      },
    })
    return NextResponse.json({ wishlisted: !!item })
  }

  const wishlists = await prisma.wishlist.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { id: 'desc' },
  })

  if (idsOnly) {
    return NextResponse.json(wishlists.map(w => w.productId))
  }

  const products = wishlists.map(w => serializeProduct(w.product)).filter(Boolean)
  return NextResponse.json(products)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await request.json()
  const productId = Number(body?.productId)
  if (!productId) return NextResponse.json({ error: 'INVALID_PRODUCT_ID' }, { status: 400 })

  const userId = Number(session.user.id)

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  })

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } })
    return NextResponse.json({ wishlisted: false })
  } else {
    await prisma.wishlist.create({
      data: { userId, productId },
    })
    return NextResponse.json({ wishlisted: true })
  }
}
