import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// ponytail: escape CSV cell per RFC 4180 — cegah formula injection
function esc(v) {
  const s = String(v ?? '')
  // Prefix formula characters dengan single quote
  const prefix = /^[=\-+@\t\r]/.test(s) ? "'" : ''
  // Jika ada koma, quote, atau newline, wrap dalam double quotes dan escape internal quotes
  if (/,|"|\n|\r/.test(s)) return prefix + '"' + s.replace(/"/g, '""') + '"'
  return prefix + s
}

export async function GET(request) {
  // Export hanya untuk super_admin (owner) — admin staff tidak boleh akses PII customer
  const session = await getSession()
  if (!session || session.user.role !== 'super_admin') {
    return new Response('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const status = searchParams.get('status')

  const where = {}
  // Validasi status — hanya accept enum OrderStatus
  const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled']
  if (status && validStatuses.includes(status)) where.status = status
  else if (status) return new Response('Invalid status', { status: 400 })

  if (from || to) {
    where.createdAt = {}
    if (from) {
      const fd = new Date(from)
      if (isNaN(fd.getTime())) return new Response('Invalid from date', { status: 400 })
      where.createdAt.gte = fd
    }
    if (to) {
      const td = new Date(to + 'T23:59:59.999Z')
      if (isNaN(td.getTime())) return new Response('Invalid to date', { status: 400 })
      where.createdAt.lte = td
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const header = ['ID','Status','Total','Pembayaran','Metode','Pembeli','Email','Tanggal','Item','Nama Produk','Qty','Harga'].join(',') + '\n'
  const rows = orders.flatMap(o =>
    o.items.length
      ? o.items.map(i => [
          esc(o.id),
          esc(o.status),
          esc(o.total),
          esc(o.paymentRef || ''),
          esc(o.paymentMethod),
          esc(o.user?.name || ''),
          esc(o.user?.email || ''),
          esc(new Date(o.createdAt).toISOString().slice(0, 10)),
          esc(`${i.product?.name || 'Produk dihapus'} (${i.variant?.size || ''} / ${i.variant?.colorName || ''})`),
          esc(i.product?.name || ''),
          esc(i.qty),
          esc(i.priceAtPurchase),
        ].join(','))
      : [[
          esc(o.id),
          esc(o.status),
          esc(o.total),
          esc(o.paymentRef || ''),
          esc(o.paymentMethod),
          esc(o.user?.name || ''),
          esc(o.user?.email || ''),
          esc(new Date(o.createdAt).toISOString().slice(0, 10)),
          '','','','',
        ].join(',')]
  )

  const csv = '\uFEFF' + header + rows.join('\n') // BOM untuk Excel UTF-8

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
