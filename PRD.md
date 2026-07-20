# PRD — Toko Outfit Casual Daily (E-commerce)

> **Status**: FULLY IMPLEMENTED. Semua fitur P0, P1, dan beberapa P2 sudah selesai.
> Dokumen ini mencerminkan kondisi kode aktual per 2026-07-20.

## 1. Latar Belakang
Platform e-commerce untuk toko outfit kategori casual daily, positioning mid-range,
target pasar lokal, dengan model bisnis repeat purchase (koleksi baru dirilis tiap bulan).
Frontend menjadi diferensiasi utama — pengalaman berbelanja harus terasa premium dan interaktif,
terinspirasi dari gaya storytelling produk Apple (AirPods/iPhone landing page), dipadukan
dengan estetika editorial-majalah dan minimalis-clean.

## 2. Target User
- Unisex, casual daily shopper
- Device utama: mobile (prioritas), desktop tetap didukung penuh (responsive, bukan mobile-only)
- Perilaku: repeat purchase, mengikuti koleksi/promo baru tiap bulan
- Role admin: Super Admin (owner) dan Admin Staff (CS/gudang) — multi-tier role system

## 3. Fitur & Prioritas (Aktual)

### ✅ P0 — Implementasi penuh
| Fitur | Deskripsi | Catatan |
|---|---|---|
| Katalog produk | Listing produk, filter (kategori, ukuran, harga), search (debounce 300ms), sort | Client-side filter dari API |
| Detail produk | Galeri gambar crossfade, varian ukuran/warna (color picker + chip), deskripsi, tab collapsible | |
| Keranjang | Tambah/hapus/update qty, max 20 per item, localStorage persist via React Context | |
| Checkout | Form alamat (validasi), pilih pengiriman (reguler/express via RajaOngkir), pilih pembayaran (Midtrans + QRIS) | |
| Pembayaran | Integrasi Midtrans Snap popup — BCA/BNI/Mandiri/GoPay/OVO/DANA/QRIS | Sandbox aktif, Snap embedded |
| Akun user | Register/login (email+password), edit profil, riwayat pesanan, wishlist, notifikasi | NextAuth + JWT |
| CMS Admin — Produk | CRUD produk, toggle aktif/nonaktif, upload image URL, kelola warna (color picker + chip) | |
| CMS Admin — Pesanan | List pesanan, filter tab (Perlu Diproses/Menunggu/Diproses/Dikirim/Arsip), update status, input resi (AWB), cetak label, lihat bukti penerimaan, sync status Midtrans | |
| CMS Admin — Hero | CRUD banner (title, subtitle, CTA, image URL), toggle aktif/nonaktif, urutan | |
| Hero section dinamis | Scroll storytelling GSAP, gambar dari CMS, gradient overlay, parallax | |
| Manajemen status pesanan | Timeline 5-step (pending→paid→processing→shipped→completed), cancel, upload bukti terima | |
| Live chat CS | Floating chat widget (SSE real-time), admin inbox split-screen, quick responses, typing indicator | |
| Multi-tier role | Super Admin + Admin Staff + Customer; role-based access control di semua guard | |
| Tracking / Resi | Input nomor resi (AWB) oleh admin, cetak label pengiriman, upload bukti penerimaan pembeli | |
| Riwayat & detail pesanan | Daftar pesanan lengkap, detail per order dengan timeline, tombol bayar ulang, cek status, batalkan | |

### ✅ P1 — Implementasi penuh
| Fitur | Deskripsi |
|---|---|
| Wishlist | Simpan produk favorit, tampil di halaman akun `/account/wishlist` |
| Review & rating | Modal bintang 1-5 + komentar (max 2000 char) setelah pesanan `completed`, tampil di detail produk |
| Notifikasi produk baru & promo | In-app notification bell di Navigation, auto-trigger saat admin buat produk/hero baru, halaman riwayat notifikasi |
| Admin dashboard charts | CSS-only bar chart penjualan (6 bulan), donut status pesanan (conic-gradient), top 5 produk terlaris |
| Loading skeletons | ProductCardSkeleton, ProductGridSkeleton di homepage, katalog, detail produk |
| SEO metadata dinamis | `document.title` dari nama produk di halaman detail |

### ✅ P2 — Implementasi sebagian
| Fitur | Status |
|---|---|
| Newsletter subscribe | ✅ Terimplementasi di Footer (simpan ke localStorage) |
| Riwayat browsing / rekomendasi produk | ❌ Belum diimplementasikan |

### Fitur tambahan (di luar PRD asli)
| Fitur | Deskripsi |
|---|---|
| Pembayaran QRIS | Tambahan metode pembayaran selain transfer bank + e-wallet |
| RajaOngkir shipping | Kalkulasi ongkos kirim real-time (cost, provinces, cities API), auth-guarded |
| Cancel order (user-side) | User bisa batalkan pesanan sendiri jika status masih `pending` |
| Retry pembayaran | Snap token disimpan di DB — retry bayar tanpa buat transaksi baru ke Midtrans |
| Check status pembayaran | Endpoint `/api/midtrans/check-status` — sinkronisasi status dari Midtrans API |
| Admin guard | Role admin/super_admin diblokir akses cart & checkout — dialihkan ke CMS |
| Role-based redirect | Login/register redirect: admin → `/admin`, customer → homepage |
| Custom 404 + Error boundary | Halaman "Halaman Tidak Ditemukan" + error boundary dengan tombol reset |
| Security headers | CSP, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Rate limiting | Login (5/15menit), register (3/jam per IP), create-order (10/menit) — in-memory |
| Admin staff management | Super Admin bisa create/update/delete admin staff via `/admin/users` |
| Cetak label pengiriman | PDF-friendly print layout: logo, alamat pengirim/penerima, ekspedisi, packing checklist |

## 4. Tech Stack
| Layer | Pilihan | Catatan |
|---|---|---|
| Frontend | Next.js (React) v16, App Router | JavaScript |
| Styling | Tailwind CSS v4 | Desain custom dengan `@theme` directives |
| Database | MySQL (via Laragon local / Railway / Aiven) | — |
| ORM | Prisma v6 | Prisma v7 di-skip (wajib prisma.config.ts, overkill untuk MVP) |
| Auth | NextAuth.js v4 + JWT + Credentials Provider | Email/password; re-fetch role dari DB tiap request admin |
| Payment Gateway | **Midtrans** Snap (popup embedded) | BCA/BNI/Mandiri (transfer), GoPay/OVO/DANA (e-wallet), QRIS |
| Hosting (tier gratis) | Frontend: Vercel (free tier). DB: Railway/Aiven (free tier MySQL) | — |
| Animasi/interaksi | Framer Motion + GSAP (ScrollTrigger) | Framer Motion → micro-interaction, GSAP → scroll storytelling |
| Validasi input | Zod v4 | Server-side validation di semua endpoint |
| Password hashing | bcryptjs | Register + authorize |
| Real-time chat | SSE (Server-Sent Events) via in-memory event bus | Chat message pub/sub tanpa WebSocket |
| Shipping | RajaOngkir API (komerce.id) | Cost calculation, province/city lookup |
| E2E Testing | Playwright | 18 tests (auth, shop, admin, payment) |

### Daftar lengkap dependencies
```
next, react, react-dom
prisma, @prisma/client
next-auth v4, @auth/prisma-adapter
bcryptjs
zod
framer-motion, gsap
midtrans-client
@playwright/test (dev)
tailwindcss v4, @tailwindcss/postcss, postcss, autoprefixer (dev)
eslint, eslint-config-next (dev)
```

## 5. Kontrak Data (Skema Aktual — Prisma)

> Skema ini adalah source of truth. Lihat `prisma/schema.prisma` untuk definisi lengkap.
> Catatan: array fields (sizes, colors, images) disimpan sebagai JSON karena MySQL Prisma
> tidak mendukung scalar list native. Cart tidak disimpan di DB — pakai localStorage via React Context.

**Enum Role** — `customer | admin | super_admin`

**Enum OrderStatus** — `pending | paid | processing | shipped | completed | cancelled`

**Enum NotificationType** — `new_collection | promo`

**User**
```
id            Int        @id @default(autoincrement())
name          String
email         String     @unique
passwordHash  String
phone         String?
role          Role       @default(customer)
createdAt     DateTime   @default(now())
relations:    orders, reviews, wishlists, chatMessages
```

**Product**
```
id          Int      @id @default(autoincrement())
name        String
slug        String   @unique
description String   @db.Text
price       Int
category    String
sizes       Json                  // array of strings
colors      Json                  // array of { name, hex }
images      Json                  // array of URL strings
stock       Int      @default(0)  // total stok (ponytail: stock_per_variant map di-skip)
isActive    Boolean  @default(true)
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
relations:  orderItems, reviews, wishlists
```

**Order**
```
id                String      @id         // crypto.randomBytes(4) → hex
userId            Int?        (optional — guest checkout di masa depan)
status            OrderStatus @default(pending)
total             Int                     // dihitung server-side dari harga DB
shippingAddress   String      @db.Text
paymentMethod     String
paymentRef        String?                 // dari Midtrans
snapToken         String?     @db.Text    // reuse untuk retry bayar
trackingNumber    String?                 // nomor resi (AWB) input admin
receivedProofImage String?   @db.Text    // foto bukti terima dari pembeli
createdAt         DateTime    @default(now())
relations:        items (OrderItem[]), reviews
```

**OrderItem**
```
id              Int      @id @default(autoincrement())
orderId         String   (FK → Order)
productId       Int?     (FK → Product, optional jika produk dihapus)
variant         Json     // { size, colorName, colorHex }
qty             Int
priceAtPurchase Int      // harga saat checkout, tidak berubah walau harga produk naik
```

**HeroSection** (dikelola admin via CMS)
```
id        Int     @id @default(autoincrement())
imageUrl  String
title     String
subtitle  String
ctaText   String
ctaLink   String
isActive  Boolean @default(true)
order     Int     @default(0)
```

**Wishlist**
```
id        Int
userId    Int     (FK → User)
productId Int     (FK → Product)
@@unique([userId, productId])
```

**Review**
```
id        Int      @id @default(autoincrement())
productId Int      (FK → Product)
userId    Int      (FK → User)
orderId   String?  (FK → Order)
rating    Int      // 1-5
comment   String   @db.Text  (max 2000 char)
createdAt DateTime @default(now())
```

**Notification** (auto-trigger saat admin buat produk/hero baru)
```
id      Int              @id @default(autoincrement())
type    NotificationType  // new_collection | promo
title   String
message String  @db.Text
sentAt  DateTime @default(now())
```

**ChatMessage** (live chat CS — real-time via SSE)
```
id          Int      @id @default(autoincrement())
userId      Int      (FK → User)
sender      Role     @default(customer)  // customer | admin | super_admin
messageType String   @default("text")     // text | product
message     String   @db.Text  (max 4000 char)
metadata    Json?    // { productId, productName, productImage, productPrice } untuk messageType="product"
isRead      Boolean  @default(false)
createdAt   DateTime @default(now())
```

## 6. Inspirasi & Arah Desain Frontend

**Vibe**: Editorial-majalah + minimalis-clean, terinspirasi landing page produk Apple (AirPods/iPhone).

**Prinsip visual:**
- Whitespace besar, tipografi besar sebagai elemen desain utama (bukan sekadar teks)
- Grid asimetris ala majalah untuk section produk/promo
- Foto produk jadi fokus utama — kualitas & framing gambar sangat penting

**Interaksi & animasi wajib:**
- **Hero/landing**: scroll-driven storytelling — gambar produk berubah/reveal mengikuti posisi scroll (pakai GSAP ScrollTrigger)
- **Product listing**: hover effect halus (zoom/ganti foto kedua saat hover)
- **Product detail**: sticky gallery di satu sisi, detail scroll di sisi lain
- **Add to cart**: micro-interaction feedback instan (bukan cuma spinner — animasi kecil yang terasa "hidup")
- **Page transition**: transisi antar halaman smooth (fade/slide), tidak boleh terasa kaku/reload biasa
- **Scroll reveal**: elemen fade-in/slide-up saat masuk viewport

**Yang harus dihindari**: tampilan generik/template ("AI slop") — semua interaksi harus terasa disengaja dan halus, bukan animasi asal tempel.

## 7. Batasan (Aktual)
- Budget: layanan gratis/free-tier di semua layanan (hosting, DB, dsb)
- Tim: dikerjakan solo, dibantu AI agent (OpenCode: manager + subagent frontend/backend/security)
- Waktu: fleksibel, tidak ada deadline ketat
- Workflow: **Semua domain sudah selesai** (Frontend 100%, Backend 100%, Security 100%, E2E 18 tests passing)
- Cart tidak dipersist ke database — hanya localStorage client-side
- Shipping cost (RajaOngkir) belum terintegrasi ke order total — Midtrans pakai subtotal produk saja
- Live chat menggunakan in-memory event bus (SSE) — tidak persist riwayat lintas server restart (riwayat tetap di DB via ChatMessage model)
- Rate limiter in-memory (Map-based) — akan hilang saat server restart, cocok untuk single-instance deployment
- Seed password wajib diisi via env `SEED_ADMIN_PASSWORD` dan `SEED_OWNER_PASSWORD` — tidak ada default

## 8. Kriteria Selesai (Definition of Done) — ✅ Semua Terpenuhi
| # | Kriteria | Status |
|---|---|---|
| 1 | Semua fitur P0 berfungsi end-to-end (browse → cart → checkout → bayar → order masuk ke CMS) | ✅ Terverifikasi via E2E test |
| 2 | CMS admin bisa kelola produk, pesanan, dan hero section tanpa perlu developer | ✅ Terverifikasi via E2E test |
| 3 | Frontend responsif penuh di mobile & desktop | ✅ Mobile-first implementation, semua halaman responsif |
| 4 | Semua interaksi/animasi terimplementasi (scroll storytelling GSAP, hover effect, micro-interaction Framer Motion, page transition, scroll reveal) | ✅ |
| 5 | Security review tidak menemukan temuan kritis | ✅ 14 temuan fixed (0 critical, 0 high) |
| 6 | Flow cart→checkout diuji otomatis via Playwright | ✅ 18 E2E tests passing (auth 4, shop 6, admin 4, payment 4) |
| 7 | Multi-tier role system (super_admin + admin + customer) berfungsi penuh | ✅ Auth guard di semua endpoint, admin guard cart/checkout |
| 8 | Live chat CS real-time via SSE | ✅ Floating widget + admin inbox + typing indicator |
| 9 | Tracking/resi + bukti penerimaan | ✅ Input AWB, cetak label, upload bukti |
| 10 | Custom error handling (404, error boundary, loading skeletons) | ✅ Semua halaman punya error/loading state |
