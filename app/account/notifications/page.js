'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const typeConfig = {
  promo: { label: 'Promo', dot: 'bg-amber-500', border: 'border-l-amber-400', icon: '🏷', bg: 'bg-amber-50 text-amber-700' },
  new_collection: { label: 'Koleksi Baru', dot: 'bg-blue-500', border: 'border-l-blue-400', icon: '✨', bg: 'bg-blue-50 text-blue-700' },
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d

  if (diff < 86400000) {
    return `Hari ini, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (diff < 172800000) {
    return `Kemarin, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  }
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotifications(data) })
      .catch(() => {})
  }, [])

  const grouped = notifications.reduce((acc, n) => {
    const d = new Date(n.sentAt)
    const now = new Date()
    const diff = now - d
    let key
    if (diff < 86400000) key = 'Hari Ini'
    else if (diff < 172800000) key = 'Kemarin'
    else key = 'Sebelumnya'
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Notifikasi</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{notifications.length} notifikasi</p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-text-secondary)]/20 py-16 text-center">
          <svg className="mx-auto mb-3 h-10 w-10 text-[var(--color-text-secondary)]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <p className="text-sm text-[var(--color-text-secondary)]">Belum ada notifikasi.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{section}</h2>
              <div className="space-y-2">
                {items.map(n => {
                  const cfg = typeConfig[n.type] || typeConfig.new_collection
                  return (
                    <Link
                      key={n.id}
                      href={n.link ? `/produk/${n.link}` : '/produk'}
                      className={`block rounded-2xl border border-[var(--color-bg-section)] border-l-4 ${cfg.border} bg-[var(--color-surface)] p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-lg">{cfg.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.bg}`}>
                              {cfg.label}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-secondary)]/40">{formatDate(n.sentAt)}</span>
                          </div>
                          <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">{n.title}</p>
                          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">{n.message}</p>
                        </div>
                        <svg className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-secondary)]/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
