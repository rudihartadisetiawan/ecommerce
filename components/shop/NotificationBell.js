'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

import { NotificationSkeleton } from '@/components/ui/Skeleton'

const STORAGE_KEY = 'gaul_notif_last_seen'
const POLL_INTERVAL = 30000 // 30 detik

const typeConfig = {
  promo: { label: 'Promo', dot: 'bg-amber-500', border: 'border-l-amber-400', icon: '🏷' },
  new_collection: { label: 'Koleksi Baru', dot: 'bg-blue-500', border: 'border-l-blue-400', icon: '✨' },
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const day = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

  if (diff < 60000) return 'Baru saja'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}j lalu`
  if (diff < 172800000) return `Kemarin, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  return `${day}, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
}

function Toast({ notif, onDismiss }) {
  const cfg = typeConfig[notif.type] || typeConfig.new_collection
  useEffect(() => { const t = setTimeout(onDismiss, 5000); return () => clearTimeout(t) }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-4 shadow-lg"
    >
      <span className="mt-0.5 text-lg">{cfg.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--color-text-primary)]">{notif.title}</p>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)] line-clamp-2">{notif.message}</p>
      </div>
      <button onClick={onDismiss} className="shrink-0 text-[var(--color-text-secondary)]/40 hover:text-[var(--color-text-secondary)] transition-colors">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  )
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [toasts, setToasts] = useState([])
  const [lastPollId, setLastPollId] = useState(0)
  const ref = useRef(null)
  const prevUnread = useRef(0)

  // Fetch notifikasi
  const fetchNotifs = useCallback(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        setNotifications(data)

        const maxId = data.length > 0 ? Math.max(...data.map(n => n.id)) : 0
        const rawLastSeen = localStorage.getItem(STORAGE_KEY)

        // ponytail: user baru (belum punya STORAGE_KEY) → tandai semua notifikasi
        // existing sebagai sudah dilihat supaya tidak muncul sebagai unread saat pertama login.
        // Hanya notifikasi yang dibuat SETELAH user mendaftar yang akan dihitung unread.
        if (rawLastSeen === null && maxId > 0) {
          localStorage.setItem(STORAGE_KEY, String(maxId))
          setUnread(0)
          if (maxId > lastPollId) setLastPollId(maxId)
          return
        }

        const lastSeen = parseInt(rawLastSeen || '0', 10)
        const newUnread = data.filter(n => n.id > lastSeen).length
        setUnread(newUnread)

        // Deteksi notifikasi baru sejak poll terakhir → munculkan toast
        if (lastPollId > 0) {
          const fresh = data.filter(n => n.id > lastPollId && n.id > lastSeen)
          if (fresh.length > 0) {
            setToasts(prev => {
              const existingIds = new Set(prev.map(t => t.id))
              const newOnes = fresh.filter(n => !existingIds.has(n.id))
              return [...newOnes.map(n => ({ ...n, toastKey: Date.now() + Math.random() })), ...prev].slice(0, 3)
            })
          }
        }
        if (maxId > lastPollId) setLastPollId(maxId)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lastPollId])

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  // Animasi bell pulse saat ada unread baru
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    if (unread > prevUnread.current && prevUnread.current > 0) {
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
    }
    prevUnread.current = unread
  }, [unread])

  // Tandai semua sebagai dilihat saat dropdown dibuka
  useEffect(() => {
    if (open && notifications.length > 0) {
      const maxId = Math.max(...notifications.map(n => n.id))
      localStorage.setItem(STORAGE_KEY, String(maxId))
      setUnread(0)
    }
  }, [open, notifications])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const latest = notifications.slice(0, 5)

  return (
    <>
      {/* Toast container — fixed top-right */}
      <div className="pointer-events-none fixed top-20 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.toastKey || t.id} notif={t} onDismiss={() => dismissToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* Bell button */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          aria-label="Notifikasi"
        >
          <motion.svg
            animate={pulse ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </motion.svg>
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white"
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-bg-section)] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">Notifikasi</p>
                  <p className="text-[9px] text-[var(--color-text-secondary)]">{notifications.length} total</p>
                </div>
                {unread > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-semibold text-red-500">
                    {unread} baru
                  </span>
                )}
              </div>

              {/* List */}
              {loading ? (
                <NotificationSkeleton count={3} />
              ) : latest.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-10 text-center">
                  <svg className="mb-3 h-8 w-8 text-[var(--color-text-secondary)]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <p className="text-xs text-[var(--color-text-secondary)]">Belum ada notifikasi.</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-[var(--color-bg-section)]/50">
                  <AnimatePresence initial={false}>
                    {latest.map((n, i) => {
                      const cfg = typeConfig[n.type] || typeConfig.new_collection
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                        >
                          <Link
                            href={n.link ? `/produk/${n.link}` : '/produk'}
                            onClick={() => setOpen(false)}
                            className={`block border-l-2 ${cfg.border} px-4 py-3 transition-colors hover:bg-[var(--color-bg-warm)]`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 text-sm">{cfg.icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{cfg.label}</span>
                                </div>
                                <p className="mt-0.5 text-xs font-medium text-[var(--color-text-primary)] leading-snug">{n.title}</p>
                                <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">{n.message}</p>
                                <p className="mt-1 text-[9px] text-[var(--color-text-secondary)]/40">{formatTime(n.sentAt)}</p>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Footer */}
              {notifications.length > 5 && (
                <Link
                  href="/account/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1 border-t border-[var(--color-bg-section)] px-4 py-2.5 text-[10px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-warm)] hover:text-[var(--color-text-primary)]"
                >
                  Lihat Semua Notifikasi
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
