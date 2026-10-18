import Link from 'next/link'

// Shell halaman auth: panel brand editorial di kiri, form di kanan.
// Mobile: hanya kolom form dengan wordmark ringkas di atas.
export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg-warm)]">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-[var(--color-text-primary)] p-10 text-white lg:flex xl:p-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke toko
        </Link>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            Daily Outfit
          </p>
          <h2 className="mt-4 font-[var(--font-display)] text-4xl leading-[1.1] tracking-tight xl:text-5xl">
            Outfit harian<br />
            yang terasa<br />
            <span className="italic text-[var(--color-accent)]">kamu banget.</span>
          </h2>
          <div className="mt-8 h-px w-16 bg-[var(--color-accent)]" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/50">
            Koleksi baru tiap bulan. Casual daily, unisex, dibuat untuk dipakai berulang.
          </p>
        </div>

        <p className="text-xs text-white/30">© 2026 GAUL</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 block font-[var(--font-display)] text-2xl tracking-tight text-[var(--color-text-primary)] lg:hidden"
          >
            GAUL
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
