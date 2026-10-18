'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import ImageUpload from '@/components/ui/ImageUpload'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

const APP_IMG = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop'

const inputCls = 'w-full rounded-xl border border-[#EEEBE4] bg-[#FAFAF9] px-3.5 py-2.5 text-sm text-[#1C1C1A] outline-none transition-colors focus:border-[#D4A373] focus:bg-white focus:ring-2 focus:ring-[#D4A373]/15'
const labelCls = 'mb-1.5 block text-xs font-semibold text-[#6B655A]'

const Ico = {
  Image: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  ),
  Active: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Off: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  Plus: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Trash: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
}

// Statistik kecil
function Stat({ icon, label, value, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#EEEBE4] bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-[#9C9589]">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent ? 'bg-[#D4A373]/15 text-[#B8874F]' : 'bg-[#F5F4F1] text-[#9C9589]'}`}>
          {icon}
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-[#1C1C1A]">{value}</p>
    </motion.div>
  )
}

// Preview banner — tampilan inline ala homepage
function BannerPreview({ item }) {
  const title = item.title || 'NEW COLLECTION'
  const words = title.split(' ')
  return (
    <div className="relative aspect-[21/9] w-full select-none overflow-hidden rounded-2xl border border-[#EEEBE4] bg-[#F0EDE6] sm:aspect-[16/6]">
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={title}
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-[#9C9589]">
          Belum ada gambar banner
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/15 to-transparent" />

      <div className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-10">
        <span className="mb-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#D4A373]">
          Koleksi Terbaru
        </span>
        <h3 className="font-[var(--font-display)] text-2xl leading-[1.05] tracking-tight text-white sm:text-4xl">
          {words[0] && <span className="block">{words[0].toUpperCase()}</span>}
          {words[1] && <span>{words[1].toUpperCase()}</span>}
        </h3>
        {item.subtitle && (
          <p className="mt-2 line-clamp-1 max-w-sm text-xs text-white/80 sm:text-sm">
            {item.subtitle}
          </p>
        )}
        {item.ctaText && (
          <span className="mt-4 rounded-full bg-white px-4 py-1.5 text-[10px] font-semibold text-[#1C1C1A] sm:text-xs">
            {item.ctaText}
          </span>
        )}
      </div>
    </div>
  )
}

export default function AdminHeroPage() {
  const addToast = useToast()
  const [heroItems, setHeroItems] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmSave, setConfirmSave] = useState(null)
  const [adding, setAdding] = useState(false)

  const load = () => fetch('/api/hero?all=true').then(r => r.json()).then(setHeroItems).catch(() => {})
  useEffect(() => { load() }, [])

  const stats = useMemo(() => ({
    total: heroItems.length,
    active: heroItems.filter(h => h.isActive).length,
    inactive: heroItems.filter(h => !h.isActive).length,
  }), [heroItems])

  const toggleActive = async (id, isActive) => {
    await fetch(`/api/hero/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    load()
  }

  const updateItem = (id, field, value) => {
    setHeroItems(h => h.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const saveItem = async (id) => {
    const item = heroItems.find(h => h.id === id)
    if (!item) return
    const res = await fetch(`/api/hero/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.title,
        subtitle: item.subtitle,
        ctaText: item.ctaText,
        ctaLink: item.ctaLink,
        imageUrl: item.imageUrl,
        isActive: item.isActive,
        order: Number(item.order || 0),
      }),
    })
    if (res.ok) {
      addToast('Perubahan berhasil disimpan.', 'success')
    } else {
      addToast('Gagal menyimpan perubahan.', 'error')
    }
    load()
  }

  const addItem = async () => {
    setAdding(true)
    await fetch('/api/hero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Banner', imageUrl: APP_IMG, subtitle: '', ctaText: '', ctaLink: '/produk' }),
    })
    setAdding(false)
    addToast('Banner baru ditambahkan.', 'success')
    load()
  }

  const remove = async (id) => {
    await fetch(`/api/hero/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    addToast('Banner dihapus.', 'info')
    load()
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl text-[#1C1C1A] sm:text-4xl">Hero Banner</h1>
            <p className="mt-2 text-sm text-[#6B655A]">Kelola slide banner promosi di homepage</p>
          </div>
          <button
            onClick={addItem}
            disabled={adding}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1C1C1A] px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#D4A373] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Ico.Plus />
            )}
            Tambah Banner
          </button>
        </div>
      </div>

      {/* ── Ringkasan ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<Ico.Image />} label="Total Banner" value={stats.total} />
        <Stat icon={<Ico.Active />} label="Tampil di Homepage" value={stats.active} accent />
        <Stat icon={<Ico.Off />} label="Nonaktif" value={stats.inactive} />
      </div>

      {/* ── Daftar Banner ── */}
      {heroItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#EEEBE4] bg-white/60 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F4F1] text-[#9C9589]">
            <Ico.Image />
          </div>
          <p className="text-sm font-semibold text-[#1C1C1A]">Belum ada banner</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-[#9C9589]">Tambahkan banner pertamamu — langsung tampil sebagai hero homepage.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {heroItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', damping: 26, stiffness: 300 }}
              className="overflow-hidden rounded-2xl border border-[#EEEBE4] bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEBE4] bg-[#FAFAF9] px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-2 w-2 items-center justify-center rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    {item.isActive && <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400/50" />}
                  </span>
                  <h3 className="text-sm font-semibold text-[#1C1C1A]">{item.title || 'Judul Banner Kosong'}</h3>
                  <span className="rounded-md bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#9C9589] ring-1 ring-[#EEEBE4]">
                    #{item.order ?? i + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(item.id, item.isActive)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      item.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'border-[#EEEBE4] bg-white text-[#9C9589] hover:text-[#6B655A]'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(item.id)}
                    className="rounded-full border border-red-100 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {/* Live preview */}
              <div className="p-3 sm:p-5">
                <BannerPreview item={item} />
              </div>

              {/* Form fields */}
              <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Judul Banner</label>
                  <input value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Sub-judul</label>
                  <input value={item.subtitle} onChange={e => updateItem(item.id, 'subtitle', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Teks Tombol CTA</label>
                  <input value={item.ctaText} onChange={e => updateItem(item.id, 'ctaText', e.target.value)} className={inputCls} placeholder="Lihat Koleksi" />
                </div>
                <div>
                  <label className={labelCls}>Link Tombol CTA</label>
                  <input value={item.ctaLink} onChange={e => updateItem(item.id, 'ctaLink', e.target.value)} className={inputCls} placeholder="/produk" />
                </div>
                <div className="sm:col-span-2">
                  <ImageUpload value={item.imageUrl} onChange={(url) => updateItem(item.id, 'imageUrl', url)} label="Gambar Banner" />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-[#EEEBE4] bg-[#FAFAF9] px-5 py-3.5">
                <button
                  onClick={() => setConfirmSave(item.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1C1C1A] px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#D4A373]"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22.672 15.226l-2.432.779.842-2.512c-.476-.582-.855-1.226-1.102-1.921l2.525-.808a.75.75 0 0 0-.528-1.416l-2.525.808a7.063 7.063 0 0 0-3.056-2.714V4.5a.75.75 0 0 0-1.5 0v1.419a7.063 7.063 0 0 0-3.028 2.697l-2.55-.815a.75.75 0 1 0-.52 1.401l2.55.815a7.063 7.063 0 0 0-.198 4.094l-2.514.784a.75.75 0 1 0 .52 1.401l1.402.437m14.874-1.684.017-.005-2.344 7.303a.75.75 0 0 1-.924.507L7.5 21.75V14.25M15 12.75v4.5m-7.5-9a1.5 1.5 0 0 1-1.5 1.5H4.5v-6h1.5A1.5 1.5 0 0 0 7.5 3v1.5m0 0A1.5 1.5 0 0 1 6 6M12 18.75h5.25" />
                  </svg>
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Hapus banner?"
        message="Banner akan dihapus permanen dan hilang dari homepage. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={() => remove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        open={!!confirmSave}
        title="Simpan perubahan?"
        message="Perubahan pada banner ini akan segera diterapkan di homepage."
        confirmLabel="Ya, Simpan"
        cancelLabel="Batal"
        onConfirm={() => { const id = confirmSave; setConfirmSave(null); saveItem(id) }}
        onCancel={() => setConfirmSave(null)}
      />
    </div>
  )
}