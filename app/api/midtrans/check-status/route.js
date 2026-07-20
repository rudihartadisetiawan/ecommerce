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

  const { searchParams } = new URL(request.url)
  const forcePaid = searchParams.get('force') === 'paid'

  try {
    const snap = snapClient()
    const status = await snap.transaction.status(orderId)

    const newStatus = mapTransactionStatus(status.transaction_status)
    // Fallback: jika forcePaid=true dan Midtrans masih pending (sandbox), paksa jadi paid
    const finalStatus = newStatus === 'pending' && forcePaid ? 'paid' : newStatus

    if (finalStatus && finalStatus !== order.status) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: finalStatus,
          paymentRef: status.transaction_id ?? order.paymentRef,
          // Hapus snapToken jika order dibatalkan/expired — token tidak berlaku lagi
          ...(finalStatus === 'cancelled' && { snapToken: null }),
        },
      })
      return NextResponse.json({ status: finalStatus, updated: true })
    }

    return NextResponse.json({ status: order.status, updated: false })
  } catch (e) {
    // Fallback: jika Midtrans error dan forcePaid=true, set paid optimistically
    if (forcePaid && order.status === 'pending') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
      })
      return NextResponse.json({ status: 'paid', updated: true })
    }
    return NextResponse.json({ error: 'MIDTRANS_ERROR', message: e.message }, { status: 502 })
  }
}
