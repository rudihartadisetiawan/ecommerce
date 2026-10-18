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
  // force=paid HANYA untuk demo lokal: wajib Midtrans sandbox + opt-in env ALLOW_TEST_PAYMENT.
  // Production diabaikan — customer tidak bisa menandai sendiri pesanan lunas.
  const forcePaid =
    searchParams.get('force') === 'paid' &&
    process.env.MIDTRANS_IS_PRODUCTION !== 'true' &&
    process.env.ALLOW_TEST_PAYMENT === 'true' &&
    Boolean(order.snapToken)

  try {
    const snap = snapClient()
    const status = await snap.transaction.status(orderId)

    const newStatus = mapTransactionStatus(status.transaction_status)
    // Sandbox: webhook tidak masuk di localhost — forcePaid boleh menaikkan pending → paid
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
    // Tidak ada force-paid di jalur error — eksploit 404 (transaksi tak ada) harus tetap ditolak
    const raw = String(e?.message || e)
    console.error(`[midtrans check-status] ${orderId}:`, raw)
    const notFound = raw.includes('404') || /doesn't exist/i.test(raw)
    return NextResponse.json(
      notFound
        ? {
            error: 'TX_NOT_FOUND',
            message:
              'Transaksi belum ditemukan di Midtrans. Tagihan pembayaran belum pernah dibuat untuk pesanan ini — minta pembeli klik "Bayar Sekarang", atau transaksi sudah kedaluwarsa.',
          }
        : {
            error: 'MIDTRANS_ERROR',
            message: 'Midtrans sedang tidak dapat dihubungi. Coba lagi beberapa saat lagi.',
          },
      { status: notFound ? 404 : 502 },
    )
  }
}
