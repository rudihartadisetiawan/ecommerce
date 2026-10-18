'use client'

import { useState } from 'react'
import Link from 'next/link'
import Container from '../ui/Container'

const footerNav = [
  { label: 'Koleksi', href: '/produk' },
  { label: 'Atasan', href: '/produk?cat=Atasan' },
  { label: 'Bawahan', href: '/produk?cat=Bawahan' },
  { label: 'Outerwear', href: '/produk?cat=Outerwear' },
]

const footerAccount = [
  { label: 'Masuk', href: '/account/login' },
  { label: 'Daftar', href: '/account/register' },
  { label: 'Pesanan Saya', href: '/account/orders' },
  { label: 'Profil', href: '/account/profile' },
]

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState('idle') // idle | success | error

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (!newsletterEmail || !/\S+@\S+\.\S+/.test(newsletterEmail)) return
    try {
      const existing = JSON.parse(localStorage.getItem('gaul_newsletter') || '[]')
      if (!existing.includes(newsletterEmail)) {
        existing.push(newsletterEmail)
        localStorage.setItem('gaul_newsletter', JSON.stringify(existing))
      }
      setNewsletterStatus('success')
      setNewsletterEmail('')
    } catch {
      setNewsletterStatus('error')
    }
  }

  return (
    <footer className="bg-[var(--color-text-primary)] text-white/70">
      {/* Newsletter Section */}
      <div className="border-b border-white/10 px-6 py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-xl text-center">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-accent)]">
              PRIVATE DISPATCH / SUBSCRIBER
            </p>
            <h3 className="font-[var(--font-display)] text-2xl text-white sm:text-3xl">
              Akses Rilisan Sebelum Publik
            </h3>
            <p className="mt-2 text-sm text-white/60">
              Dapatkan notifikasi drop artikel bulanan, batch restock terbatas, dan editorial rilis langsung ke email Anda.
            </p>
            <form onSubmit={handleNewsletter} className="mx-auto mt-6 flex max-w-md gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="nama@email.com"
                className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--color-accent)]"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-accent)] hover:text-white"
              >
                Gabung
              </button>
            </form>
            {newsletterStatus === 'success' && (
              <p className="mt-3 font-mono text-xs text-green-400">
                ✓ Berhasil terdaftar. Anda masuk dalam antrean notifikasi drop berikutnya.
              </p>
            )}
            {newsletterStatus === 'error' && (
              <p className="mt-3 font-mono text-xs text-red-400">
                Gagal menyimpan. Coba lagi.
              </p>
            )}
          </div>
        </Container>
      </div>

      {/* Main footer */}
      <div className="py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-16">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="font-[var(--font-display)] text-2xl text-white">
                GAUL
              </Link>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/60">
                Dirancang untuk rotasi pakaian harian — siluet rileks, serat katun padat, dan ketahanan pakai jangka panjang.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
                Navigasi
              </h4>
              <ul className="space-y-3">
                {footerNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
                Akun
              </h4>
              <ul className="space-y-3">
                {footerAccount.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social / Contact */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
                Ikuti Kami
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm transition-colors hover:text-white">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm transition-colors hover:text-white">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.81a8.23 8.23 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.24z"/></svg>
                    TikTok
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10 py-5">
        <Container>
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <span className="text-xs text-white/30">&copy; 2026 GAUL. All rights reserved.</span>
            <span className="text-xs text-white/30">Casual daily outfit Indonesia</span>
          </div>
        </Container>
      </div>
    </footer>
  )
}
