'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', price: '', category: 'Atasan', stock: '', description: '' })
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('#CCCCCC')
  const [images, setImages] = useState('')
  const [error, setError] = useState('')

  const toggleSize = (s) => setSizes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const addColor = () => {
    const name = colorName.trim()
    if (!name) return
    if (colors.some(c => c.name.toLowerCase() === name.toLowerCase())) return
    setColors(p => [...p, { name, hex: colorHex }])
    setColorName('')
    setColorHex('#CCCCCC')
  }

  const removeColor = (name) => setColors(p => p.filter(c => c.name !== name))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
        price: Number(form.price),
        category: form.category,
        sizes,
        colors: colors.length ? colors : [{ name: 'Default', hex: '#CCCCCC' }],
        images: images ? images.split(',').map(s => s.trim()) : [`https://picsum.photos/seed/${form.name.toLowerCase().replace(/\s+/g, '-')}/800/1000`],
        stock: Number(form.stock),
      }),
    })
    if (!res.ok) { setError('Gagal menambah produk'); return }
    router.push('/admin')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Kembali</Link>
        <h1 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Tambah Produk</h1>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Nama Produk</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Harga</label>
            <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Kategori</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]">
              {['Atasan', 'Bawahan', 'Outerwear', 'Aksesoris'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Stok</label>
            <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Ukuran</label>
          <div className="flex gap-2">
            {['S', 'M', 'L', 'XL'].map(s => (
              <button key={s} type="button" onClick={() => toggleSize(s)} className={`h-9 w-9 rounded-full text-xs font-medium transition-colors ${sizes.includes(s) ? 'bg-[var(--color-text-primary)] text-white' : 'bg-[var(--color-bg-section)] text-[var(--color-text-secondary)]'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Warna</label>
          <div className="flex gap-2 mb-2">
            <input value={colorName} onChange={e => setColorName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor())} placeholder="Nama warna" className="flex-1 rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
            <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-[var(--color-text-secondary)]/20 bg-transparent p-0.5" />
            <button type="button" onClick={addColor} className="rounded-xl bg-[var(--color-text-primary)] px-3 text-xs font-medium text-white">Tambah</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map(c => (
              <span key={c.name} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-primary)]">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.hex }} />
                {c.name}
                <button type="button" onClick={() => removeColor(c.name)} className="ml-0.5 text-[var(--color-text-secondary)] hover:text-red-400">&times;</button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Image URLs (koma untuk multiple)</label>
          <input value={images} onChange={e => setImages(e.target.value)} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Deskripsi</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
        </div>
        <button type="submit" className="rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-125">Simpan</button>
      </form>
    </div>
  )
}