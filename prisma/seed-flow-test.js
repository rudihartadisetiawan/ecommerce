// Test flow seed — order dummy per status untuk cek alur admin pesanan (/admin/pesanan).
// Run: node prisma/seed-flow-test.js
// Idempoten: menghapus order prefix "TEST-" lalu membuat ulang — aman dijalankan berkali-kali.
// Tidak menyentuh data lain (produk, users, order demo).

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// status + jumlah order test
const STATUS_PLAN = [
  ['pending', 8],
  ['paid', 10],
  ['processing', 4],
  ['shipped', 3],
  ['completed', 2],
  ['cancelled', 1],
]

const METHODS = ['BCA', 'QRIS', 'GoPay', 'OVO', 'DANA']
const COURIERS = ['JNE', 'J&T Express', 'SiCepat']

async function main() {
  console.log('── Test flow seed: order dummy per status (prefix TEST-) ──')

  const products = await prisma.product.findMany()
  if (!products.length) {
    console.error('ERROR: Belum ada produk. Jalankan `npm run db:seed` dulu.')
    process.exit(1)
  }

  // FK: review & orderItem menunjuk ke order — hapus anak dulu
  await prisma.review.deleteMany({ where: { orderId: { startsWith: 'TEST-' } } })
  await prisma.orderItem.deleteMany({ where: { orderId: { startsWith: 'TEST-' } } })
  await prisma.order.deleteMany({ where: { id: { startsWith: 'TEST-' } } })
  console.log('Membersihkan order test lama...')

  const users = await prisma.user.findMany({ where: { role: 'customer' }, take: 5, orderBy: { id: 'asc' } })
  if (!users.length) console.warn('WARN: belum ada customer — order dibuat sebagai guest.')

  let n = 0
  for (const [status, count] of STATUS_PLAN) {
    for (let i = 0; i < count; i++) {
      n++
      const p = products[(n * 3) % products.length]
      const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ['M']
      const colors = Array.isArray(p.colors) && p.colors.length ? p.colors : [{ name: 'Default', hex: '#CCCCCC' }]
      const size = sizes[n % sizes.length]
      const col = colors[n % colors.length]
      const qty = (n % 2) + 1
      const price = Number(p.price) || 150000
      const courier = COURIERS[n % COURIERS.length]
      const method = METHODS[n % METHODS.length]
      const shipping = 15000 + (n % 4) * 5000
      const buyer = users.length ? users[n % users.length] : null
      const trackingNumber =
        status === 'shipped' || status === 'completed'
          ? `${courier.split(' ')[0].toUpperCase()}-TEST${100000 + n}`
          : null

      await prisma.order.create({
        data: {
          id: `TEST-${status.toUpperCase().slice(0, 4)}-${String(i + 1).padStart(2, '0')}`,
          userId: buyer?.id ?? null,
          status,
          total: price * qty + shipping,
          shippingAddress: `${buyer?.name || 'Pelanggan Test'}, Jl. Melati No. ${n}, Jakarta Selatan, DKI Jakarta, Kode Pos: 12190, Telp: 081234567890`,
          paymentMethod: `${method} | Kurir: ${courier}`,
          paymentRef: ['paid', 'processing', 'shipped', 'completed'].includes(status) ? `TRX-TEST-${n}` : null,
          trackingNumber,
          createdAt: new Date(Date.now() - (n % 12) * 3600 * 1000),
          items: {
            create: [{
              productId: p.id,
              variant: { size, colorName: col.name, color: col.hex },
              qty,
              priceAtPurchase: price,
            }],
          },
        },
      })
    }
  }

  const summary = STATUS_PLAN.map(([s, c]) => `${s}: ${c}`).join(' | ')
  console.log(`OK — ${n} order test dibuat. ${summary}`)
  console.log('Jalankan lagi kapan saja untuk reset (idempoten).')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
