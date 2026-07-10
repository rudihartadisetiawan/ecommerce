# AGENTS.md — Panduan untuk Semua Agent (Manager, Frontend, Backend, Security)

## Ringkasan Project
E-commerce toko outfit casual daily, mid-range, target pasar lokal, unisex.
Model bisnis: repeat purchase, koleksi baru tiap bulan. Frontend adalah prioritas
kualitas tertinggi — harus interaktif dan terasa premium (referensi: Apple product page).

## Tech Stack
- Frontend: Next.js (App Router) + React + JavaScript
- Styling: Tailwind CSS
- Animasi: Framer Motion (micro-interaction) + GSAP ScrollTrigger (scroll storytelling)
- Backend: Next.js API routes / route handlers
- Database: MySQL via Prisma ORM
- Auth: NextAuth.js
- Payment: Midtrans (transfer bank + e-wallet lokal)
- Hosting: Vercel (frontend) + free-tier MySQL host (Railway/PlanetScale/Aiven)

## Struktur Folder (usulan)
```
/app                  → routes (Next.js App Router)
  /(shop)              → halaman customer: home, produk, cart, checkout
  /account             → login, register, profil, riwayat order
  /admin               → CMS: produk, pesanan, hero section
  /api                 → route handlers backend
/components
  /ui                  → komponen reusable (button, card, dll)
  /shop                → komponen khusus shop (product-card, cart-item, dll)
/lib                   → helper, prisma client, auth config
/prisma
  schema.prisma        → skema database (lihat Kontrak Data di PRD.md)
PRD.md
AGENTS.md
PROGRESS.md            → status tracking antar sesi (wajib diupdate tiap handoff)
```

## Kontrak Data
Rujuk ke `PRD.md` bagian "Kontrak Data" — SEMUA agent (frontend & backend) WAJIB
memakai skema ini apa adanya. Kalau ada kebutuhan mengubah skema di tengah jalan,
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

### Backend
- Ikuti Kontrak Data di PRD.md secara ketat — jangan improvisasi skema baru
- Akses MySQL via MCP bersifat read-only secara default; write access hanya untuk migrasi/seed terkontrol
- Validasi input di semua endpoint (terutama checkout & payment)
- Integrasi Midtrans: gunakan sandbox/testing mode terlebih dahulu sebelum production key
- Baru mulai setelah Frontend dinyatakan selesai oleh Manager

### Security
- Review bersifat read-only — TIDAK mengubah kode langsung, hanya melaporkan temuan
- Audit mencakup: auth flow, payment flow (khususnya callback/webhook Midtrans), input validation,
  exposure data sensitif (password, token, API key)
- Gunakan Playwright untuk menguji flow cart → checkout secara nyata di browser
- Temuan kritis wajib dikirim balik ke Manager untuk diteruskan ke Frontend/Backend terkait

## Larangan
- Jangan mulai domain berikutnya sebelum domain sebelumnya direview & disetujui Manager
- Jangan ubah Kontrak Data tanpa update PRD.md terlebih dahulu
- Jangan gunakan payment gateway/metode selain Midtrans
- Jangan skip animasi/interaksi frontend dengan alasan "biar cepat" — ini requirement inti, bukan hiasan
- Security subagent dilarang melakukan perubahan kode langsung
