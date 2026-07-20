import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET(request) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const status = searchParams.get('status')

  const where = {}
  if (status) where.status = status
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to + 'T23:59:59.999Z')
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const header = 'ID,Status,Total,Pembayaran,Metode,Pembeli,Email,Tanggal,Item,Nama Produk,Qty,Harga\n'
  const rows = orders.flatMap(o =>
    o.items.length
      ? o.items.map(i =>
          [
            o.id,
            o.status,
            o.total,
            o.paymentRef || '',
            o.paymentMethod,
            o.user?.name || '',
            o.user?.email || '',
            new Date(o.createdAt).toISOString().slice(0, 10),
            `${i.product?.name || 'Produk dihapus'} (${i.variant?.size || ''} / ${i.variant?.colorName || ''})`,
            i.product?.name || '',
            i.qty,
            i.priceAtPurchase,
          ].join(',')
        )
      : [[o.id, o.status, o.total, o.paymentRef || '', o.paymentMethod, o.user?.name || '', o.user?.email || '', new Date(o.createdAt).toISOString().slice(0, 10), '', '', '', ''].join(',')]
  )

  const csv = '\uFEFF' + header + rows.join('\n') // BOM untuk Excel UTF-8

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
