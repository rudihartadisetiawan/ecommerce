'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import FilterTabs from '@/components/ui/FilterTabs'
import { NotificationSkeleton } from '@/components/ui/Skeleton'

// TODO (backend): enum NotificationType di prisma/schema.prisma saat ini hanya
// new_collection & promo — status "dibaca" (read) dan expiresAt belum ada di model.
// Sampai backend siap, status baca di-mock di client (baca otomatis untuk yang lama).
const MOCK_READ_AFTER_MS = 48 * 60 * 60 * 1000 // 2 hari
const MOCK_PROMO_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000 // 14 hari

const typeConfig = {
  promo: {
    label: 'Promo',
    tone: 'bg-amber-50 text-amber-600 ring-amber-200',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
  },
  new_collection: {
    label: 'Koleksi Baru',
    tone: 'bg-blue-50 text-blue-600 ring-blue-200',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
  // TODO (backend): tipe Pesanan/Pengiriman — enum NotificationType belum punya nilai order.
  order: {
    label: 'Pesanan',
    tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
}

const FILTERS = [
  { id: 'all', label: 'Semua', match: () => true },
  { id: 'promo', label: 'Promo', match: n => n.type === 'promo' },
  { id: 'new_collection', label: 'Koleksi', match: n => n.type === 'new_collection' },
  { id: 'order', label: 'Pesanan', match: n => n.type === 'order' },
]

const PAGE_SIZE = 8

function fullDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function relativeTime(dateStr) {
  const d = new Date(dateStr)
  const ms = Date.now() - d
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'Baru saja'
  if (min < 60) return `${min} menit lalu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const day = Math.floor(hr / 24)
  if (day < 2) return 'Kemarin'
  if (day < 30) return `${day} hari lalu`
  const mo = Math.floor(day / 30)
  return `${mo} bulan lalu`
}

function groupKey(dateStr) {
  const ms = Date.now() - new Date(dateStr)
  if (ms < 86400000) return 'Hari ini'
  if (ms < 7 * 86400000) return 'Minggu ini'
  return 'Sebelumnya'
}

function isExpiredPromo(n) {
  // TODO (backend): ganti dengan field expiresAt di model Notification
  return n.type === 'promo' && Date.now() - new Date(n.sentAt) > MOCK_PROMO_EXPIRY_MS
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [readIds, setReadIds] = useState(new Set())
  // ponytail: track slug produk mana yang tidak valid (produk sudah dihapus)
  const [invalidSlugs, setInvalidSlugs] = useState(new Set())

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(async data => {
        if (!Array.isArray(data)) return
        setNotifications(data)

        // mock status baca: notifikasi lama dianggap sudah dibaca (TODO backend: field read)
        setReadIds(new Set(data.filter(n => Date.now() - new Date(n.sentAt) > MOCK_READ_AFTER_MS).map(n => n.id)))

        // Validasi slug produk — cek semua notifikasi yang punya link
        const slugsToCheck = [...new Set(data.filter(n => n.link).map(n => n.link))]
        if (slugsToCheck.length === 0) return

        const results = await Promise.allSettled(
          slugsToCheck.map(slug =>
            fetch(`/api/products/slug/${slug}`, { cache: 'no-store' })
              .then(r => ({ slug, ok: r.ok && r.status !== 404 }))
              .catch(() => ({ slug, ok: false }))
          )
        )

        const bad = new Set()
        results.forEach(r => {
          if (r.status === 'fulfilled' && !r.value.ok) bad.add(r.value.slug)
        })
        setInvalidSlugs(bad)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // reset pagination saat ganti filter
  useEffect(() => setVisible(PAGE_SIZE), [filter])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const filtered = useMemo(() => notifications.filter((FILTERS.find(f => f.id === filter) || FILTERS[0]).match), [notifications, filter])
  const shown = filtered.slice(0, visible)

  // kelompokkan item yang tampil berdasarkan waktu
  const grouped = shown.reduce((acc, n) => {
    const key = groupKey(n.sentAt)
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})

  const markAllRead = () => setReadIds(new Set(notifications.map(n => n.id)))
  const markRead = id => setReadIds(s => new Set(s).add(Number(id)))

  const tabs = FILTERS.map(f => ({ ...f, count: notifications.filter(f.match).length }))

  return (
    <div>
      <PageHeader
        title="Notifikasi"
        description="Kabar promo dan koleksi baru, dikirim langsung ke akun kamu."
        action={
          notifications.length > 0 ? (
            <span className="rounded-full border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
              {notifications.length} Notifikasi
            </span>
          ) : null
        }
      />

      {loading ? (
        <NotificationSkeleton count={4} />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-text-secondary)]/30 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-section)]">
            <svg className="h-6 w-6 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">Belum ada notifikasi</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Kabari kamu setiap ada koleksi baru atau promo.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-[var(--color-accent-dark)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)]"
              >
                Tandai semua sudah dibaca ({unreadCount})
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-text-secondary)]/30 py-12 text-center">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Tidak ada notifikasi di filter ini</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Coba pilih kategori yang lain.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([section, items]) => (
                <div key={section}>
                  <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{section}</h2>
                  <div className="space-y-2">
                    {items.map(n => {
                      const cfg = typeConfig[n.type] || typeConfig.new_collection
                      const isProductInvalid = n.link && invalidSlugs.has(n.link)
                      const isRead = readIds.has(n.id)
                      const expired = isExpiredPromo(n)

                      const cardContent = (
                        <div className="flex items-start gap-3.5">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${cfg.tone}`}>
                            {cfg.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[var(--color-bg-section)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                                {cfg.label}
                              </span>
                              {expired && (
                                <span className="rounded-full border border-[var(--color-text-secondary)]/25 bg-[var(--color-bg-section)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                                  Berakhir
                                </span>
                              )}
                              {isProductInvalid && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
                                  Produk tidak tersedia
                                </span>
                              )}
                              <span
                                className="text-[10px] text-[var(--color-text-secondary)]"
                                title={fullDate(n.sentAt)}
                              >
                                {relativeTime(n.sentAt)}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-start gap-2">
                              {!isRead && <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />}
                              <p className={`min-w-0 text-sm leading-snug ${isRead ? 'font-normal text-[var(--color-text-secondary)]' : 'font-semibold text-[var(--color-text-primary)]'}`}>
                                {n.title}
                              </p>
                            </div>
                            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">{n.message}</p>
                          </div>
                          {!isProductInvalid && (
                            <svg className="mt-2 h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                          )}
                        </div>
                      )

                      // ponytail: produk dihapus → tampilkan sebagai div non-clickable; produk valid → Link
                      if (isProductInvalid) {
                        return (
                          <div
                            key={n.id}
                            className="rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-4 opacity-80"
                          >
                            {cardContent}
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={n.id}
                          href={n.link ? `/produk/${n.link}` : '/produk'}
                          onClick={() => markRead(n.id)}
                          className={`group block rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)] ${
                            isRead
                              ? 'border-[var(--color-bg-section)]/70 bg-transparent'
                              : 'border-[var(--color-bg-section)] bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)]/30'
                          }`}
                        >
                          {cardContent}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {visible < filtered.length && (
                <div className="flex justify-center border-t border-[var(--color-bg-section)] pt-5">
                  <button
                    type="button"
                    onClick={() => setVisible(v => v + PAGE_SIZE)}
                    className="rounded-full border border-[var(--color-text-secondary)]/30 px-5 py-2.5 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)]"
                  >
                    Muat lebih banyak ({filtered.length - visible})
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}