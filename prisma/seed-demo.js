// Demo seed — menjadikan DB terlihat seperti bisnis yang sudah berjalan ±1 tahun.
// Run: npm run db:seed:demo  (WAJIB sudah `npm run db:seed` dulu agar produk & admin ada)
// Idempoten: menghapus data demo (orders, reviews, chat, log, dsb.) lalu membangun ulang.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Deterministic PRNG (mulberry32) agar hasil reproducible ─────────
let _seed = 987654321
function rnd() {
  _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const randInt = (min, max) => Math.floor(rnd() * (max - min + 1)) + min
const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

// ─── Data pools ──────────────────────────────────────────────────────
const FIRST = ['Andi','Budi','Citra','Dewi','Eko','Fitri','Gilang','Hana','Intan','Joko','Karin','Lina','Maya','Naufal','Olivia','Putra','Rizky','Sari','Tegar','Umar','Vina','Wulan','Yoga','Zahra','Bagas','Cinta','Dimas','Erna','Fajar','Gita','Hendra','Izza','Jasmine','Kevin','Laras','Mahesa','Nadia','Oscar','Permata','Rafi']
const LAST = ['Pratama','Wijaya','Santoso','Kurniawan','Hidayat','Saputra','Nugroho','Ramadhan','Gunawan','Halim','Siregar','Anggraini','Mahendra','Setiawan','Lestari','Firmansyah','Utami','Wibowo','Kusuma','Prameswari']
const CITY = [
  { city: 'Jakarta Selatan', prov: 'DKI Jakarta', zip: '12190' },
  { city: 'Jakarta Barat', prov: 'DKI Jakarta', zip: '11440' },
  { city: 'Jakarta Timur', prov: 'DKI Jakarta', zip: '13330' },
  { city: 'Bandung', prov: 'Jawa Barat', zip: '40111' },
  { city: 'Bekasi', prov: 'Jawa Barat', zip: '17111' },
  { city: 'Depok', prov: 'Jawa Barat', zip: '16411' },
  { city: 'Tangerang', prov: 'Banten', zip: '15111' },
  { city: 'Semarang', prov: 'Jawa Tengah', zip: '50111' },
  { city: 'Yogyakarta', prov: 'DI Yogyakarta', zip: '55211' },
  { city: 'Surabaya', prov: 'Jawa Timur', zip: '60111' },
  { city: 'Malang', prov: 'Jawa Timur', zip: '65111' },
  { city: 'Denpasar', prov: 'Bali', zip: '80111' },
  { city: 'Medan', prov: 'Sumatera Utara', zip: '20111' },
  { city: 'Palembang', prov: 'Sumatera Selatan', zip: '30111' },
  { city: 'Makassar', prov: 'Sulawesi Selatan', zip: '90111' },
]
const METHODS = ['BCA','BNI','Mandiri','GoPay','OVO','DANA','QRIS']
const COURIERS = ['JNE','J&T Express','SiCepat','AnterAja','ID Express']
const STREET = ['Jl. Melati No. 12','Jl. Kenanga No. 5','Jl. Mawar Raya 8','Jl. Cendana 21','Jl. Anggrek 3','Jl. Flamboyan 14','Jl. Bougenville 7','Jl. Kamboja 19','Jl. Dahlia 2','Jl. Teratai 30','Jl. Sakura 6','Jl. Cempaka 11','Jl. Asoka 9','Jl. Seroja 17','Jl. Lavender 4']

const REVIEW_TEXT = [
  'Bahannya enak banget, adem dan awet dipakai.', 'Ukurannya pas seperti di deskripsi. Recommended!',
  'Kualitas premium, jahitan rapi. Worth it banget.', 'Warnanya sesuai foto. Ga nyesel beli di GAUL.',
  'Orderan datang cepat dan rapi. Barangnya oke.', 'Bahan agak tipis tapi nyaman. Sesuai harga.',
  'Cocok banget buat daily outfit. Bakal repeat order.', 'Kemasan premium, dapet surat ucapan juga. Cakep!',
  'Pertama order, ternyata bagus. Delivery cepat.', 'Size-nya pas, jatuhnya rapi. Mantap.',
  'Nuansanya elegan, bahan tebal. Banyak yang nanya.', 'Enak dipakai seharian, fleksibel buat kerja juga.',
  'Highlight: warna natural-nya cantik.', 'Suka banget, nyaman dan simpel. GAUL terbaik.',
  'Sudah langganan 2x, kualitas selalu konsisten.',
]

// ─── Helpers waktu ───────────────────────────────────────────────────
const HOURS = 3600 * 1000
const DAYS = 24 * HOURS

function dateAgo({ months = 0, days = 0 }) {
  const base = new Date()
  const t = Date.now() - months * 30 * DAYS - (days + (rnd() - 0.5) * 2) * DAYS
  return new Date(Math.min(t, base.getTime()))
}

const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genOrderId() {
  const timeStr = Date.now().toString(36).toUpperCase().slice(-4)
  let s = ''
  for (let i = 0; i < 5; i++) s += ID_CHARS[Math.floor(rnd() * ID_CHARS.length)]
  return `GAUL-${timeStr}${s}`
}

// status sesuai umur order (hari)
function pickStatus(ageDays) {
  const r = rnd()
  if (ageDays > 90) return r < 0.88 ? 'completed' : r < 0.93 ? 'shipped' : 'cancelled'
  if (ageDays > 30) return r < 0.7 ? 'completed' : r < 0.85 ? 'shipped' : r < 0.93 ? 'processing' : 'cancelled'
  if (ageDays > 7) return r < 0.35 ? 'shipped' : r < 0.6 ? 'processing' : r < 0.8 ? 'paid' : r < 0.93 ? 'completed' : 'cancelled'
  return r < 0.2 ? 'pending' : r < 0.4 ? 'paid' : r < 0.65 ? 'processing' : r < 0.88 ? 'shipped' : 'completed'
}

async function main() {
  console.log('── Demo seed: menjadikan DB tampak berjalan ±1 tahun ──')

  const products = await prisma.product.findMany()
  if (!products.length) {
    console.error('ERROR: Belum ada produk. Jalankan `npm run db:seed` dulu.')
    process.exit(1)
  }
  const sortedProducts = [...products].sort((a, b) => a.id - b.id)

  // ── 1. Bersihkan data demo (idempoten) ──
  console.log('Membersihkan data demo lama...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.review.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.adminLog.deleteMany()
  await prisma.loginLog.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.passwordReset.deleteMany()
  await prisma.user.deleteMany({ where: { role: 'customer' } })

  const admins = await prisma.user.findMany({ where: { role: { in: ['admin', 'super_admin'] } } })

  // ── 2. Pelanggan (tersebar per bulan selama ~1 tahun) ──
  console.log('Membuat pelanggan...')
  const pwHash = await bcrypt.hash('password123', 10)
  const customers = []
  const usedName = new Set()
  for (let i = 0; i < 42; i++) {
    let name = `${pick(FIRST)} ${pick(LAST)}`
    let guard = 0
    while (usedName.has(name) && guard++ < 10) name = `${pick(FIRST)} ${pick(LAST)}`
    usedName.add(name)
    // 1/3 pelanggan baru-baru ini, 2/3 tersebar dalam 3–12 bulan
    const regAgo = i % 3 === 0 ? randInt(0, 30) : randInt(90, 360)
    const u = await prisma.user.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}${randInt(1, 99)}@gmail.com`,
        phone: `08${randInt(100000000, 999999999)}`,
        passwordHash: pwHash,
        role: 'customer',
        createdAt: dateAgo({ days: regAgo }),
      },
    })
    customers.push(u)
  }

  // ── 3. Bangun order 12 bulan (bisnis tumbuh) ──
  console.log('Membangun riwayat order 12 bulan...')
  const monthlyCounts = [8, 11, 14, 17, 21, 25, 29, 34, 38, 43, 48, 54]
  const soldPerProduct = new Map()
  const allOrders = []
  const reviewTargets = []
  let seq = 0

  for (let m = 0; m < 12; m++) {
    for (let k = 0; k < monthlyCounts[m]; k++) {
      const monthsAgo = 11 - m
      const createdAt = dateAgo({ months: monthsAgo, days: randInt(0, 27) })
      createdAt.setHours(randInt(9, 21), randInt(0, 59), 0, 0)

      const itemCount = randInt(1, 4)
      const chosen = new Set()
      const items = []
      let subtotal = 0
      for (let it = 0; it < itemCount; it++) {
        let p = sortedProducts[Math.floor(rnd() * sortedProducts.length)]
        let guard = 0
        while (chosen.has(p.id) && guard++ < 8) p = sortedProducts[Math.floor(rnd() * sortedProducts.length)]
        chosen.add(p.id)
        const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ['M']
        const colors = Array.isArray(p.colors) && p.colors.length ? p.colors : [{ name: 'Default', hex: '#CCCCCC' }]
        const size = pick(sizes)
        const col = pick(colors)
        const qty = randInt(1, 2)
        const price = Number(p.price) || 150000
        subtotal += price * qty
        soldPerProduct.set(p.id, (soldPerProduct.get(p.id) || 0) + qty)
        items.push({ productId: p.id, variant: { size, colorName: col.name, color: col.hex }, qty, priceAtPurchase: price })
      }

      const shipping = rnd() < 0.78 ? randInt(12000, 45000) : 0
      const isGuest = rnd() < 0.15
      const customer = isGuest ? null : pick(customers)
      const city = pick(CITY)
      const buyerName = customer?.name || `${pick(FIRST)} ${pick(LAST)}`
      const shippingAddress = `${buyerName}, ${pick(STREET)}, ${city.city}, ${city.prov}, Kode Pos: ${city.zip}, Telp: 08${randInt(100000000, 999999999)}`

      const status = pickStatus((Date.now() - createdAt.getTime()) / DAYS)
      const courier = pick(COURIERS)
      const method = pick(METHODS)
      const paymentMethod = shipping > 0 ? `${method} | Kurir: ${courier}` : method
      const paymentRef = ['paid', 'processing', 'shipped', 'completed'].includes(status)
        ? `TRX-${Date.now().toString(36).toUpperCase().slice(-6)}${randInt(100, 999)}`
        : null
      const trackingNumber = (status === 'shipped' || status === 'completed')
        ? `${courier.split(' ')[0].toUpperCase()}-${randInt(10000000, 99999999)}`
        : null

      const id = genOrderId()
      allOrders.push({
        id,
        userId: customer?.id ?? null,
        status,
        total: subtotal + shipping,
        shippingAddress,
        paymentMethod,
        paymentRef,
        trackingNumber,
        createdAt,
        items,
      })
      // target ulasan: rata-rata 1 dari 3 order selesai
      if ((status === 'completed' || status === 'shipped') && rnd() < 0.35) {
        reviewTargets.push({ orderId: id, orderUserId: customer?.id, item: items[0], createdAt })
      }
      seq++
    }
  }
  console.log(`  → ${allOrders.length} order dibuat.`)

  // ── 4. Simpan orders (chunked) ──
  console.log('Menyimpan order & item...')
  const savedOrderId = new Set()
  const CHUNK = 40
  for (let i = 0; i < allOrders.length; i += CHUNK) {
    const chunk = allOrders.slice(i, i + CHUNK)
    await Promise.all(chunk.map(async (o) => {
      const order = await prisma.order.create({
        data: {
          id: o.id,
          userId: o.userId,
          status: o.status,
          total: o.total,
          shippingAddress: o.shippingAddress,
          paymentMethod: o.paymentMethod,
          paymentRef: o.paymentRef,
          trackingNumber: o.trackingNumber,
          createdAt: o.createdAt,
          items: { create: o.items.map(it => ({ ...it })) },
        },
        include: { items: true, user: { select: { name: true } } },
      })
      savedOrderId.add(order.id)
    }))
  }

  // ── 5. Ulasan produk ──
  console.log('Membuat ulasan produk...')
  const reviewData = []
  for (const t of reviewTargets) {
    const rating = (() => { const r = rnd(); return r < 0.62 ? 5 : r < 0.9 ? 4 : r < 0.98 ? 3 : 2 })()
    const comment = pick(REVIEW_TEXT)
    reviewData.push({
      productId: t.item.productId,
      userId: t.orderUserId || customers[0].id,
      orderId: t.orderId,
      rating,
      comment,
      createdAt: new Date(t.createdAt.getTime() + randInt(2, 10) * DAYS),
    })
  }
  for (let i = 0; i < reviewData.length; i += CHUNK) {
    const chunk = reviewData.slice(i, i + CHUNK)
    await Promise.all(chunk.map(async (r) => {
      try { await prisma.review.create({ data: r }) } catch { /* bahan/order mungkin terhapus */ }
    }))
  }

  // ── 6. Wishlist ──
  console.log('Membuat wishlist...')
  for (const c of customers) {
    if (rnd() < 0.45) continue
    const used = new Set()
    const count = randInt(1, 4)
    for (let i = 0; i < count; i++) {
      const p = pick(sortedProducts)
      if (used.has(p.id)) continue
      used.add(p.id)
      try { await prisma.wishlist.create({ data: { userId: c.id, productId: p.id } }) } catch { /* dup */ }
    }
  }

  // ── 7. Notifikasi (koleksi baru + promo) ──
  console.log('Membuat notifikasi...')
  const notifications = []
  sortedProducts.forEach((p, i) => {
    if (i % 4 !== 0) return
    notifications.push({
      type: 'new_collection',
      title: `Koleksi Baru: ${p.name}`,
      message: `${p.name} — ${p.category} — sudah tersedia di GAUL. Cek koleksi terbaru kami!`,
      link: p.slug,
      sentAt: dateAgo({ days: randInt(2, 60) }),
    })
  })
  notifications.push(
    { type: 'promo', title: 'GRATIS ONGKIR Akhir Bulan', message: 'Gratis ongkir semua order minimal belanja Rp250rb. Berlaku sementara!', link: '/produk', sentAt: dateAgo({ days: randInt(3, 12) }) },
    { type: 'promo', title: 'Flash Sale 20%', message: 'Potongan 20% untuk kategori Outerwear & Aksesoris. Hanya 3 hari!', link: '/produk', sentAt: dateAgo({ days: randInt(40, 90) }) },
    { type: 'promo', title: 'Koleksi Eid Terbaru', message: 'Racikan outfit raya dari GAUL — rapi, adem, dan tetap kasual.', link: '/produk', sentAt: dateAgo({ days: randInt(120, 180) }) },
  )
  await prisma.notification.createMany({ data: notifications })

  // ── 8. Chat CS ──
  console.log('Membuat riwayat chat CS...')
  const chatSeeds = [
    { a: 'Kak, bahan Linen Overshirt-nya tebal gak?', b: 'Untuk linen sudah cukup tebal dan adem ya, enak dipakai seharian.' },
    { a: 'Kalau ukuran M untuk tinggi 170 cocok gak?', b: 'Amannya M, kalau mau agak longgar bisa naik ke L. Ada size guide juga di halaman produk.' },
    { a: 'Bisa COD ga kak?', b: 'Sementara belum tersedia COD ya, tapi mudah: transfer VA, GoPay, OVO, DANA, atau QRIS.' },
    { a: 'Estimasi sampai Bandung berapa hari?', b: 'Reguler 2–4 hari kerja. Begitu dikirim, nomor resi langsung muncul di halaman pesanan.' },
    { a: 'Bahan Sweater-nya nyerap bau gak?', b: 'Rajutannya rapat dan sudah ada anti-bakteri treatment, jadi aman seharian.' },
    { a: 'Kapan restock Cargo Pants warna Coffee?', b: 'Stok baru diperkirakan masuk 2 minggu lagi. Nyalakan notifikasi biar dikabarkan.' },
  ]
  for (let i = 0; i < chatSeeds.length; i++) {
    const u = customers[(i + 3) % customers.length]
    const seed = chatSeeds[i]
    const convoEnd = dateAgo({ days: randInt(0, 3) })
    const unreadLatest = i < 2
    const msgs = [
      { sender: 'customer', message: `Halo kak, mau tanya. ${seed.a}` },
      { sender: 'admin', message: `Halo! Terima kasih sudah mampir di GAUL. ${seed.b}` },
      { sender: 'customer', message: 'Oke makasih kak, kalau begitu aku bereskan ordernya.' },
    ]
    for (let mi = 0; mi < msgs.length; mi++) {
      const m = msgs[mi]
      const isLast = mi === msgs.length - 1
      const createdAt = new Date(convoEnd.getTime() - (msgs.length - mi - 1) * 2 * HOURS)
      try {
        await prisma.chatMessage.create({
          data: {
            userId: u.id,
            sender: m.sender,
            messageType: 'text',
            message: m.message,
            isRead: !(isLast && unreadLatest),
            createdAt,
          },
        })
      } catch { /* skip */ }
    }
  }

  // ── 9. Log admin & login (sepanjang tahun) ──
  console.log('Membuat log admin & login staff...')
  if (admins.length) {
    const loginLogs = []
    const adminActions = []
    const monthsAgo = []
    for (let m = 0; m < 12; m++) monthsAgo.push(11 - m)
    for (const ma of monthsAgo) {
      const admin = admins[Math.floor(rnd() * admins.length)]
      const loginDate = dateAgo({ months: ma, days: randInt(1, 28) })
      loginLogs.push({ userId: admin.id, name: admin.name, role: admin.role, ip: `182.253.${randInt(10, 250)}.${randInt(1, 254)}`, createdAt: loginDate })
      const actCount = randInt(3, 7)
      for (let a = 0; a < actCount; a++) {
        const p = pick(sortedProducts)
        const o = allOrders[Math.floor(rnd() * allOrders.length)]
        const roll = rnd()
        const action = roll < 0.4
          ? { action: 'update_order_status', target: `Order: ${o?.id}`, detail: 'update status order' }
          : roll < 0.7
            ? { action: 'update_product', target: `Product: ${p.name} (#${p.id})`, detail: 'update stok varian' }
            : { action: 'create_product', target: `Product: ${p.name} (#${p.id})`, detail: 'produk baru koleksi' }
        adminActions.push({
          userId: admin.id, name: admin.name,
          action: action.action, target: action.target, detail: action.detail,
          createdAt: new Date(loginDate.getTime() + randInt(1, 8) * HOURS),
        })
      }
    }
    await prisma.loginLog.createMany({ data: loginLogs })
    await prisma.adminLog.createMany({ data: adminActions })
  }

  // ── 10. Kupon ──
  console.log('Membuat kupon...')
  await prisma.coupon.createMany({
    data: [
      { code: 'GAUL10', type: 'percentage', value: 10, minPurchase: 200000, maxUses: 500, usedCount: randInt(120, 180), isActive: true, expiresAt: null },
      { code: 'HEMAT20', type: 'fixed', value: 20000, minPurchase: 150000, maxUses: 300, usedCount: randInt(60, 90), isActive: true, expiresAt: null },
      { code: 'ONGKIR0', type: 'fixed', value: 30000, minPurchase: 250000, maxUses: 200, usedCount: randInt(30, 55), isActive: true, expiresAt: dateAgo({ days: randInt(20, 40) }) },
      { code: 'RAMADHAN15', type: 'percentage', value: 15, minPurchase: 250000, maxUses: 400, usedCount: randInt(200, 260), isActive: false, expiresAt: dateAgo({ days: randInt(150, 200) }) },
    ],
  })

  // ── 11. Finalisasi produk: featured + stok dari penjualan ──
  console.log('Finalisasi produk (featured & stok)...')
  const featuredIds = new Set()
  sortedProducts.filter((p, i) => i % 4 === 0).forEach(p => featuredIds.add(p.id))

  for (const p of sortedProducts) {
    const sold = soldPerProduct.get(p.id) || 0
    // stok awal dari DB dianggap baseline +99 restock; stok akhir = baseline - terjual
    const baseline = clamp(Number(p.stock) || 0, 8, 40) + 99
    let stock = clamp(baseline - sold, 0, 120)
    if (p.slug === 'cotton-tee') stock = Math.max(stock, 18) // E2E & hero sering pakai produk ini
    // hanya sebagian produk (selain cotton-tee) yang menipis/habis agar dashboard hidup
    if (p.slug !== 'cotton-tee' && (p.id % 11 === 0)) stock = randInt(2, 5)
    if (p.slug !== 'cotton-tee' && (p.id % 23 === 0)) stock = 0
    await prisma.product.update({ where: { id: p.id }, data: { stock, isFeatured: featuredIds.has(p.id), stockPerVariant: null } })
  }

  // ── Ringkasan ──
  const oCount = await prisma.order.count()
  const rCount = await prisma.review.count()
  const cCount = await prisma.chatMessage.count()
  const uCount = await prisma.user.count()
  const pCount = await prisma.product.count()
  console.log('')
  console.log('── Selesai ──')
  console.log(`Produk ${pCount} | Pelanggan ${uCount - admins.length} | Order ${oCount} | Ulasan ${rCount} | Chat ${cCount}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())