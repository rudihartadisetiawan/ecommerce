# Manual Test Checklist — GAUL E-commerce

> Generated: 2026-07-21 · Scope: Full re-test after all feature additions

## Role: Guest (Belum Login)

| # | Test Case | Langkah | Expected Result |
|---|---|---|---|
| 1 | Browse homepage | Buka `/` | Hero section dengan GSAP scroll storytelling, produk featured muncul, kategori terlihat |
| 2 | Katalog produk | Buka `/produk` | Grid produk, filter/search/sort berfungsi, pagination "Muat Lainnya" |
| 3 | Search autocomplete | Ketik di search bar | Dropdown saran produk muncul dengan thumbnail & harga |
| 4 | Detail produk | Klik produk → `/produk/[slug]` | Gallery crossfade, varian ukuran/warna, zoom gambar (desktop), ulasan |
| 5 | Add to cart | Pilih varian → klik "Tambah ke Keranjang" | Guest diarahkan ke `/account/login?callbackUrl=...` |
| 6 | Cart page | Buka `/cart` (guest) | Empty state atau redirect ke login |
| 7 | Checkout page | Buka `/checkout` (guest) | Halaman checkout tampil (guest checkout) — form alamat + email |
| 8 | Guest checkout flow | Isi form guest → Bayar | Checkout sukses tanpa login |
| 9 | Live chat | Klik floating chat bubble | Widget chat terbuka, quick questions tampil |
| 10 | Lupa password | Klik "Lupa Password?" di login | Halaman forgot-password → input email → submit berhasil |
| 11 | Register | Buka `/account/register` | Form registrasi, submit → redirect ke homepage |
| 12 | Login | Buka `/account/login` | Form login, submit → redirect ke homepage |
| 13 | Kupon coba-coba | Input kode kupon random di checkout | Error "Kode kupon tidak valid" |

## Role: Customer (Terdaftar & Login)

| # | Test Case | Langkah | Expected Result |
|---|---|---|---|
| 1 | Login | Buka `/account/login` → isi credentials | Redirect ke homepage (role customer) |
| 2 | Profile | `/account/profile` | Tampilkan & edit data profil |
| 3 | Add to cart (auth) | Detail produk → pilih varian → tambah ke keranjang | Feedback "Ditambahkan!" + badge cart update |
| 4 | Cart page | `/cart` | List item, qty +/-, hapus, subtotal |
| 5 | Checkout | `/checkout` → isi alamat → pilih kirim → pilih bayar | Order terbuat, Snap Midtrans popup |
| 6 | Checkout with coupon | Input kode kupon valid saat checkout | Diskon teraplikasi, total berkurang |
| 7 | Riwayat pesanan | `/account/orders` | Daftar semua pesanan |
| 8 | Detail pesanan | `/account/orders/[id]` | Timeline status, tombol Bayar/Cek Status/Batalkan (jika pending) |
| 9 | Upload bukti terima | Klik "Pesanan Diterima" saat status `shipped` | Modal upload foto |
| 10 | Review produk | Buka detail pesanan `completed` → "Beri Ulasan" | Modal rating 1-5 + komentar |
| 11 | Wishlist | Detail produk → klik icon wishlist | Produk tersimpan, muncul di `/account/wishlist` |
| 12 | Notifications | Klik bell icon di nav | Dropdown 5 notifikasi terbaru; `/account/notifications` semua notifikasi |
| 13 | Live chat | Kirim pesan via chat widget | Admin bisa lihat dan balas |
| 14 | Recently viewed | Buka produk → kembali ke katalog | Section "Baru Dilihat" muncul |
| 15 | Logout | Klik Keluar di AccountNav | Session clear, cart kosong |

## Role: Admin Staff

| # | Test Case | Langkah | Expected Result |
|---|---|---|---|
| 1 | Login | Buka `/account/login` → admin@gaul.com | Redirect ke `/admin` |
| 2 | Cart blocked | Buka `/cart` langsung | Redirect ke `/admin` |
| 3 | Checkout blocked | Buka `/checkout` langsung | Redirect ke `/admin` |
| 4 | Add to cart blocked | Buka detail produk → "Tambah ke Keranjang" | Redirect ke `/admin` |
| 5 | Dashboard | `/admin` | Charts, rekap pesanan, daftar produk |
| 6 | Finance restricted | Cek dashboard | Total Omset card **TIDAK** muncul (placeholder "Akses Omset Khusus Super Admin") |
| 7 | Cost price restricted | Cek tabel produk | Kolom Modal & Margin **TIDAK** muncul |
| 8 | Kelola produk | `/admin` → toggle aktif/featured, edit, hapus | Berfungsi |
| 9 | Tambah produk | `/admin/produk/add` | Form lengkap (nama, harga, modal, kategori, ukuran, warna, gambar, featured) |
| 10 | Edit produk | `/admin/produk/[id]/edit` | Load data, update, simpan |
| 11 | Pesanan | `/admin/pesanan` | Tabs filter, input resi, sync, cetak label |
| 12 | Kelola kupon | `/admin/kupon` | CRUD kupon (create, activate/deactivate, delete) |
| 13 | Live chat admin | `/admin/chat` | List percakapan, balas pesan, template cepat |
| 14 | Kelola Hero | `/admin/hero` | CRUD banner, toggle aktif, urutan |
| 15 | Export CSV | Klik "Export CSV" di `/admin/pesanan` | Download CSV (data customer terlihat — email dan nama) |
| 16 | Users page | Buka `/admin/users` | Redirect/403 (hanya super_admin) |
| 17 | Restrict finance | Cek dashboard analisis keuangan | Tidak muncul untuk admin staff |

## Role: Super Admin (Owner)

| # | Test Case | Langkah | Expected Result |
|---|---|---|---|
| 1 | Login | Buka `/account/login` → owner@gaul.com | Redirect ke `/admin` |
| 2 | Dashboard finance | `/admin` | 4 kartu: Total Revenue, Total Modal, Laba Kotor, Margin Laba + badge "Owner Only" |
| 3 | Cost price visible | Tabel produk | Kolom Modal (Rp) + Margin (%) dengan badge warna |
| 4 | Top customers | Scroll dashboard | Top 5 pelanggan berdasarkan pesanan |
| 5 | Low stock alert | Cek dashboard | Peringatan produk stok ≤5, merah untuk stok ≤2 |
| 6 | Kelola staff | `/admin/users` | Lihat daftar, tambah admin staff, ubah role |
| 7 | Export CSV | Klik "Export CSV" | Download CSV semua data |
| 8 | Create super_admin | Coba buat user super_admin via API | Harus ditolak (hanya via seed) |
| 9 | All admin staff features | Semua fitur admin staff | Bisa akses semua |

## Cross-Cutting Concerns

| # | Test Case | Detail |
|---|---|---|
| 1 | Rate limiting | Coba login salah >5x → error rate limit terblokir |
| 2 | 404 page | Buka `/halaman-tidak-ada` | Custom 404 "Halaman Tidak Ditemukan" |
| 3 | Error boundary | Simulasi error | Error boundary muncul, tombol "Coba Lagi" |
| 4 | Loading state | Halaman dengan data lambat | Skeleton loading muncul |
| 5 | Responsive mobile | Buka semua halaman di viewport <768px | Layout adaptif, hamburger nav |
| 6 | Security headers | Cek response header | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` |
| 7 | CSP | Cek header Content-Security-Policy | Tidak ada `unsafe-eval` (kecuali dev) |

## Hasil Manual Test

| Tanggal | Tester | Role | Temuan |
|---|---|---|---|
| | | | |
