'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import ConfirmModal from '@/components/ui/ConfirmModal'

const nav = [
  { label: 'Produk', href: '/admin' },
  { label: 'Pesanan', href: '/admin/pesanan' },
  { label: 'Chat', href: '/admin/chat' },
  { label: 'Kupon', href: '/admin/kupon' },
  { label: 'Hero', href: '/admin/hero' },
  { label: 'Konten', href: '/admin/konten' },
  { label: 'Staff', href: '/admin/users' },
  { label: 'Pelanggan', href: '/admin/pelanggan', superOnly: true },
]

export default function AdminLayout({ children }) {
  const path = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'super_admin') {
      router.push('/')
    } else if (status === 'unauthenticated') {
      router.push('/account/login')
    }
  }, [status, session, router])

  if (status !== 'authenticated' || (session?.user?.role !== 'admin' && session?.user?.role !== 'super_admin')) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-secondary)]">Memuat...</div>
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-warm)]">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-bg-section)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-[var(--font-display)] text-lg text-[var(--color-text-primary)]">GAUL CMS</Link>
            <nav className="hidden items-center gap-4 sm:flex">
              {nav.filter(n => !n.superOnly || session?.user?.role === 'super_admin').map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    path === n.href ? 'text-[var(--color-text-primary)] font-semibold' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {n.label}
                  {n.badge && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                      {n.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Lihat Toko</Link>
            <button
              onClick={() => setConfirmLogout(true)}
              className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50 hover:border-red-300"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="pt-14">{children}</main>

      <ConfirmModal
        open={confirmLogout}
        title="Yakin keluar?"
        message="Anda akan logout dari CMS. Perubahan yang belum disimpan akan hilang."
        confirmLabel="Keluar"
        cancelLabel="Batal"
        onConfirm={() => { setConfirmLogout(false); signOut({ callbackUrl: '/' }) }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
