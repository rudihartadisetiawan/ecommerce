import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMidtransSignature, mapTransactionStatus } from '@/lib/midtrans'

export async function POST(request) {
  const body = await request.json()

  if (!verifyMidtransSignature(body)) {
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 403 })
  }

  const newStatus = mapTransactionStatus(body.transaction_status)
  if (!newStatus) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const order = await prisma.order.findUnique({ where: { id: body.order_id } })
  if (!order) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Idempotency: skip if this transaction_id already processed
  if (body.transaction_id && order.paymentRef === body.transaction_id && order.status === newStatus) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: newStatus,
      paymentRef: body.transaction_id ?? order.paymentRef,
      // Hapus snapToken jika order expired/cancelled — token sudah tidak berlaku
      ...(newStatus === 'cancelled' && { snapToken: null }),
    },
  })

  return NextResponse.json({ ok: true })
}