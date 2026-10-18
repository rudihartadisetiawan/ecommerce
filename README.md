# 👔 GAUL — E-Commerce Outfit Casual Daily

> **Toko fashion unisex mid-range** dengan model bisnis *repeat purchase* (koleksi baru tiap bulan). Frontend premium dan interaktif — bukan template generik.

**[Screenshot 1 — Homepage Hero Section]**
**[Screenshot 2 — Catalog dengan filter]**
**[Screenshot 3 — Admin Dashboard]**
**[Screenshot 4 — Checkout Flow]**

> ⚠️ **Placeholder screenshot**: Ambil screenshot dari `localhost:3000` setelah run, crop 4 area di atas, upload ke folder `public/screenshots/`, dan ganti `src` di atas dengan `/screenshots/nama-file.png`.

---

## Fitur Utama

### 🛍️ Customer-facing
- **Katalog produk** dengan search autocomplete, filter multi-dimensi (kategori, ukuran, harga), sort, dan pagination Load More
- **Detail produk** — gallery image crossfade, varian ukuran/warna (color picker + chip), image zoom follow-mouse (desktop), tab deskripsi collapsible, rating & ulasan
- **Scroll storytelling hero** via GSAP ScrollTrigger — gambar produk bertransformasi saat scroll, terinspirasi dari gaya presentasi produk Apple
- **Live chat CS real-time** (SSE) — floating bubble widget + quick questions + typing indicator
- **Guest checkout** — belanja tanpa registrasi
- **Akun pengguna** — profil, riwayat pesanan dengan timeline 5-step, wishlist, notifikasi in-app, upload bukti penerimaan, retry pembayaran

### 🛒 Checkout & Payment
- **Midtrans Snap popup embedded** — BCA/BNI/Mandiri (virtual account), GoPay/OVO/DANA (e-wallet), QRIS
- **RajaOngkir shipping** — kalkulasi ongkos kirim real-time (provinsi/kota, cost calculation)
- **Kupon diskon** — persentase/fixed, syarat minimum, batas pemakaian, validasi server-side
- **Server-side price calculation** — harga dihitung ulang dari database, klien tidak bisa memanipulasi total pesanan

### 🔐 Admin / CMS (3-tier role)
- **Super Admin (owner)** — dashboard dengan analisis keuangan (revenue, modal, laba kotor, margin), daftar top pelanggan, peringatan stok menipis, kelola staff
- **Admin Staff** — CRUD produk (dengan color picker), kelola pesanan (filter tab, input resi/AWB, cetak label pengiriman, sync status pembayaran), CRUD hero banner, live chat inbox split-screen, export CSV
- **Role-based access control** — admin staff tidak bisa mengakses cart/checkout, tidak bisa melihat data keuangan. Enforced di navigation, page level, dan API.

### ✨ Animasi & Interaksi
- **GSAP ScrollTrigger** — scroll storytelling hero dengan crossfade dan parallax
- **Framer Motion** — micro-interaction add-to-cart (bounce), page transition (fade/slide), modal konfirmasi (spring scale), scroll reveal, stagger list
- **Custom 404 page** + **Error boundary** — pengalaman error yang tetap on-brand

---

## Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** |
| Styling | **Tailwind CSS v4** (custom `@theme` design tokens) |
| Database | **MySQL** via **Prisma v6** ORM |
| Auth | **NextAuth v4** (Credentials provider, JWT session) |
| Payment | **Midtrans Snap** (BCA / BNI / Mandiri / GoPay / OVO / DANA / QRIS) |
| Animasi | **Framer Motion v12** + **GSAP v3** (ScrollTrigger) |
| Shipping | **RajaOngkir API** (komerce.id) — cost, province, city |
| Real-time | **SSE** (Server-Sent Events) via in-memory event bus |
| Validasi | **Zod v4** (server-side, 20+ schema) |
| E2E Testing | **Playwright** (18 tests across auth, shop, admin, payment flows) |
| Unit Testing | **Vitest** (64 tests, ~78% coverage on core lib/) |

---

## Highlight Teknis

1. **Server-side price dengan validasi berlapis**: Zod schema di entry point → re-fetch harga asli dari database → kalkulasi total di server. Shipping cost di-clamp maksimal Rp500.000. Integrasi Midtrans dengan webhook signature verification HMAC-SHA512. Client tidak bisa memanipulasi nilai transaksi.

2. **3-tier RBAC dari database hingga UI**: Role (`customer` / `admin` / `super_admin`) di-enforce di empat layer — JWT token dari NextAuth → database re-fetch tiap request admin (cegah stale token) → API route handler guard → client-side conditional rendering dengan redirect. Admin staff otomatis diblokir dari cart, checkout, dan data keuangan.

3. **Audit keamanan multi-agent dengan kategori OWASP**: Proyek diaudit oleh agent AI khusus (*security subagent*) yang menginspeksi seluruh permukaan serangan: broken access control (RBAC), injection (Zod validation, CSV escape), cryptographic failures (token hashing), security misconfiguration (CSP, headers), dan rate limiting abuse. Total 19 temuan dari audit — seluruhnya telah diremediasi dan diverifikasi ulang melalui E2E test. Status akhir: **0 temuan tersisa**.

4. **Animasi premium tanpa dependensi tambahan**: Scroll storytelling menggunakan GSAP ScrollTrigger untuk efek crossfade dan parallax ala Apple product page. Micro-interaction (add-to-cart bounce, modal, page transition) menggunakan Framer Motion. Tidak ada library animasi pihak ketiga di luar stack inti — semuanya vanilla React + CSS Tailwind.

5. **Guest checkout + retry payment**: Arsitektur checkout yang mengakomodasi guest user tanpa session — order dibuat dengan `userId: null`, rate limiting lebih ketat per IP. Snap token dari Midtrans disimpan di database untuk mekanisme retry bayar tanpa membuat transaksi baru. Status pembayaran bisa di-sync manual melalui Midtrans API untuk mengatasi keterbatasan webhook di environment development.

---

## Cara Run Lokal

```bash
# 1. Clone
git clone https://github.com/your-username/ecommerce-gaul.git
cd ecommerce-gaul

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Isi DATABASE_URL (MySQL), NEXTAUTH_SECRET, dan API keys:
# - Midtrans: daftar akun sandbox di https://midtrans.com
# - RajaOngkir: daftar di https://rajaongkir.komerce.id (free tier)

# 4. Setup database
npx prisma migrate dev
npx prisma db seed

# 5. Run development server
npm run dev
# Buka http://localhost:3000

# Test credentials (setelah seed — lihat .env untuk password aktual):
# - Super Admin : owner@gaul.com  → role super_admin, akses penuh termasuk data keuangan
# - Admin Staff : admin@gaul.com  → role admin, akses CMS tanpa data keuangan
```

---

## Catatan

- 🔧 **Project demo / portofolio** — seluruh payment gateway menggunakan **Midtrans sandbox mode**, tidak ada transaksi uang asli yang diproses
- 🗄️ Database MySQL bisa dijalankan via Laragon, XAMPP, atau Railway/Aiven (free tier)
- 💳 Midtrans Snap menggunakan akun sandbox — registrasi gratis di [Midtrans](https://midtrans.com)
- 📮 RajaOngkir API key dari [komerce.id](https://rajaongkir.komerce.id) — tersedia free tier
- 🧪 Rate limiter menggunakan in-memory storage — cocok untuk single-instance deployment. Untuk production multi-instance, upgrade ke Redis-based

---

**Dibuat dengan:** Next.js 16 · React 19 · Prisma · MySQL · Midtrans · GSAP · Framer Motion · Tailwind CSS v4 · Playwright · Vitest

1. 👑 Super Admin (Owner)
Email: owner@gaul.com
Password: owner123
Role: super_admin
Akses: Penuh (Dashboard Admin, Produk, Pesanan, Chat Inbox, Banner Hero, Kupon, Konten, dan Kelola Staf Admin /admin/users).
2. 🛠️ Admin Staff
Email: admin@gaul.com
Password: admin123
Role: admin
Akses: CMS Admin (Kelola Produk, Pesanan, Resi/Cetak Label, Live Chat Inbox, Hero, Kupon).
3. 🛒 Customer (Pembeli)
Daftar Baru: Anda bisa membuat akun customer baru langsung melalui halaman register di /account/register.
Lupa Password Customer: Bisa mereset password di halaman /account/forgot-password.