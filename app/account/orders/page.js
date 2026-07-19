'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const statusConfig = {
  pending: { label: 'Menunggu Pembayaran', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  paid: { label: 'Dibayar', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  processing: { label: 'Diproses', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  shipped: { label: 'Dikirim', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  completed: { label: 'Selesai', color: 'text-green-600 bg-green-50 border-green-200' },
  cancelled: { label: 'Dibatalkan', color: 'text-red-600 bg-red-50 border-red-200' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(setOrders).catch(() => {})
  }, [])

  return (
    <>
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Pesanan</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{orders.length} pesanan</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] py-20 text-center">
          <svg className="mb-4 h-12 w-12 text-[var(--color-text-secondary)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          <p className="text-sm text-[var(--color-text-secondary)]">Belum ada pesanan.</p>
          <Link href="/produk" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline">
            Mulai Belanja
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const cfg = statusConfig[order.status] || { label: order.status, icon: '?', color: 'text-gray-600 bg-gray-50 border-gray-200' }
            const date = new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-5 py-4 transition-all hover:border-[var(--color-text-secondary)]/30 hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={`hidden h-10 w-10 items-center justify-center rounded-xl border sm:flex ${cfg.color}`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {order.status === 'pending' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />}
                        {order.status === 'paid' && <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />}
                        {order.status === 'processing' && <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />}
                        {order.status === 'shipped' && <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V14.25m0 0h3.375" />}
                        {order.status === 'completed' && <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />}
                        {order.status === 'cancelled' && <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)] group-hover:underline">{order.id}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{date} · {order.items?.length || 0} item</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Rp{order.total.toLocaleString('id-ID')}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </>
  )
}