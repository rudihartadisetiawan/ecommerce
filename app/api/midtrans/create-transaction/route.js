import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createSnapTransaction } from '@/lib/midtrans'

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await request.json()
  if (!body?.orderId) return NextResponse.json({ error: 'INVALID' }, { status: 400 })

  const order = await prisma.order.findUnique({
    where: { id: body.orderId },
    include: { items: { include: { product: true } } },
  })
  if (!order) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (order.userId && order.userId !== Number(session.user.id) && session.user.role !== 'admin' && session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  if (order.status !== 'pending') {
    return NextResponse.json({ error: 'ORDER_NOT_PAYABLE' }, { status: 400 })
  }

  // Jika snapToken sudah ada (retry bayar), langsung reuse — tidak buat transaksi baru ke Midtrans
  if (order.snapToken) {
    return NextResponse.json({ token: order.snapToken })
  }

  try {
    // Hitung ongkir = total order - subtotal produk
    const subtotal = order.items.reduce((sum, i) => sum + i.priceAtPurchase * i.qty, 0)
    const shippingFee = order.total - subtotal

    const result = await createSnapTransaction(order, session.user, shippingFee)

    // Simpan snapToken ke DB agar retry bisa reuse token yang sama
    await prisma.order.update({
      where: { id: order.id },
      data: { snapToken: result.token },
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error('[midtrans create-transaction]', order.id, String(e?.message || e))
    return NextResponse.json(
      { error: 'MIDTRANS_ERROR', message: 'Gagal membuat tagihan pembayaran di Midtrans. Coba lagi.' },
      { status: 502 },
    )
  }
}