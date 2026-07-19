import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getSession } from '@/lib/session'
import { serializeOrder } from '@/lib/serialize'

export async function GET(request, { params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  })
  if (!order) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const isOwner = order.userId === Number(session.user.id)
  const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  return NextResponse.json(serializeOrder(order))
}

export async function PUT(request, { params }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const valid = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled']
  if (body.status !== undefined && !valid.includes(body.status)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 })
  }

  const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'

  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!existingOrder) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // User biasa: boleh cancel (saat pending) ATAU complete pesanan (saat shipped)
  if (!isAdmin) {
    if (existingOrder.userId !== Number(session.user.id)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    if (body.status === 'cancelled') {
      if (existingOrder.status !== 'pending') {
        return NextResponse.json({ error: 'Hanya pesanan pending yang bisa dibatalkan.' }, { status: 400 })
      }
    } else if (body.status === 'completed') {
      if (existingOrder.status !== 'shipped') {
        return NextResponse.json({ error: 'Hanya pesanan yang sudah dikirim yang bisa diselesaikan.' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
  }

  try {
    const dataToUpdate = {}
    if (body.status) dataToUpdate.status = body.status
    if (body.trackingNumber !== undefined) dataToUpdate.trackingNumber = body.trackingNumber
    if (body.receivedProofImage !== undefined) dataToUpdate.receivedProofImage = body.receivedProofImage

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'NO_DATA_TO_UPDATE' }, { status: 400 })
    }

    // Restock produk jika pesanan dibatalkan (dan belum pernah dibatalkan sebelumnya)
    if (body.status === 'cancelled' && existingOrder.status !== 'cancelled') {
      await Promise.all(
        (existingOrder.items || []).map((item) => {
          if (!item.productId) return Promise.resolve()
          return prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          })
        })
      )
    }

    const order = await prisma.order.update({
      where: { id },
      data: dataToUpdate,
      include: { items: { include: { product: true } } },
    })
    return NextResponse.json(serializeOrder(order))
  } catch (e) {
    console.error('API Order PUT error:', e)
    return NextResponse.json({ error: e.message || 'UPDATE_FAILED' }, { status: 500 })
  }
}