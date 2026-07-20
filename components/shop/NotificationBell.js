'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function NotificationBell() {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data)
          setUnread(data.length)
        }
      })
      .catch(() => {})
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const latest = notifications.slice(0, 5)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        aria-label="Notifikasi"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-xl"
          >
            <div className="border-b border-[var(--color-bg-section)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">Notifikasi</p>
            </div>
            {latest.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-[var(--color-text-secondary)]">Belum ada notifikasi.</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {latest.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ? `/produk/${n.link}` : '/produk'}
                    onClick={() => setOpen(false)}
                    className="block border-b border-[var(--color-bg-section)]/50 px-4 py-3 transition-colors hover:bg-[var(--color-bg-warm)]"
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${n.type === 'promo' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {n.type === 'promo' ? 'Promo' : 'Baru'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{n.title}</p>
                        <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)] line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[9px] text-[var(--color-text-secondary)]/50">
                          {new Date(n.sentAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/account/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-[var(--color-bg-section)] px-4 py-2 text-center text-[10px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              Lihat Semua ({notifications.length})
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
