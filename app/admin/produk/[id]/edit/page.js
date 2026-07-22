'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ui/ImageUpload'

export default function EditProductPage() {
  const { id } = useParams()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', price: '', costPrice: '', category: 'Atasan', stock: '', description: '', isActive: true })
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('#CCCCCC')
  const [images, setImages] = useState([])
  const [variantStock, setVariantStock] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(p => {
      if (p?.id) {
        setForm({ name: p.name, price: String(p.price), costPrice: String(p.costPrice || ''), category: p.category, stock: String(p.stock), description: p.description, isActive: p.isActive })
        setSizes(p.sizes || [])
        setColors(p.colors && p.colors.length ? p.colors : [])
        setImages(p.images || [])
        setVariantStock(p.stockPerVariant || {})
        if (p.isFeatured !== undefined) setForm(f => ({ ...f, isFeatured: p.isFeatured }))
      }
      setLoaded(true)
    })
  }, [id])

  if (!loaded) return null
  if (!form.name) {
    return <div className="p-8 text-sm text-[var(--color-text-secondary)]">Produk tidak ditemukan. <Link href="/admin" className="text-[var(--color-accent)] underline">Kembali</Link></div>
  }

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

  const updateVariantStock = (size, colorName, val) => {
    const key = `${size}-${colorName}`
    setVariantStock(p => ({ ...p, [key]: Math.max(0, Number(val) || 0) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const hasVariants = sizes.length > 0 && colors.length > 0
    let stockPerVariant = null
    let totalStock = Number(form.stock) || 0
    if (hasVariants) {
      stockPerVariant = {}
      for (const s of sizes) {
        for (const c of colors) {
          const key = `${s}-${c.name}`
          stockPerVariant[key] = Number(variantStock[key]) || 0
        }
      }
      const hasVariantValues = Object.values(stockPerVariant).some(v => v > 0)
      if (hasVariantValues) {
        totalStock = Object.values(stockPerVariant).reduce((a, b) => a + b, 0)
      }
    }

    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        price: Number(form.price),
        costPrice: Number(form.costPrice) || 0,
        category: form.category,
        sizes,
        colors,
        stock: totalStock,
        stockPerVariant,
        description: form.description,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images: images.length ? images : undefined,
      }),
    })
    if (!res.ok) { setError('Gagal menyimpan'); return }
    router.push('/admin')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Kembali</Link>
        <h1 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Edit Produk</h1>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Nama Produk</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Harga Jual</label>
            <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Harga Modal</label>
            <input type="number" value={form.costPrice} onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Kategori</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]">
              {['Atasan', 'Bawahan', 'Outerwear', 'Aksesoris'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Stok Total</label>
            <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" placeholder="Otomatis dari varian jika dikosongkan" />
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
        {sizes.length > 0 && colors.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Stok per Varian</label>
            <div className="overflow-x-auto rounded-xl border border-[var(--color-bg-section)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--color-bg-section)]/50">
                    <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Size \ Warna</th>
                    {colors.map(c => (
                      <th key={c.name} className="px-3 py-2 text-center font-medium text-[var(--color-text-secondary)]">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.hex }} /> {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizes.map(s => (
                    <tr key={s} className="border-t border-[var(--color-bg-section)]">
                      <td className="px-3 py-2 font-semibold text-[var(--color-text-primary)]">{s}</td>
                      {colors.map(c => {
                        const key = `${s}-${c.name}`
                        return (
                          <td key={c.name} className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={variantStock[key] ?? ''}
                              onChange={e => updateVariantStock(s, c.name, e.target.value)}
                              className="w-full rounded-lg border border-[var(--color-text-secondary)]/20 bg-transparent px-2 py-1.5 text-center text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                              placeholder="0"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
              Total stok varian: {Object.values(variantStock).reduce((a, b) => a + (Number(b) || 0), 0)}
            </p>
          </div>
        )}
        <ImageUpload multiple value={images} onChange={setImages} label="Gambar Produk" />
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Deskripsi</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Produk Aktif</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Nonaktifkan untuk menyembunyikan dari katalog</p>
          </div>
          <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-[var(--color-text-secondary)]/30'}`}>
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Featured di Homepage</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Tampilkan di Koleksi Terbaru</p>
          </div>
          <button type="button" onClick={() => setForm(p => ({ ...p, isFeatured: !p.isFeatured }))} className={`relative h-6 w-11 rounded-full transition-colors ${form.isFeatured ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-text-secondary)]/30'}`}>
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <button type="submit" className="rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-125">Simpan</button>
      </form>
    </div>
  )
}