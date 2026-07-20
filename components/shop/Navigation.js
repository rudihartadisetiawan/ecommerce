'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Container from '../ui/Container'
import { useCart } from '@/lib/cart-context'
import NotificationBell from './NotificationBell'

const navLinks = [
  { label: 'Koleksi', href: '/produk' },
  { label: 'Tentang', href: '/#tentang' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()
  const { totalItems } = useCart()
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin'

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mobile overlay rendered via portal to avoid GSAP pin DOM conflicts
  const mobileOverlay = mounted && mobileOpen
    ? createPortal(
        <motion.div
          key="mobile-nav"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-[var(--color-bg-warm)] md:hidden"
        >
          {navLinks.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-[var(--font-display)] text-3xl text-[var(--color-text-primary)]"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
          {status === 'authenticated' ? (
            isAdmin ? (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="font-[var(--font-display)] text-2xl text-[var(--color-accent)]">
                    {session.user.name?.split(' ')[0] || 'Admin'}
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Link href="/" onClick={() => setMobileOpen(false)} className="font-[var(--font-display)] text-2xl text-[var(--color-text-secondary)]">
                    Lihat Toko
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Link href="/cart" onClick={() => setMobileOpen(false)} className="font-[var(--font-display)] text-3xl text-[var(--color-text-primary)]">
                    Cart{totalItems > 0 ? ` (${totalItems})` : ''}
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Link href="/account/profile" onClick={() => setMobileOpen(false)} className="font-[var(--font-display)] text-2xl text-[var(--color-text-secondary)]">
                    {session.user.name?.split(' ')[0] || 'Akun'}
                  </Link>
                </motion.div>
              </>
            )
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Link href="/account/login" onClick={() => setMobileOpen(false)} className="font-[var(--font-display)] text-2xl text-[var(--color-text-secondary)]">
                Masuk
              </Link>
            </motion.div>
          )}
        </motion.div>,
        document.body
      )
    : null

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <Container>
          <div className="flex h-16 items-center justify-between sm:h-20">
            {/* Logo */}
            <Link href="/" className="font-[var(--font-display)] text-2xl tracking-tight text-[var(--color-text-primary)]">
              GAUL
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  {link.label}
                </Link>
              ))}
              {status === 'authenticated' ? (
                isAdmin ? (
                  <Link href="/admin" className="text-sm font-medium text-[var(--color-accent)] transition-colors hover:opacity-70">
                    {session.user.name?.split(' ')[0] || 'Admin'}
                  </Link>
                ) : (
                  <>
                    <Link href="/account/profile" className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                      {session.user.name?.split(' ')[0] || 'Akun'}
                    </Link>
                    <NotificationBell />
                    <Link
                      href="/cart"
                      className="relative text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                      aria-label="Cart"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                      {totalItems > 0 && (
                        <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-medium text-white">{totalItems}</span>
                      )}
                    </Link>
                  </>
                )
              ) : (
                <Link href="/account/login" className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                  Masuk
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="relative z-[70] flex h-10 w-10 items-center justify-center md:hidden"
              aria-label="Menu"
            >
              <div className="flex flex-col gap-1.5">
                <motion.span
                  animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  className="block h-0.5 w-6 bg-[var(--color-text-primary)]"
                />
                <motion.span
                  animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                  className="block h-0.5 w-6 bg-[var(--color-text-primary)]"
                />
                <motion.span
                  animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  className="block h-0.5 w-6 bg-[var(--color-text-primary)]"
                />
              </div>
            </button>
          </div>
        </Container>
      </motion.nav>

      {/* Mobile overlay — portaled to body to avoid GSAP DOM conflicts */}
      {mobileOverlay}
    </>
  )
}
