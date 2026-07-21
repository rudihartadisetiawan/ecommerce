'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ImageUpload from '@/components/ui/ImageUpload'

const BLOCK_KEYS = ['kategori-pilihan', 'tentang-gaul']

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

export default function AdminKontenPage() {
  const [blocks, setBlocks] = useState({})
  const [loading, setLoading] = useState(true)

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
    setBlocks(prev => ({
      ...prev,
      [key]: { ...prev[key], data }
    }))
  }

  const updateCategory = (key, idx, field, val) => {
    const block = blocks[key]
    if (!block) return
    const cats = [...(block.data?.categories || [])]
    if (!cats[idx]) return
    cats[idx] = { ...cats[idx], [field]: val }
    updateBlock(key, { ...block.data, categories: cats })
  }

  const save = async (key) => {
    const block = blocks[key]
    if (!block) return
    const res = await fetch(`/api/content?key=${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: block.label, data: block.data }),
    })
    if (res.ok) {
      alert('Berhasil disimpan!')
      load()
    } else {
      alert('Gagal menyimpan.')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-[var(--color-text-secondary)]">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Kembali ke CMS</Link>
        <h1 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text-primary)] sm:text-3xl">Konten Homepage</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Kelola gambar dan teks untuk halaman utama</p>
      </div>

      <div className="space-y-8">
        {/* ===== KATEGORI PILIHAN ===== */}
        <SectionCard
          label={blocks['kategori-pilihan']?.label || 'Kategori Pilihan'}
          onSave={() => save('kategori-pilihan')}
        >
          {[0, 1, 2, 3].map(idx => {
            const cat = blocks['kategori-pilihan']?.data?.categories?.[idx]
            if (!cat) return null
            return (
              <div key={idx} className="rounded-xl border border-[var(--color-bg-section)] bg-[var(--color-bg-warm)]/50 p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Kategori {idx + 1}: {cat.name || '—'}
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Nama</label>
                      <input
                        value={cat.name}
                        onChange={e => updateCategory('kategori-pilihan', idx, 'name', e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Slug (filter)</label>
                      <input
                        value={cat.slug}
                        onChange={e => updateCategory('kategori-pilihan', idx, 'slug', e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Deskripsi</label>
                    <input
                      value={cat.desc}
                      onChange={e => updateCategory('kategori-pilihan', idx, 'desc', e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                  <ImageUpload
                    value={cat.image}
                    onChange={url => updateCategory('kategori-pilihan', idx, 'image', url)}
                    label="Gambar Kategori"
                  />
                </div>
              </div>
            )
          })}
        </SectionCard>

        {/* ===== TENTANG GAUL ===== */}
        <SectionCard
          label={blocks['tentang-gaul']?.label || 'Tentang GAUL'}
          onSave={() => save('tentang-gaul')}
        >
          {(() => {
            const data = blocks['tentang-gaul']?.data
            if (!data) return <p className="text-sm text-[var(--color-text-secondary)]">Belum ada data.</p>
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Subtitle (label atas)</label>
                    <input
                      value={data.subtitle || ''}
                      onChange={e => updateBlock('tentang-gaul', { ...data, subtitle: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Judul</label>
                    <input
                      value={data.title || ''}
                      onChange={e => updateBlock('tentang-gaul', { ...data, title: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Paragraf 1</label>
                  <textarea
                    rows={3}
                    value={data.paragraph1 || ''}
                    onChange={e => updateBlock('tentang-gaul', { ...data, paragraph1: e.target.value })}
                    className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Paragraf 2</label>
                  <textarea
                    rows={3}
                    value={data.paragraph2 || ''}
                    onChange={e => updateBlock('tentang-gaul', { ...data, paragraph2: e.target.value })}
                    className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] resize-y"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Teks Tombol</label>
                    <input
                      value={data.ctaText || ''}
                      onChange={e => updateBlock('tentang-gaul', { ...data, ctaText: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Link Tombol</label>
                    <input
                      value={data.ctaLink || ''}
                      onChange={e => updateBlock('tentang-gaul', { ...data, ctaLink: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                </div>
                <ImageUpload
                  value={data.image || ''}
                  onChange={url => updateBlock('tentang-gaul', { ...data, image: url })}
                  label="Gambar Tentang GAUL"
                />
              </div>
            )
          })()}
        </SectionCard>
      </div>
    </div>
  )
}

// Komponen reusable card section dengan tombol simpan
function SectionCard({ label, children, onSave }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-bg-section)] bg-gray-50/50 px-5 py-4">
        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{label}</h3>
        <button
          onClick={onSave}
          className="rounded-full bg-[var(--color-text-primary)] px-5 py-2 text-xs font-semibold text-white transition-all hover:brightness-125"
        >
          Simpan Perubahan
        </button>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}
