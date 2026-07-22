'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ConfirmModal from '@/components/ui/ConfirmModal'

const STATUS_COLORS = {
  pending: '#F59E0B',
  paid: '#3B82F6',
  processing: '#6366F1',
  shipped: '#06B6D4',
  completed: '#D4A373',
  cancelled: '#EF4444',
}
const STATUS_ORDER = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled']

export default function AdminProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [ordersCount, setOrdersCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [chartReady, setChartReady] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)

  const isSuperAdmin = session?.user?.role === 'super_admin'

  const load = () => {
    Promise.all([
      fetch('/api/products?all=true').then(r => r.json()).then(d => { setProducts(Array.isArray(d) ? d : (d.products || [])) }),
      fetch('/api/orders?all=true').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          setOrders(data)
          const pending = data.filter(o => o.status === 'paid' || o.status === 'pending').length
          const revenue = data.filter(o => o.status === 'paid' || o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0)
          setOrdersCount(pending)
          setTotalRevenue(revenue)
        } else {
          setOrders([])
        }
      }).catch(() => setOrders([])),
    ]).finally(() => setChartReady(true))
  }

  useEffect(() => { load() }, [])

  const monthlySales = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString('id-ID', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        total: 0,
      })
    }
    orders.forEach(o => {
      if (o.status !== 'paid' && o.status !== 'completed') return
      const d = new Date(o.createdAt)
      const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth())
      if (m) m.total += o.total || 0
    })
    return months
  }, [orders])

  const topProducts = useMemo(() => {
    const counts = new Map()
    orders.forEach(o => {
      if (o.status !== 'completed') return
      ;(o.items || []).forEach(item => {
        const pid = item.productId || item.product?.id
        if (!pid) return
        counts.set(pid, (counts.get(pid) || 0) + (item.quantity || 1))
      })
    })
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, qty]) => ({
        id,
        qty,
        name: products.find(p => p.id === id)?.name || 'Produk dihapus',
      }))
  }, [orders, products])

  const statusBreakdown = useMemo(() => {
    const counts = { pending: 0, paid: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 }
    orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++ })
    return counts
  }, [orders])



  const lowStockProducts = useMemo(() =>
    products.filter(p => p.isActive && p.stock <= 5 && p.stock > 0)
      .sort((a, b) => a.stock - b.stock),
  [products])

  const outOfStockCount = useMemo(() =>
    products.filter(p => p.isActive && p.stock === 0).length,
  [products])

  // ponytail: top customers dihitung dari jumlah pesanan (bukan total belanja)
  const topCustomers = useMemo(() => {
    const counts = new Map()
    orders.forEach(o => {
      if (!o.userId) return
      const key = `${o.userId}`
      if (!counts.has(key)) counts.set(key, { name: o.userName || `User #${o.userId}`, orderCount: 0, totalSpent: 0, userId: o.userId })
      const c = counts.get(key)
      c.orderCount++
      if (o.status === 'paid' || o.status === 'completed') c.totalSpent += o.total || 0
    })
    return [...counts.values()].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5)
  }, [orders])

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

  const toggleFeatured = async (id) => {
    const p = products.find(pr => pr.id === id)
    if (!p) return
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !p.isFeatured }),
      })
      load()
    } catch {}
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

      {chartReady && orders.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-[var(--color-bg-section)] bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="font-[var(--font-display)] text-lg text-[var(--color-text-primary)]">Penjualan 6 Bulan Terakhir</h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">Total omset per bulan</p>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">IDR</span>
              </div>
              <div className="flex h-44 items-end gap-2 px-1">
                {(() => {
                  const max = Math.max(...monthlySales.map(m => m.total), 1)
                  return monthlySales.map(m => {
                    const pct = (m.total / max) * 100
                    const h = m.total > 0 ? Math.max(pct, 3) : 0
                    return (
                      <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                        <div
                          className="w-full rounded-t bg-[var(--color-accent)] hover:brightness-75 transition-all cursor-default"
                          style={{ height: `${h}%` }}
                          title={`${m.label} ${m.year}: Rp${m.total.toLocaleString('id-ID')}`}
                        />
                        <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">{m.label}</span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-bg-section)] bg-white p-5 shadow-xs">
              <div className="mb-4">
                <h2 className="font-[var(--font-display)] text-lg text-[var(--color-text-primary)]">Status Pesanan</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">Komposisi status saat ini</p>
              </div>
              {(() => {
                const total = Object.values(statusBreakdown).reduce((s, v) => s + v, 0)
                let cursor = 0
                const segments = []
                if (total > 0) {
                  STATUS_ORDER.forEach(key => {
                    const val = statusBreakdown[key]
                    if (val === 0) return
                    const start = cursor
                    const end = cursor + (val / total) * 100
                    segments.push({ key, start, end, color: STATUS_COLORS[key], val })
                    cursor = end
                  })
                }
                const gradient = total > 0
                  ? `conic-gradient(${segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`
                  : 'conic-gradient(#e5e7eb 0% 100%)'
                return (
                  <div>
                    <div className="relative h-28 w-28 mx-auto">
                      <div className="absolute inset-0 rounded-full" style={{ background: gradient }} />
                      <div className="absolute inset-5 rounded-full bg-white flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-lg font-bold text-[var(--color-text-primary)] leading-none">{total}</p>
                          <p className="text-[8px] text-[var(--color-text-secondary)] uppercase tracking-wide mt-0.5">Total</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1">
                      {STATUS_ORDER.map(s => (
                        <div key={s} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-sm flex-shrink-0" style={{ background: STATUS_COLORS[s] }} />
                            <span className="capitalize text-[var(--color-text-secondary)]">{s}</span>
                          </div>
                          <span className="font-semibold text-[var(--color-text-primary)]">{statusBreakdown[s]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-bg-section)] bg-white p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="font-[var(--font-display)] text-lg text-[var(--color-text-primary)]">Produk Terlaris</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">Top 5 produk dengan penjualan tertinggi</p>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-xs text-center text-[var(--color-text-secondary)] py-6">Belum ada pesanan completed</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const maxQty = topProducts[0]?.qty || 1
                  return topProducts.map((p, i) => {
                    const pct = (p.qty / maxQty) * 100
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="w-5 text-xs font-bold text-[var(--color-text-secondary)] tabular-nums">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1 gap-2">
                            <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">{p.name}</span>
                            <span className="text-xs font-semibold text-[var(--color-text-secondary)] flex-shrink-0 tabular-nums">{p.qty} terjual</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--color-bg-section)] overflow-hidden">
                            <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {chartReady && orders.length === 0 && (
        <div className="mb-8 rounded-2xl border border-dashed border-[var(--color-bg-section)] bg-white/50 p-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">Belum ada data pesanan untuk ditampilkan</p>
        </div>
      )}

      {/* Analisis Keuangan — Khusus Super Admin */}


      {/* Low Stock Alert */}
      {chartReady && (lowStockProducts.length > 0 || outOfStockCount > 0) && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="font-[var(--font-display)] text-lg text-[var(--color-text-primary)]">Peringatan Stok</h2>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">{lowStockProducts.length + outOfStockCount} produk kritis</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {outOfStockCount > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">0</div>
                <div>
                  <p className="text-xs font-semibold text-red-700">{outOfStockCount} produk habis</p>
                  <p className="text-[10px] text-red-500">Stok kosong — segera restok</p>
                </div>
              </div>
            )}
            {lowStockProducts.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-xs">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${p.stock <= 2 ? 'bg-red-500' : 'bg-amber-500'}`}>{p.stock}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">{p.name}</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">{p.category} · Rp{p.price.toLocaleString('id-ID')}</p>
                </div>
                <Link href={`/admin/produk/${p.id}/edit`} className="shrink-0 rounded-full border border-[var(--color-text-secondary)]/20 px-2.5 py-1 text-[10px] font-medium hover:bg-white">Edit</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Customers */}
      {chartReady && topCustomers.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[var(--color-bg-section)] bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">👥</span>
            <h2 className="font-[var(--font-display)] text-lg text-[var(--color-text-primary)]">Top Pelanggan</h2>
            <span className="text-[10px] text-[var(--color-text-secondary)]">Berdasarkan jumlah pesanan</span>
          </div>
          <div className="space-y-2">
            {topCustomers.map((c, i) => (
              <div key={c.userId || i} className="flex items-center gap-3 rounded-xl bg-[var(--color-bg-warm)]/50 p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-text-primary)] text-[10px] font-bold text-white">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">{c.name}</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">{c.orderCount} pesanan · Rp{c.totalSpent.toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              return (
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
                  {p.isFeatured ? (
                    <button onClick={() => toggleFeatured(p.id)} className="rounded-full bg-[var(--color-accent)]/20 px-3 py-1 text-xs font-medium text-[var(--color-accent)]">Featured</button>
                  ) : (
                    <button onClick={() => toggleFeatured(p.id)} className="rounded-full bg-[var(--color-bg-section)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Set Featured</button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/produk/${p.id}/edit`} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Edit</Link>
                    <button onClick={() => setConfirmTarget({ id: p.id, name: p.name })} className="text-xs text-red-400 hover:text-red-500">Hapus</button>
                  </div>
                </td>
              </tr>
            )})}
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