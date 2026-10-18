'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useCart } from '@/lib/cart-context'
import { useState } from 'react'
import ConfirmModal from '@/components/ui/ConfirmModal'

const links = [
  { label: 'Profil', href: '/account/profile', icon: (active) => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> },
  { label: 'Pesanan', href: '/account/orders', icon: (active) => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg> },
  { label: 'Wishlist', href: '/account/wishlist', icon: (active) => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg> },
  { label: 'Notifikasi', href: '/account/notifications', icon: (active) => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg> },
]

export default function AccountNav() {
  const path = usePathname()
  const { data: session } = useSession()
  const { clearCart } = useCart()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const name = session?.user?.name || 'Member'
  const initial = name.charAt(0).toUpperCase()

  const submitLogout = () => {
    setConfirmLogout(false)
    clearCart()
    signOut({ callbackUrl: '/' })
  }

  return (
    <nav>
      {/* Mobile: strip identitas kompak agar konten tidak turun terlalu jauh */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-3 py-2.5 lg:hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/15 font-[var(--font-display)] text-base text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{name}</p>
          <p className="truncate text-xs text-[var(--color-text-secondary)]">{session?.user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          aria-label="Keluar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-section)] hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>

      {/* Desktop: kartu member penuh */}
      <div className="hidden rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-4 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)]/15 font-[var(--font-display)] text-lg text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{name}</p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">{session?.user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          className="mt-3 flex w-full items-center gap-2 border-t border-[var(--color-bg-section)] pt-3 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:text-red-500"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          Keluar
        </button>
      </div>

      {/* Navigasi: tab horizontal scrollable di mobile, kolom di desktop */}
      <p className="mb-2 mt-6 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-secondary)] lg:block">
        Menu
      </p>
      <div className="no-scrollbar -mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:mt-0 lg:flex-col lg:overflow-visible lg:px-0">
        {links.map(l => {
          const active = path === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all lg:w-full ${
                active
                  ? 'bg-[var(--color-text-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {l.icon(active)}
              {l.label}
            </Link>
          )
        })}
      </div>

      <ConfirmModal
        open={confirmLogout}
        title="Yakin keluar?"
        message="Kamu akan keluar dari akun kamu."
        confirmLabel="Keluar"
        cancelLabel="Batal"
        onConfirm={submitLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </nav>
  )
}