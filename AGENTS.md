# AGENTS.md — Panduan untuk Semua Agent (Manager, Frontend, Backend, Security)

> **Status Project**: ✅ SEMUA DOMAIN SELESAI (Frontend 100%, Backend 100%, Security 100%, E2E 18/18).
> Dokumen ini mencerminkan kondisi kode aktual per 2026-07-20.

## Ringkasan Project
E-commerce toko outfit casual daily, mid-range, target pasar lokal, unisex.
Model bisnis: repeat purchase, koleksi baru tiap bulan. Frontend adalah prioritas
kualitas tertinggi — harus interaktif dan terasa premium (referensi: Apple product page).

Fitur di luar PRD asli yang sudah diimplementasi: live chat CS (SSE real-time),
multi-tier role (super_admin + admin staff), tracking/resi + cetak label,
notifikasi in-app, RajaOngkir shipping, QRIS payment, admin dashboard charts,
loading skeletons, custom 404, rate limiting, security headers.

## Tech Stack (Aktual)
- **Frontend**: Next.js v16 (App Router) + React v19 + JavaScript
- **Styling**: Tailwind CSS v4 (`@theme` directives, no tailwind.config.js)
- **Animasi**: Framer Motion v12 (micro-interaction) + GSAP v3 (ScrollTrigger scroll storytelling)
- **Backend**: Next.js API routes / route handlers (24 endpoints)
- **Database**: MySQL via Prisma ORM v6
- **Auth**: NextAuth.js v4 (Credentials provider, JWT session, without Prisma adapter)
- **Payment**: Midtrans Snap (popup embedded) — BCA/BNI/Mandiri/GoPay/OVO/DANA/QRIS
- **Real-time**: SSE (Server-Sent Events) via in-memory event bus untuk live chat
- **Shipping**: RajaOngkir API (komerce.id) — cost calculation, province/city lookup
- **Validasi**: Zod v4 (server-side di semua endpoint)
- **Password**: bcryptjs
- **E2E Testing**: Playwright (18 tests, 4 spec files)
- **Hosting**: Vercel (frontend) + free-tier MySQL host (Railway/Aiven)

## Struktur Folder (Aktual)
```
/app                      → routes (Next.js App Router)
  /(shop)                  → halaman customer
    page.js                → homepage (hero GSAP, koleksi, kategori, tentang)
    cart/page.js           → keranjang
    checkout/page.js       → checkout (alamat, kirim, bayar)
    produk/
      page.js              → katalog (search/filter/sort)
      [slug]/page.js       → detail produk (gallery, varian, ulasan)
  /account                 → halaman akun
    layout.js              → sidebar AccountNav, auth guard
    page.js                → redirect ke /account/profile
    login/page.js          → login (role-based redirect)
    register/page.js       → register
    profile/page.js        → edit profil
    orders/
      page.js              → daftar pesanan
      [id]/page.js         → detail pesanan (timeline, bayar, cancel, review, upload bukti)
    wishlist/page.js       → produk favorit
    notifications/page.js  → riwayat notifikasi
  /admin                   → CMS
    layout.js              → admin guard (admin + super_admin)
    page.js                → dashboard + kelola produk + charts
    pesanan/page.js        → kelola pesanan (tabs, sync, resi, cetak label)
    hero/page.js           → kelola banner hero
    chat/page.js           → live chat inbox (split-screen, template balasan)
    users/page.js          → kelola staff (super_admin only)
    produk/
      add/page.js          → tambah produk (dengan color picker)
      [id]/edit/page.js    → edit produk
  /api                     → 24 route handlers backend
    /auth/[...nextauth]    → NextAuth handler
    /auth/register         → POST register (zod + bcrypt)
    /auth/profile          → PUT update profil
    /admin/users           → GET/POST/PUT kelola staff (super_admin only)
    /products              → GET (filter/search/sort) + POST (admin)
    /products/[id]         → GET/PUT/DELETE produk
    /products/slug/[slug]  → GET by slug
    /orders                → GET (own/all) + POST (create)
    /orders/[id]           → GET/PUT (status, tracking, proof)
    /hero                  → GET + POST
    /hero/[id]             → PUT/DELETE
    /midtrans/create-transaction → POST Snap token
    /midtrans/webhook      → POST payment notification
    /midtrans/check-status → POST sync status
    /rajaongkir/cost       → POST shipping cost
    /rajaongkir/provinces  → GET
    /rajaongkir/cities     → GET
    /wishlist              → GET + POST
    /reviews               → GET + POST
    /notifications         → GET + POST
    /chat                  → GET + POST messages
    /chat/stream           → GET SSE stream (customer)
    /chat/admin-stream     → GET SSE stream (admin)
    /chat/typing           → POST typing indicator
  globals.css              → Tailwind v4 + design tokens
  layout.js                → root layout (fonts, metadata)
  error.js                 → error boundary (client component)
  not-found.js             → custom 404 ("Halaman Tidak Ditemukan")

/components
  /ui                      → komponen reusable
    Button.js              → primary/outline/ghost variants
    Container.js           → max-w-7xl wrapper
    ConfirmModal.js        → Framer Motion confirmation modal
    PageTransition.js      → fade/slide page transition wrapper
    Skeleton.js            → Skeleton / ProductCardSkeleton / ProductGridSkeleton
  /shop                    → komponen khusus shop
    Navigation.js          → fixed top nav, mobile hamburger portal, auth-aware, cart badge, CMS link
    HeroSection.js         → GSAP scroll storytelling (crossfade, parallax)
    ProductCard.js         → hover image swap, category pill, color dots, stock badge
    SearchBar.js           → debounced search input
    FilterSidebar.js       → desktop sticky + mobile bottom sheet
    CartItem.js            → qty +/- hapus
    AccountNav.js          → sidebar nav (SVG icons, active bg-hitam, logout)
    Footer.js              → 4 kolom + newsletter + copyright
    ChatWidget.js          → floating chat bubble (SSE, quick questions, badge unread)
    NotificationBell.js    → bell icon + dropdown 5 notifikasi terbaru
  Providers.js             → root client: SessionProvider + CartProvider

/lib                       → helper & konfigurasi
  prisma.js                → Prisma singleton client
  auth.js                  → NextAuth config (Credentials, JWT, rate-limited)
  session.js               → getSession, requireUser, requireAdmin (DB re-fetch)
  cart-context.js          → React Context + localStorage untuk cart
  serialize.js             → serializeProduct, serializeOrder
  midtrans.js              → Snap client, signature verify, status mapping
  rate-limit.js            → in-memory rate limiter (Map, auto-cleanup)
  chat-bus.js              → in-memory SSE event bus pub/sub
  admin-store.js           → [DEPRECATED] localStorage CRUD (diganti API)
  auth-context.js          → [DEPRECATED] dummy auth (diganti NextAuth)

/prisma
  schema.prisma            → 9 models, 3 enums (lihat Kontrak Data di PRD.md)
  seed.js                  → seed admin/owner + 8 produk + 2 hero
  migrations/              → 6 migration files

/e2e                       → Playwright tests
  auth-flow.spec.js        → 4 tests (register, login, wrong creds, admin redirect)
  shop-flow.spec.js        → 6 tests (homepage, catalog, detail, guest→login, cart, add-to-cart)
  admin-flow.spec.js       → 4 tests (dashboard, orders, hero, add product)
  payment-flow.spec.js     → 4 tests (add-to-cart→cart, checkout, empty cart, guest redirect)

/public
  /payments/               → 7 SVG logo pembayaran (bca, bni, mandiri, gopay, ovo, dana, qris)

PRD.md                     → Product Requirements Document (updated — sinkron dengan kode)
AGENTS.md                  → Panduan agent ini
PROGRESS.md                → Log progress lengkap semua sesi
```

## Design Tokens

### Palette (Tailwind v4 `@theme`)
| Token | Hex | Usage |
|---|---|---|
| `--color-bg-warm` | `#FAFAF7` | Page background |
| `--color-bg-section` | `#F0EDE6` | Section alternate background |
| `--color-surface` | `#FFFFFF` | Cards, containers |
| `--color-text-primary` | `#1C1C1A` | Body, headings |
| `--color-text-secondary` | `#6B655A` | Labels, captions |
| `--color-accent` | `#D4A373` | Highlights, CTAs, decorative |

### Typography
| Role | Font | Fallback |
|---|---|---|
| Display (headline) | `DM Serif Display` | `serif` |
| Body | `DM Sans` | `sans-serif` |

Pasangan serif+sans dari keluarga yang beda — display pakai serif editorial untuk headline besar, body pakai sans geometric yang bersih.

### Signature
**Hero scroll-storytelling**: gambar produk bertransformasi saat scroll, headline terbelah dengan reveal animation, fade-in/slide-up tiap seksi — ala editorial fashion spread Apple.

## Kontrak Data
Rujuk ke `PRD.md` bagian "Kontrak Data" — SEMUA agent (frontend & backend) WAJIB
memakai skema ini apa adanya. Skema sudah mencakup 9 model dan 3 enum (perbedaan dari
PRD asli: ada model `ChatMessage`, field `snapToken`/`trackingNumber`/`receivedProofImage`
di Order, serta role `super_admin`). Kalau ada kebutuhan mengubah skema di tengah jalan,
Manager harus update PRD.md dulu sebelum ada agent yang implementasi ulang.

## Aturan Kode (Semua Domain)
- Kode minimalis, hemat token, hindari over-engineering (selaras dengan plugin `opencode-ponytail`)
- Tidak menambahkan library baru di luar stack yang disepakati tanpa izin Manager
- Commit per unit kerja logis, pesan commit jelas
- Update `PROGRESS.md` setiap kali sesi berakhir/handoff (pakai command `/handoff`)

## Aturan Per-Domain

### Frontend
- WAJIB menghindari tampilan generik/"AI slop" — pakai skill `frontend-ui-ux` (oh-my-opencode)
- Implementasi animasi/interaksi sesuai spesifikasi di PRD.md bagian 6 (scroll storytelling,
  hover effect, micro-interaction, page transition, scroll reveal) — ini bukan opsional
- Responsif mobile-first (mobile adalah traffic utama), tapi desktop tetap harus premium
- Selesaikan SEMUA halaman/komponen frontend sebelum lanjut ke backend (workflow per-domain)
- Gunakan data dummy/mock sesuai Kontrak Data selama backend belum siap
- **Status saat ini**: ✅ SEMUA frontend selesai (halaman customer, akun, admin CMS + 15 komponen)

### Backend
- Ikuti Kontrak Data di PRD.md secara ketat — jangan improvisasi skema baru
- Akses MySQL via MCP bersifat read-only secara default; write access hanya untuk migrasi/seed terkontrol
- Validasi input di semua endpoint (terutama checkout & payment) — pakai Zod
- Integrasi Midtrans: gunakan sandbox/testing mode terlebih dahulu sebelum production key
- Baru mulai setelah Frontend dinyatakan selesai oleh Manager
- **Status saat ini**: ✅ SEMUA backend selesai (24 API endpoints, Prisma 9 models, 6 migrations)

### Security
- Review bersifat read-only — TIDAK mengubah kode langsung, hanya melaporkan temuan
- Audit mencakup: auth flow, payment flow (khususnya callback/webhook Midtrans), input validation,
  exposure data sensitif (password, token, API key)
- Gunakan Playwright untuk menguji flow cart → checkout secara nyata di browser
- Temuan kritis wajib dikirim balik ke Manager untuk diteruskan ke Frontend/Backend terkait
- **Status saat ini**: ✅ Security audit selesai — 14 temuan fixed (0 critical, 0 high, 0 medium)

### E2E Testing
- Gunakan Playwright untuk menulis test end-to-end
- Test file di `/e2e/`, konfigurasi di `playwright.config.js`
- Rate limiter bypass via env `SKIP_RATE_LIMIT=1` agar test tidak terblokir
- Setiap test file handle auth sendiri (tidak shared context) — test harus independent
- **Status saat ini**: ✅ 18 tests passing (4 auth + 6 shop + 4 admin + 4 payment)

## Larangan
- Jangan mulai domain berikutnya sebelum domain sebelumnya direview & disetujui Manager
- Jangan ubah Kontrak Data tanpa update PRD.md terlebih dahulu
- Jangan gunakan payment gateway/metode selain Midtrans
- Jangan skip animasi/interaksi frontend dengan alasan "biar cepat" — ini requirement inti, bukan hiasan
- Security subagent dilarang melakukan perubahan kode langsung
- Role `super_admin` hanya boleh dimiliki oleh owner — jangan expose create/edit super_admin via API
- Admin (staff) tidak boleh akses cart/checkout — guard di navigation, cart page, checkout page, add-to-cart
