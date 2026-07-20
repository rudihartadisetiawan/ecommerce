'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-warm)] px-6 text-center">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent)]">
        Terjadi Kesalahan
      </p>
      <h1 className="font-[var(--font-display)] text-5xl tracking-tight text-[var(--color-text-primary)] sm:text-6xl lg:text-7xl">
        Ada yang Tidak Beres
      </h1>
      <p className="mt-4 max-w-md text-base text-[var(--color-text-secondary)]">
        Maaf, terjadi kesalahan yang tidak terduga. Tim kami sudah diberitahu.
      </p>
      <div className="mt-10 flex items-center gap-4">
        <button
          onClick={reset}
          className="rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-all hover:brightness-125"
        >
          Coba Lagi
        </button>
        <Link
          href="/"
          className="rounded-full border border-[var(--color-text-primary)]/20 px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-all hover:border-[var(--color-text-primary)]/40"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
