import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { snapClient, mapTransactionStatus } from '@/lib/midtrans'

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { orderId } = await request.json()
  if (!orderId) return NextResponse.json({ error: 'INVALID' }, { status: 400 })

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (order.userId !== Number(session.user.id) && session.user.role !== 'admin' && session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  if (order.status !== 'pending') {
    return NextResponse.json({ status: order.status, alreadyUpdated: true })
  }

  try {
    const snap = snapClient()
    const status = await snap.transaction.status(orderId)

    const newStatus = mapTransactionStatus(status.transaction_status)
    if (newStatus && newStatus !== order.status) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          paymentRef: status.transaction_id ?? order.paymentRef,
          // Hapus snapToken jika order dibatalkan/expired — token tidak berlaku lagi
          ...(newStatus === 'cancelled' && { snapToken: null }),
        },
      })
      return NextResponse.json({ status: newStatus, updated: true })
    }

    return NextResponse.json({ status: order.status, updated: false })
  } catch (e) {
    return NextResponse.json({ error: 'MIDTRANS_ERROR', message: e.message }, { status: 502 })
  }
}
