'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { OrderSkeleton } from '@/components/ui/Skeleton'
import PageHeader from '@/components/ui/PageHeader'
import FilterTabs from '@/components/ui/FilterTabs'

const statusConfig = {
  pending: { label: 'Menunggu Pembayaran', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  paid: { label: 'Dibayar', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  processing: { label: 'Diproses', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  shipped: { label: 'Dikirim', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  completed: { label: 'Selesai', color: 'text-green-700 bg-green-50 border-green-200' },
  cancelled: { label: 'Dibatalkan', color: 'text-red-600 bg-red-50 border-red-200' },
}

const TABS = [
  { id: 'all', label: 'Semua', match: () => true },
  { id: 'unpaid', label: 'Belum Bayar', match: o => o.status === 'pending' },
  { id: 'processing', label: 'Diproses', match: o => o.status === 'paid' || o.status === 'processing' },
  { id: 'shipped', label: 'Dikirim', match: o => o.status === 'shipped' },
  { id: 'completed', label: 'Selesai', match: o => o.status === 'completed' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const activeTab = TABS.find(t => t.id === tab) || TABS[0]
  const filtered = orders.filter(activeTab.match)
  const tabs = TABS.map(t => ({ ...t, count: orders.filter(t.match).length }))

  return (
    <>
      <PageHeader
        title="Pesanan"
        description="Riwayat dan status pesanan kamu, dari menunggu pembayaran sampai selesai."
        action={
          !loading && orders.length > 0 ? (
            <span className="rounded-full border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
              {orders.length} Pesanan
            </span>
          ) : null
        }
      />

      {loading ? (
        <OrderSkeleton count={4} />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-text-secondary)]/30 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-section)]">
            <svg className="h-6 w-6 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">Belum ada pesanan</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Temukan outfit harian yang kamu banget.</p>
          <Link href="/produk" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)]">
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <FilterTabs tabs={tabs} value={tab} onChange={setTab} />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-text-secondary)]/30 py-12 text-center">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Belum ada pesanan di tab ini</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Coba pilih tab lain atau buat pesanan baru.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((order, i) => {
                const cfg = statusConfig[order.status] || { label: order.status, color: 'text-gray-600 bg-gray-50 border-gray-200' }
                const date = new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                const thumbs = (order.items || []).slice(0, 2)
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-[var(--color-text-secondary)]/30 hover:shadow-lg hover:shadow-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)]"
                    >
                      {/* Tumpukan foto produk */}
                      <div className="hidden shrink-0 sm:flex">
                        {thumbs.map((item, j) => (
                          <div
                            key={j}
                            className={`h-12 w-10 overflow-hidden rounded-lg border-2 border-[var(--color-surface)] bg-[var(--color-bg-section)] ${j > 0 ? '-ml-4' : ''}`}
                            style={{ zIndex: thumbs.length - j }}
                          >
                            {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                          </div>
                        ))}
                        {(order.items?.length || 0) > 2 && (
                          <span className="-ml-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-bg-section)] text-[10px] font-semibold text-[var(--color-text-secondary)]">
                            +{order.items.length - 2}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm font-semibold tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">
                          {order.id}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{date} · {order.items?.length || 0} item</p>
                      </div>

                      <p className="hidden text-sm font-semibold tabular-nums text-[var(--color-text-primary)] sm:block">
                        Rp{order.total.toLocaleString('id-ID')}
                      </p>

                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>

                      <svg className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}