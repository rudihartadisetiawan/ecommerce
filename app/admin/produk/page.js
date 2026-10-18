'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'inactive', label: 'Nonaktif' },
  { key: 'low', label: 'Stok Hampir Habis' },
  { key: 'out', label: 'Habis' },
]

export default function AdminProdukPage() {
  const [products, setProducts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/products?all=true')
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : (data.products || []))
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (id) => {
    const p = products.find(pr => pr.id === id)
    if (!p) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !p.isActive }) })
      if (!res.ok) { alert('Gagal mengubah status'); return }
      load()
    } catch { alert('Terjadi kesalahan jaringan. Coba lagi.') }
  }

  const toggleFeatured = async (id) => {
    const p = products.find(pr => pr.id === id)
    if (!p) return
    try {
      await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFeatured: !p.isFeatured }) })
      load()
    } catch {}
  }

  const remove = useCallback(async () => {
    if (!confirmTarget) return
    const { id } = confirmTarget
    setConfirmTarget(null)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.error || 'Gagal menghapus produk'); return }
      load()
    } catch { alert('Terjadi kesalahan jaringan.') }
  }, [confirmTarget, load])

  const fmtRp = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

  const counts = useMemo(() => ({
    all: products.length,
    active: products.filter(p => p.isActive).length,
    inactive: products.filter(p => !p.isActive).length,
    low: products.filter(p => p.isActive && p.stock > 0 && p.stock <= 5).length,
    out: products.filter(p => p.isActive && p.stock === 0).length,
  }), [products])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p => {
      const inFilter =
        filter === 'all' ? true :
        filter === 'active' ? p.isActive :
        filter === 'inactive' ? !p.isActive :
        filter === 'low' ? (p.isActive && p.stock > 0 && p.stock <= 5) :
        filter === 'out' ? (p.isActive && p.stock === 0) : true
      if (!inFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        String(p.id).includes(q)
      )
    })
  }, [products, search, filter])

  return (
    <>
      {/* ── Page Header ── */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9C9589]">Katalog</p>
          <h1 className="mt-1.5 font-[var(--font-display)] text-2xl font-medium text-[#1C1C1A]">Produk</h1>
          <p className="mt-1.5 text-sm text-[#9C9589]">{products.length} produk terdaftar</p>
        </div>
        <Link
          href="/admin/produk/add"
          className="flex items-center gap-2 rounded-xl bg-[#1C1C1A] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#D4A373]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Produk
        </Link>
      </div>

      {/* ── Toolbar: Search + Filters ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9C9589]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kategori, atau ID..."
            className="w-full rounded-xl border border-[#EEEBE4] bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#D4A373]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-[#1C1C1A] text-white'
                  : 'bg-white border border-[#EEEBE4] text-[#6B655A] hover:bg-[#F5F4F1]'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 font-bold ${filter === f.key ? 'text-[#D4A373]' : 'text-[#9C9589]'}`}>{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Product Table ── */}
      <div className="rounded-2xl border border-[#EEEBE4] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#EEEBE4] bg-[#FAFAF9]">
                {['Produk', 'Kategori', 'Harga', 'Stok', 'Status', 'Featured', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#9C9589]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F4F1]">
              {!loaded ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#9C9589]">Memuat produk…</td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#9C9589]">
                    {products.length === 0 ? 'Belum ada produk. Tambahkan produk pertama Anda!' : 'Tidak ada produk yang cocok dengan pencarian.'}
                  </td>
                </tr>
              ) : visible.map(p => (
                <tr key={p.id} className="group transition-colors hover:bg-[#FAFAF9]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-7 shrink-0 overflow-hidden rounded-lg bg-[#F5F4F1]">
                        {p.image && <img src={p.image} alt={p.name} className="h-full w-full object-cover" />}
                      </div>
                      <span className="text-sm font-medium text-[#1C1C1A]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-[#F5F4F1] px-2.5 py-1 text-[10px] font-medium text-[#6B655A]">{p.category}</span>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-[#1C1C1A]">
                    {fmtRp(p.price)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-[#1C1C1A]'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleActive(p.id)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        p.isActive
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-500 hover:bg-red-100'
                      }`}
                    >
                      {p.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleFeatured(p.id)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        p.isFeatured
                          ? 'bg-[#D4A373]/20 text-[#B8874F] hover:bg-[#D4A373]/30'
                          : 'bg-[#F5F4F1] text-[#9C9589] hover:bg-[#EEEBE4] hover:text-[#6B655A]'
                      }`}
                    >
                      {p.isFeatured ? '★ Featured' : 'Set Featured'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/produk/${p.id}/edit`} className="text-xs font-medium text-[#6B655A] hover:text-[#1C1C1A] transition-colors">Edit</Link>
                      <button onClick={() => setConfirmTarget({ id: p.id, name: p.name })} className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">Hapus</button>
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