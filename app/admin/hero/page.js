'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ImageUpload from '@/components/ui/ImageUpload'

export default function AdminHeroPage() {
  const [heroItems, setHeroItems] = useState([])

  const load = () => fetch('/api/hero?all=true').then(r => r.json()).then(setHeroItems).catch(() => {})

  useEffect(() => { load() }, [])

  const toggleActive = async (id, isActive) => {
    await fetch(`/api/hero/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    load()
  }

  const updateItem = async (id, field, value) => {
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
      alert('Perubahan berhasil disimpan!')
    } else {
      alert('Gagal menyimpan perubahan.')
    }
    load()
  }

  const addItem = async () => {
    await fetch('/api/hero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Banner', imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop', subtitle: '', ctaText: '', ctaLink: '/produk' }),
    })
    load()
  }

  const remove = async (id) => {
    if (!confirm('Hapus banner ini?')) return
    await fetch(`/api/hero/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Kembali ke CMS</Link>
          <h1 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text-primary)] sm:text-3xl">Hero Section</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Kelola dan aktifkan banner promosi di homepage</p>
        </div>
        <button onClick={addItem} className="rounded-full bg-[var(--color-text-primary)] px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-125">
          + Tambah Banner
        </button>
      </div>

      <div className="space-y-6">
        {heroItems.map(item => (
          <div key={item.id} className="overflow-hidden rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-sm transition-shadow hover:shadow-md">
            {/* Header section */}
            <div className="border-b border-[var(--color-bg-section)] bg-gray-50/50 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{item.title || 'Judul Banner Kosong'}</h3>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Switch Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleActive(item.id, item.isActive)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      item.isActive ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        item.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                
                <button 
                  onClick={() => remove(item.id)} 
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  Hapus
                </button>
              </div>
            </div>

            {/* Inputs grid */}
            <div className="p-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Judul Banner</label>
                <input value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Sub-judul</label>
                <input value={item.subtitle} onChange={e => updateItem(item.id, 'subtitle', e.target.value)} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Teks Tombol CTA</label>
                <input value={item.ctaText} onChange={e => updateItem(item.id, 'ctaText', e.target.value)} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" placeholder="Lihat Koleksi" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Link Tombol CTA</label>
                <input value={item.ctaLink} onChange={e => updateItem(item.id, 'ctaLink', e.target.value)} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" placeholder="/produk" />
              </div>

              <div className="sm:col-span-2">
                <ImageUpload value={item.imageUrl} onChange={(url) => updateItem(item.id, 'imageUrl', url)} label="Gambar Banner" />
              </div>

              <div className="sm:col-span-2 mt-2 flex justify-end">
                <button 
                  onClick={() => saveItem(item.id)} 
                  className="rounded-full bg-[var(--color-text-primary)] px-6 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-125"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}