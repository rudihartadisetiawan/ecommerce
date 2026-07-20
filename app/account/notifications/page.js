'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotifications(data) })
      .catch(() => {})
  }, [])

  return (
    <>
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Notifikasi</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{notifications.length} notifikasi</p>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-text-secondary)]/20 py-16 text-center">
          <svg className="mx-auto mb-3 h-10 w-10 text-[var(--color-text-secondary)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <p className="text-sm text-[var(--color-text-secondary)]">Belum ada notifikasi.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link ? `/produk/${n.link}` : '/produk'}
              className="block rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-4 shadow-sm transition-colors hover:bg-[var(--color-bg-warm)]"
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  n.type === 'promo' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {n.type === 'promo' ? 'Promo' : 'Koleksi Baru'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{n.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">{n.message}</p>
                  <p className="mt-2 text-[10px] text-[var(--color-text-secondary)]/50">
                    {new Date(n.sentAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
