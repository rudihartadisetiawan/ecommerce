'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/lib/cart-context'
import NotificationBell from './NotificationBell'
import ConfirmModal from '@/components/ui/ConfirmModal'

const navLinks = [
  { label: 'Koleksi', href: '/produk' },
  { label: 'Atasan', href: '/produk?cat=Atasan' },
  { label: 'Bawahan', href: '/produk?cat=Bawahan' },
  { label: 'Tentang', href: '/#tentang' },
]

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const { data: session, status } = useSession()
  const { totalItems } = useCart()
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Mobile drawer portaled to body
  const mobileOverlay = mounted && mobileOpen
    ? createPortal(
        <AnimatePresence>
          <motion.div
            key="mobile-nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-white md:hidden"
          >
            {/* Mobile Header bar */}
            <div className="flex h-16 items-center justify-between border-b border-black/[0.08] px-6">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="font-[var(--font-display)] text-2xl tracking-tight text-[#111111]"
              >
                GAUL
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center text-[#111111]"
                aria-label="Tutup Menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Links */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-xl font-bold uppercase tracking-[0.16em] text-[#111111] transition-opacity hover:opacity-60"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="my-2 h-px w-full bg-black/[0.08]" />

                <Link
                  href="/account/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between text-sm uppercase tracking-widest text-[#111111]"
                >
                  <span>Wishlist</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between text-sm uppercase tracking-widest text-[#111111]"
                >
                  <span>Keranjang</span>
                  <span className="font-mono text-xs font-semibold">({totalItems})</span>
                </Link>

                {status === 'authenticated' ? (
                  isAdmin ? (
                    <>
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="text-sm font-semibold uppercase tracking-widest text-[#111111]"
                      >
                        Dashboard Admin ({session.user.name?.split(' ')[0]})
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false)
                          setConfirmLogout(true)
                        }}
                        className="text-left text-sm uppercase tracking-widest text-[#767676] hover:text-black"
                      >
                        Keluar
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/account/profile"
                        onClick={() => setMobileOpen(false)}
                        className="text-sm uppercase tracking-widest text-[#111111]"
                      >
                        Akun Saya ({session.user.name?.split(' ')[0]})
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false)
                          setConfirmLogout(true)
                        }}
                        className="text-left text-sm uppercase tracking-widest text-[#767676] hover:text-black"
                      >
                        Keluar
                      </button>
                    </>
                  )
                ) : (
                  <Link
                    href="/account/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm uppercase tracking-widest text-[#111111]"
                  >
                    Masuk / Daftar Akun
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      {/* 1. Announcement Bar — 36px clean ticker/bar */}
      <div className="flex h-[36px] w-full items-center justify-center bg-[#111111] px-4 text-center text-white">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#E5E5E5] truncate">
          PENGIRIMAN SAMEDAY & REGULER · GARANSI TUKAR SIZE 7 HARI · GRATIS ONGKIR MIN. Rp299K
        </p>
      </div>

      {/* 2. Main Header — Sticky with thin bottom hairline */}
      <nav className="h-16 md:h-[72px] w-full border-b border-black/[0.08] bg-white transition-all duration-200">
        <div className="mx-auto flex h-full w-full max-w-[2400px] items-center justify-between px-6 sm:px-10">
          {/* Logo Kiri (Tetap Serif Editorial) */}
          <Link
            href="/"
            className="font-[var(--font-display)] text-2xl md:text-[28px] tracking-tight text-[#111111] transition-opacity hover:opacity-80"
          >
            GAUL
          </Link>

          {/* Navigasi Tengah (Editorial Clean Sans) */}
          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#111111] transition-opacity hover:opacity-50"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Ikon Kanan (Minimalis) */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Search Icon */}
            <Link
              href="/produk"
              className="text-[#111111] transition-opacity hover:opacity-50"
              aria-label="Cari Produk"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </Link>

            {/* Wishlist Icon */}
            <Link
              href="/account/wishlist"
              className="hidden text-[#111111] transition-opacity hover:opacity-50 sm:block"
              aria-label="Wishlist"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </Link>

            {/* Account Icon / Admin */}
            {status === 'authenticated' ? (
              isAdmin ? (
                <div className="hidden items-center gap-2.5 sm:flex">
                  <Link
                    href="/admin"
                    className="text-[11px] font-semibold uppercase tracking-wider text-[#111111] underline underline-offset-4"
                  >
                    Admin
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmLogout(true)}
                    className="text-[11px] uppercase tracking-wider text-[#767676] hover:text-black cursor-pointer"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4">
                  <Link
                    href="/account/profile"
                    className="text-[#111111] transition-opacity hover:opacity-50"
                    aria-label="Profil Akun"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </Link>
                  <NotificationBell />
                </div>
              )
            ) : (
              <Link
                href="/account/login"
                className="text-[#111111] transition-opacity hover:opacity-50"
                aria-label="Masuk Akun"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>
            )}

            {/* Cart Icon with Minimal Black Counter */}
            <Link
              href="/cart"
              className="relative text-[#111111] transition-opacity hover:opacity-50"
              aria-label="Keranjang Belanja"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] px-1 text-[9px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center text-[#111111] md:hidden"
              aria-label="Buka Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOverlay}

      <ConfirmModal
        open={confirmLogout}
        title="Yakin keluar?"
        message="Anda akan logout dari akun Anda."
        confirmLabel="Keluar"
        cancelLabel="Batal"
        onConfirm={() => {
          setConfirmLogout(false)
          signOut({ callbackUrl: '/' })
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </header>
  )
}
