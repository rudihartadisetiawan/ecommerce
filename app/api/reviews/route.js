import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

  const reviews = await prisma.review.findMany({
    where: { productId: Number(productId) },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const total = reviews.length
  const avgRating = total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : 0

  return NextResponse.json({
    total,
    avgRating: Number(avgRating),
    reviews: reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      userName: r.user?.name ?? 'Customer GAUL',
    })),
  })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await request.json()
  const { productId, orderId, rating, comment } = body

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'INVALID_DATA' }, { status: 400 })
  }
  if (comment && comment.length > 2000) {
    return NextResponse.json({ error: 'COMMENT_TOO_LONG' }, { status: 400 })
  }

  const userId = Number(session.user.id)

  // Validasi: pastikan user memiliki order completed dengan produk ini
  const completedOrder = await prisma.order.findFirst({
    where: {
      userId,
      status: 'completed',
      ...(orderId ? { id: orderId } : {}),
      items: {
        some: { productId: Number(productId) },
      },
    },
  })

  if (!completedOrder) {
    return NextResponse.json(
      { error: 'Anda hanya dapat mengulas produk yang telah Anda beli dan selesaikan.' },
      { status: 403 }
    )
  }

  // Cek jika sudah pernah ulas order ini
  if (orderId) {
    const existing = await prisma.review.findFirst({
      where: { userId, productId: Number(productId), orderId },
    })
    if (existing) {
      return NextResponse.json({ error: 'Anda telah memberi ulasan untuk item di pesanan ini.' }, { status: 400 })
    }
  }

  const review = await prisma.review.create({
    data: {
      productId: Number(productId),
      userId,
      orderId: orderId ?? completedOrder.id,
      rating: Number(rating),
      comment: comment?.trim() ?? '',
    },
  })

  return NextResponse.json(review, { status: 201 })
}
