# PRD — Toko Outfit Casual Daily (E-commerce)

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

## 3. Fitur & Prioritas

### P0 — Wajib untuk MVP
| Fitur | Deskripsi |
|---|---|
| Katalog produk | Listing produk, filter (kategori, ukuran, harga), search |
| Detail produk | Galeri gambar, varian (ukuran/warna), deskripsi |
| Keranjang | Tambah/hapus/update qty |
| Checkout | Alamat, ringkasan pesanan, pilih metode bayar |
| Pembayaran | Integrasi Midtrans (transfer bank + e-wallet lokal) |
| Akun user | Register/login, riwayat pesanan, edit profil |
| CMS Admin | Kelola produk (CRUD), kelola pesanan (update status), kelola hero section |
| Hero section dinamis | Admin bisa ganti banner/gambar/teks promo tanpa deploy ulang |

### P1 — Penting, bisa menyusul setelah P0 stabil
| Fitur | Deskripsi |
|---|---|
| Wishlist | Simpan produk favorit |
| Review & rating | User beri ulasan setelah pesanan selesai |
| Notifikasi produk baru & promo | Email atau in-app notification saat ada koleksi/promo baru |

### P2 — Nice to have (di luar MVP awal)
- Newsletter subscribe terpisah dari akun
- Riwayat browsing / rekomendasi produk

## 4. Tech Stack
| Layer | Pilihan | Catatan |
|---|---|---|
| Frontend | Next.js (React) | App Router direkomendasikan untuk performa & SEO |
| Bahasa | JavaScript | — |
| Styling | Tailwind CSS | Cocok untuk desain custom & interaktif |
| Database | MySQL | — |
| ORM | Prisma | Skema jadi kontrak jelas antara frontend-backend |
| Auth | NextAuth.js | Email/password minimal; sosial login opsional P2 |
| Payment Gateway | **Midtrans** | Cover transfer bank + e-wallet lokal dalam satu integrasi |
| Hosting (tier gratis) | Frontend: Vercel (free tier). DB: Railway/PlanetScale/Aiven (free tier MySQL) | Sesuaikan limit tier gratis, siap upgrade jika traffic naik |
| Animasi/interaksi | Framer Motion + GSAP (ScrollTrigger) | Framer Motion untuk micro-interaction, GSAP untuk scroll-driven storytelling (efek ala Apple) |

## 5. Kontrak Data (Skema Awal)

> Disepakati di awal agar Frontend & Backend subagent tidak saling menunggu.

**User**
```
id, name, email, password_hash, phone, role (customer|admin), created_at
```

**Product**
```
id, name, slug, description, price, category, sizes[], colors[],
images[], stock_per_variant, is_active, created_at, updated_at
```

**Cart / CartItem**
```
Cart: id, user_id
CartItem: id, cart_id, product_id, variant (size/color), qty
```

**Order / OrderItem**
```
Order: id, user_id, status (pending|paid|processing|shipped|completed|cancelled),
       total, shipping_address, payment_method, payment_ref, created_at
OrderItem: id, order_id, product_id, variant, qty, price_at_purchase
```

**Wishlist**
```
id, user_id, product_id
```

**Review**
```
id, product_id, user_id, order_id, rating (1-5), comment, created_at
```

**HeroSection** (dikelola admin)
```
id, image_url, title, subtitle, cta_text, cta_link, is_active, order
```

**Notification**
```
id, type (new_collection|promo), title, message, sent_at
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

## 7. Batasan
- Budget: layanan gratis/free-tier di semua layanan (hosting, DB, dsb)
- Tim: dikerjakan solo, dibantu AI agent (OpenCode: manager + subagent frontend/backend/security)
- Waktu: fleksibel, tidak ada deadline ketat
- Workflow: pengerjaan per-domain (frontend selesai penuh → backend → security), bukan per-fitur

## 8. Kriteria Selesai (Definition of Done)
- [ ] Semua fitur P0 berfungsi end-to-end (browse → cart → checkout → bayar → order masuk ke CMS)
- [ ] CMS admin bisa kelola produk, pesanan, dan hero section tanpa perlu developer
- [ ] Frontend responsif penuh di mobile & desktop
- [ ] Semua interaksi/animasi di atas terimplementasi dan terasa smooth (bukan patah-patah)
- [ ] Security review (subagent Security) tidak menemukan temuan kritis
- [ ] Flow cart→checkout diuji otomatis via Playwright
