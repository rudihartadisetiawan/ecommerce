'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function AdminProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState([])
  const [ordersCount, setOrdersCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [confirmTarget, setConfirmTarget] = useState(null)

  const isSuperAdmin = session?.user?.role === 'super_admin'

  const load = () => {
    fetch('/api/products?all=true').then(r => r.json()).then(setProducts).catch(() => { })
    fetch('/api/orders?all=true')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const pending = data.filter(o => o.status === 'paid' || o.status === 'pending').length
          const revenue = data.filter(o => o.status === 'paid' || o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0)
          setOrdersCount(pending)
          setTotalRevenue(revenue)
        }
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (id) => {
    const p = products.find(pr => pr.id === id)
    if (!p) return
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      })
      if (!res.ok) { alert('Gagal mengubah status'); return }
      load()
    } catch (e) {
      alert('Terjadi kesalahan jaringan. Coba lagi.')
    }
  }

  const remove = useCallback(async () => {
    if (!confirmTarget) return
    const { id } = confirmTarget
    setConfirmTarget(null)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Gagal menghapus produk')
        return
      }
      load()
    } catch (e) {
      alert('Terjadi kesalahan jaringan. Coba lagi.')
    }
  }, [confirmTarget])

  return (
    <>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Analytics Summary Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-bg-section)] bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Produk</p>
          <p className="mt-1.5 text-2xl font-bold text-[var(--color-text-primary)]">{products.length}</p>
          <span className="mt-1.5 inline-block text-[10px] text-emerald-600 font-semibold">{products.filter(p => p.isActive).length} Aktif</span>
        </div>
        <div className="rounded-2xl border border-[var(--color-bg-section)] bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Perlu Diproses</p>
          <p className="mt-1.5 text-2xl font-bold text-[var(--color-text-primary)]">{ordersCount}</p>
          <span className="mt-1.5 inline-block text-[10px] text-amber-600 font-semibold">Pesanan Pending / Paid</span>
        </div>
        <div className="rounded-2xl border border-[var(--color-bg-section)] bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Live Chat CS</p>
          <p className="mt-1.5 text-2xl font-bold text-[var(--color-text-primary)]">1 Active</p>
          <span className="mt-1.5 inline-block text-[10px] text-emerald-600 font-semibold">Online Chat</span>
        </div>

        {/* Omset Card (Khusus Super Admin) */}
        {isSuperAdmin ? (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-xs">
            <p className="text-xs font-medium text-purple-700 flex items-center justify-between">
              <span>Total Omset</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded">👑 Owner</span>
            </p>
            <p className="mt-1.5 text-2xl font-bold text-purple-900">Rp{totalRevenue.toLocaleString('id-ID')}</p>
            <span className="mt-1.5 inline-block text-[10px] text-purple-600 font-semibold">Keuangan Terbayar</span>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-text-secondary)]/20 bg-white p-5 shadow-xs flex flex-col justify-center">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Laporan Keuangan</p>
            <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]/80 italic">Akses Omset Khusus Super Admin</p>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Kelola Produk</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{products.length} item terdaftar</p>
        </div>
        <Link href="/admin/produk/add" className="rounded-full bg-[var(--color-text-primary)] px-5 py-2 text-xs font-medium text-white transition-colors hover:brightness-125">+ Tambah Produk</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-bg-section)] text-xs font-medium uppercase text-[var(--color-text-secondary)]">
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-[var(--color-bg-section)]/50 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-8 flex-shrink-0 overflow-hidden rounded bg-[var(--color-bg-section)]">
                      {p.image && <img src={p.image} alt={p.name} className="h-full w-full object-cover" />}
                    </div>
                    <span className="font-medium text-[var(--color-text-primary)]">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">{p.category}</td>
                <td className="px-4 py-3 text-[var(--color-text-primary)]">Rp{p.price.toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">{p.stock}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(p.id)} className={`rounded-full px-3 py-1 text-xs font-medium ${p.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{p.isActive ? 'Aktif' : 'Nonaktif'}</button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/produk/${p.id}/edit`} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Edit</Link>
                    <button onClick={() => setConfirmTarget({ id: p.id, name: p.name })} className="text-xs text-red-400 hover:text-red-500">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
      <ConfirmModal
        open={!!confirmTarget}
        title="Hapus Produk"
        message={`Yakin ingin menghapus "${confirmTarget?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onConfirm={remove}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  )
}