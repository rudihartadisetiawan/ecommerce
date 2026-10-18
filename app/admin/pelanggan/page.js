'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function formatRupiah(n) {
  if (typeof n !== 'number') return '—'
  return 'Rp ' + n.toLocaleString('id-ID')
}

function exportCSV(rows) {
  const headers = ['Nama', 'Email', 'Telepon', 'Daftar', 'Pesanan', 'Total Belanja', 'Terakhir Belanja', 'Kota', 'Kategori Favorit', 'Ukuran Favorit', 'Pembayaran Favorit']
  const csv = [
    headers.join(','),
    ...rows.map(r => [
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      r.createdAt,
      r.orderCount,
      r.totalSpent,
      r.lastOrder || '—',
      `"${r.city}"`,
      `"${r.preferredCategory}"`,
      `"${r.preferredSize}"`,
      `"${r.preferredPayment}"`,
    ].join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pelanggan-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPelangganPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/customers')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setUsers(data)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') router.push('/admin')
      else load()
    } else if (status === 'unauthenticated') {
      router.push('/account/login')
    }
  }, [status, session, router])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (status !== 'authenticated' || loading) {
    return <div className="mx-auto max-w-[1600px] px-4 py-8 text-sm text-[var(--color-text-secondary)]">Memuat...</div>
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Kembali ke CMS</Link>
          <h1 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text-primary)] sm:text-3xl">Data Pelanggan</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Analisis pelanggan terdaftar ({users.length})</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-xs">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-4 py-2 pl-9 text-xs outline-none focus:border-[var(--color-accent)]"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
            </svg>
          </div>
          <button
            onClick={() => exportCSV(filtered)}
            className="rounded-full border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-section)] transition-colors inline-flex items-center gap-1.5"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-bg-section)] text-xs font-medium uppercase text-[var(--color-text-secondary)]">
              <th className="px-4 py-3.5">Nama</th>
              <th className="px-4 py-3.5">Kota</th>
              <th className="px-4 py-3.5">Pesanan</th>
              <th className="px-4 py-3.5">Total Belanja</th>
              <th className="px-4 py-3.5">Terakhir</th>
              <th className="px-4 py-3.5">Kategori Favorit</th>
              <th className="px-4 py-3.5">Ukuran</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[var(--color-text-secondary)]">Tidak ada data pelanggan.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="border-b border-[var(--color-bg-section)]/50 last:border-0 hover:bg-[var(--color-bg-warm)]/50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-400 text-xs font-bold text-white">
                      {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-text-primary)] truncate">{u.name}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] font-mono truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-[var(--color-text-secondary)]">{u.city}</td>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-[var(--color-text-primary)] text-sm">{u.orderCount}x</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-[var(--color-accent)] text-sm">{formatRupiah(u.totalSpent)}</span>
                </td>
                <td className="px-4 py-3.5 text-xs text-[var(--color-text-secondary)]">{u.lastOrder || '—'}</td>
                <td className="px-4 py-3.5">
                  <span className="rounded-full bg-[var(--color-bg-section)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-text-primary)]">{u.preferredCategory}</span>
                </td>
                <td className="px-4 py-3.5 text-xs text-[var(--color-text-secondary)]">{u.preferredSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
