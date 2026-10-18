'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import ImageUpload from '@/components/ui/ImageUpload'
import { useToast } from '@/components/ui/Toast'

const BLOCK_KEYS = ['kategori-pilihan', 'tentang-gaul']

const inputCls = 'w-full rounded-xl border border-[#EEEBE4] bg-[#FAFAF9] px-3.5 py-2.5 text-sm text-[#1C1C1A] outline-none transition-colors focus:border-[#D4A373] focus:bg-white focus:ring-2 focus:ring-[#D4A373]/15'
const labelCls = 'mb-1.5 block text-xs font-semibold text-[#6B655A]'

// Template default untuk tiap block
function defaultData(key) {
  if (key === 'kategori-pilihan') {
    return {
      categories: [
        { name: 'Atasan', slug: 'Atasan', image: '', desc: 'Kaos, kemeja, polo — everyday essentials.' },
        { name: 'Bawahan', slug: 'Bawahan', image: '', desc: 'Chino, cargo, wide leg — siluet santai.' },
        { name: 'Outerwear', slug: 'Outerwear', image: '', desc: 'Jaket denim, bomber — layering game.' },
        { name: 'Aksesoris', slug: 'Aksesoris', image: '', desc: 'Tas, jam, kacamata — pelengkap gaya.' },
      ]
    }
  }
  if (key === 'tentang-gaul') {
    return {
      image: '',
      title: 'Tentang GAUL',
      subtitle: 'Cerita Kami',
      paragraph1: 'GAUL lahir dari keyakinan bahwa outfit harian harusnya nggak ribet — cukup nyaman, cukup stylish, dan cukup kamu.',
      paragraph2: 'Koleksi kami dirancang untuk dipakai berulang, dicuci berulang, dan tetap terasa sama fresh-nya.',
      ctaText: 'Telusuri Koleksi',
      ctaLink: '/produk',
    }
  }
  return {}
}

const Ico = {
  Grid: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  ),
  About: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42Z" />
    </svg>
  ),
}

// Statistik ringkasan
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

// Preview kategori — grid 4 kolom ala homepage
function CategoryPreview({ cats }) {
  const list = (cats || []).slice(0, 4)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {list.map((c, i) => (
        <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-[#F0EDE6]">
          {c.image ? (
            <Image src={c.image} alt={c.name} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-[#9C9589]">No image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <p className="text-xs font-semibold text-white">{c.name || `Kategori ${i + 1}`}</p>
            {c.desc && <p className="mt-0.5 line-clamp-1 text-[9px] text-white/60">{c.desc}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// Preview section Tentang GAUL ala homepage
function AboutPreview({ data }) {
  if (!data) return null
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F0EDE6] sm:aspect-square sm:w-2/5">
        {data.image ? (
          <Image src={data.image} alt={data.title || 'Tentang'} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-[#9C9589]">No image</div>
        )}
      </div>
      <div className="flex-1">
        {data.subtitle && (
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#B8874F]">{data.subtitle}</p>
        )}
        <h4 className="mt-1 font-[var(--font-display)] text-xl text-[#1C1C1A]">{data.title || 'Tentang GAUL'}</h4>
        {data.paragraph1 && <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#6B655A]">{data.paragraph1}</p>}
        {data.paragraph2 && <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-[#6B655A]">{data.paragraph2}</p>}
        {data.ctaText && (
          <span className="mt-3 inline-block rounded-full border border-[#1C1C1A] px-4 py-1.5 text-[10px] font-semibold text-[#1C1C1A]">
            {data.ctaText}
          </span>
        )}
      </div>
    </div>
  )
}

// Kartu seksi konten
function SectionCard({ icon, label, sub, onSave, children, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', damping: 26, stiffness: 300 }}
      className="overflow-hidden rounded-2xl border border-[#EEEBE4] bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEBE4] bg-[#FAFAF9] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1C1C1A] text-white">
            {icon}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[#1C1C1A]">{label}</h3>
            {sub && <p className="text-[11px] text-[#9C9589]">{sub}</p>}
          </div>
        </div>
        <button
          onClick={onSave}
          className="rounded-xl bg-[#1C1C1A] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#D4A373]"
        >
          Simpan Perubahan
        </button>
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </motion.div>
  )
}

// Sub-komponen input field biar rapi
function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

export default function AdminKontenPage() {
  const addToast = useToast()
  const [blocks, setBlocks] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/content')
    const list = await res.json()
    const map = {}
    for (const b of list) map[b.key] = b
    setBlocks(map)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateBlock = (key, data) => {
    setBlocks(prev => ({ ...prev, [key]: { ...prev[key], data } }))
  }

  const updateCategory = (key, idx, field, val) => {
    const block = blocks[key]
    if (!block) return
    const cats = [...(block.data?.categories || [])]
    if (!cats[idx]) return
    cats[idx] = { ...cats[idx], [field]: val }
    updateBlock(key, { ...block.data, categories: cats })
  }

  const moveCategory = (key, idx, dir) => {
    const block = blocks[key]
    if (!block) return
    const cats = [...(block.data?.categories || [])]
    const target = idx + dir
    if (target < 0 || target >= cats.length) return
    ;[cats[idx], cats[target]] = [cats[target], cats[idx]]
    updateBlock(key, { ...block.data, categories: cats })
  }

  const addCategory = (key) => {
    const block = blocks[key]
    if (!block) return
    const cats = [...(block.data?.categories || [])]
    cats.push({ name: '', slug: '', image: '', desc: '' })
    updateBlock(key, { ...block.data, categories: cats })
  }

  const removeCategory = (key, idx) => {
    const block = blocks[key]
    if (!block) return
    const cats = [...(block.data?.categories || [])]
    cats.splice(idx, 1)
    updateBlock(key, { ...block.data, categories: cats })
  }

  const save = async (key) => {
    const block = blocks[key]
    if (!block) return
    setSavingKey(key)
    const res = await fetch(`/api/content?key=${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: block.label, data: block.data }),
    })
    setSavingKey(null)
    if (res.ok) {
      addToast('Perubahan berhasil disimpan.', 'success')
      load()
    } else {
      addToast('Gagal menyimpan perubahan.', 'error')
    }
  }

  if (loading) {
    return (
<div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-[#6B655A]">Memuat konten…</p>
      </div>
    )
  }

  const catData = blocks['kategori-pilihan']?.data || defaultData('kategori-pilihan')
  const aboutData = blocks['tentang-gaul']?.data || defaultData('tentang-gaul')

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[#1C1C1A] sm:text-4xl">Konten Homepage</h1>
          <p className="mt-2 text-sm text-[#6B655A]">Kelola isi bagian kategori dan cerita brand di halaman utama</p>
        </div>
      </div>

      {/* ── Ringkasan ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat icon={<Ico.Grid />} label="Total Kategori" value={catData.categories?.length || 0} accent />
        <Stat icon={<Ico.About />} label="Seksi Konten" value={BLOCK_KEYS.length} />
        <Stat
          icon={<Ico.Grid />}
          label="Kategori Bergambar"
          value={(catData.categories || []).filter(c => c.image).length}
        />
        <Stat
          icon={<Ico.About />}
          label="Cerita Brand"
          value={aboutData.paragraph1 ? 'Terisi' : 'Kosong'}
        />
      </div>

      <div className="space-y-7">
        {/* ===== KATEGORI PILIHAN ===== */}
        <SectionCard
          index={0}
          icon={<Ico.Grid />}
          label={blocks['kategori-pilihan']?.label || 'Kategori Pilihan'}
          sub="Grid kategori yang tampil di homepage"
          onSave={() => save('kategori-pilihan')}
        >
          {/* Preview live */}
          <div className="rounded-2xl border border-[#EEF0F2] bg-[#F8F9FA] p-3">
            <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#9C9589]">
              Preview — tampil di homepage
            </p>
            <CategoryPreview cats={catData.categories} />
          </div>

          {/* Daftar kategori */}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {(catData.categories || []).map((cat, idx) => (
              <div key={idx} className="rounded-xl border border-[#EEEBE4] bg-[#FAFAF9] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#6B655A]">Kategori {idx + 1}</h4>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveCategory('kategori-pilihan', idx, -1)}
                      disabled={idx === 0}
                      className="rounded-md p-1 text-[#9C9589] transition-colors hover:bg-[#F0EDE6] hover:text-[#1C1C1A] disabled:cursor-not-allowed disabled:opacity-30"
                      title="Pindah ke atas"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveCategory('kategori-pilihan', idx, 1)}
                      disabled={idx === (catData.categories || []).length - 1}
                      className="rounded-md p-1 text-[#9C9589] transition-colors hover:bg-[#F0EDE6] hover:text-[#1C1C1A] disabled:cursor-not-allowed disabled:opacity-30"
                      title="Pindah ke bawah"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeCategory('kategori-pilihan', idx)}
                      className="rounded-md p-1 text-red-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Hapus kategori"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nama">
                      <input value={cat.name} onChange={e => updateCategory('kategori-pilihan', idx, 'name', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Slug (filter)">
                      <input value={cat.slug} onChange={e => updateCategory('kategori-pilihan', idx, 'slug', e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Deskripsi">
                    <input value={cat.desc} onChange={e => updateCategory('kategori-pilihan', idx, 'desc', e.target.value)} className={inputCls} />
                  </Field>
                  <ImageUpload
                    value={cat.image}
                    onChange={url => updateCategory('kategori-pilihan', idx, 'image', url)}
                    label="Gambar Kategori"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <button
              onClick={() => addCategory('kategori-pilihan')}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#D4C9B8] px-4 py-2 text-xs font-semibold text-[#B8874F] transition-colors hover:bg-[#D4A373]/10"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tambah Kategori
            </button>
          </div>
        </SectionCard>

        {/* ===== TENTANG GAUL ===== */}
        <SectionCard
          index={1}
          icon={<Ico.About />}
          label={blocks['tentang-gaul']?.label || 'Tentang GAUL'}
          sub="Cerita brand di bawah grid kategori"
          onSave={() => save('tentang-gaul')}
        >
          {(() => {
            const data = blocks['tentang-gaul']?.data || defaultData('tentang-gaul')
            return (
              <>
                {/* Preview live */}
                <div className="rounded-2xl border border-[#EEF0F2] bg-[#F8F9FA] p-3">
                  <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#9C9589]">
                    Preview — tampil di homepage
                  </p>
                  <div className="rounded-xl bg-white p-4">
                    <AboutPreview data={data} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Subtitle (label atas)">
                    <input value={data.subtitle || ''} onChange={e => updateBlock('tentang-gaul', { ...data, subtitle: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Judul">
                    <input value={data.title || ''} onChange={e => updateBlock('tentang-gaul', { ...data, title: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <Field label="Paragraf 1">
                  <textarea rows={3} value={data.paragraph1 || ''} onChange={e => updateBlock('tentang-gaul', { ...data, paragraph1: e.target.value })} className={`${inputCls} resize-y`} />
                </Field>
                <Field label="Paragraf 2">
                  <textarea rows={3} value={data.paragraph2 || ''} onChange={e => updateBlock('tentang-gaul', { ...data, paragraph2: e.target.value })} className={`${inputCls} resize-y`} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Teks Tombol">
                    <input value={data.ctaText || ''} onChange={e => updateBlock('tentang-gaul', { ...data, ctaText: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Link Tombol">
                    <input value={data.ctaLink || ''} onChange={e => updateBlock('tentang-gaul', { ...data, ctaLink: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <ImageUpload
                  value={data.image || ''}
                  onChange={url => updateBlock('tentang-gaul', { ...data, image: url })}
                  label="Gambar Tentang GAUL"
                />
              </>
            )
          })()}
        </SectionCard>
      </div>

      {/* Toast indikator saat save */}
      <AnimatePresence>
        {savingKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-[#1C1C1A]/90 px-5 py-2.5 text-xs font-medium text-white shadow-lg backdrop-blur-md"
          >
            Menyimpan perubahan…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}