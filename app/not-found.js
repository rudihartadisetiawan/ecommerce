import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-warm)] px-6 text-center">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent)]">
        Error 404
      </p>
      <h1 className="font-[var(--font-display)] text-5xl tracking-tight text-[var(--color-text-primary)] sm:text-6xl lg:text-7xl">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-4 max-w-md text-base text-[var(--color-text-secondary)]">
        Halaman yang kamu cari mungkin sudah dihapus, dipindah, atau tidak pernah ada.
      </p>
      <div className="mt-10 flex items-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-all hover:brightness-125"
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/produk"
          className="rounded-full border border-[var(--color-text-primary)]/20 px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-all hover:border-[var(--color-text-primary)]/40"
        >
          Lihat Koleksi
        </Link>
      </div>
    </div>
  )
}
