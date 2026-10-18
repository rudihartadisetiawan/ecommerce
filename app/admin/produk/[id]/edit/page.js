'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ui/ImageUpload'

const inputCls =
  'w-full rounded-xl border border-[#EEEBE4] bg-white px-4 py-2.5 text-sm text-[#1C1C1A] outline-none transition-colors focus:border-[#D4A373]'
const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#9C9589]'

// ─── Section icons ─────────────────────────────────────────────────
const IcoInfo = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
)
const IcoVariants = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42Z" />
  </svg>
)
const IcoImage = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
)
const IcoText = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
)
const IcoPublish = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
  </svg>
)

function SectionCard({ icon, title, sub, children }) {
  return (
    <section className="rounded-2xl border border-[#EEEBE4] bg-white p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F4F1] text-[#6B655A]">{icon}</div>
        <div>
          <h2 className="font-[var(--font-display)] text-base font-medium text-[#1C1C1A]">{title}</h2>
          {sub && <p className="text-[11px] text-[#9C9589]">{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Toggle({ checked, onChange, onColor = 'bg-[#D4A373]', offColor = 'bg-[#9C9589]/40' }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? onColor : offColor}`}
      aria-pressed={checked}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

// Tiap size punya daftar warnanya sendiri + stok masing-masing.
function SizeVariantEditor({ size, colors, onChange }) {
  const [name, setName] = useState('')
  const [hex, setHex] = useState('#CCCCCC')
  const [stock, setStock] = useState('')

  const add = () => {
    const n = name.trim()
    if (!n) return
    if (colors.some(c => c.name.toLowerCase() === n.toLowerCase())) return
    onChange([...colors, { name: n, hex, stock: Math.max(0, Number(stock) || 0) }])
    setName('')
    setHex('#CCCCCC')
    setStock('')
  }

  const updateStock = (target, val) =>
    onChange(colors.map(c => (c.name === target ? { ...c, stock: Math.max(0, Number(val) || 0) } : c)))

  const remove = (target) => onChange(colors.filter(c => c.name !== target))

  const total = colors.reduce((a, c) => a + (Number(c.stock) || 0), 0)

  return (
    <div className="rounded-xl border border-[#EEEBE4] bg-[#FAFAF9] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#1C1C1A]">Ukuran {size}</p>
        {colors.length > 0 && (
          <span className="rounded-full border border-[#EEEBE4] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#6B655A]">
            {total} pcs
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Nama warna, cth: Sand Beige"
          className={inputCls}
        />
        <div className="flex shrink-0 gap-2">
          <input
            type="color"
            value={hex}
            onChange={e => setHex(e.target.value)}
            className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border border-[#EEEBE4] bg-white p-1"
            title="Pilih warna"
          />
          <input
            type="number"
            min="0"
            value={stock}
            onChange={e => setStock(e.target.value)}
            placeholder="Stok"
            className="w-full rounded-xl border border-[#EEEBE4] bg-white px-3 py-2 text-sm text-[#1C1C1A] outline-none focus:border-[#D4A373] sm:w-20"
          />
        </div>
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-xl bg-[#1C1C1A] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#D4A373]"
        >
          Tambah
        </button>
      </div>

      {colors.length > 0 && (
        <div className="mt-3 space-y-2">
          {colors.map(c => (
            <div key={c.name} className="flex items-center gap-3 rounded-lg border border-[#EEEBE4] bg-white px-3 py-2">
              <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#1C1C1A]">{c.name}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9C9589]">Stok</span>
                <input
                  type="number"
                  min="0"
                  value={c.stock === 0 ? '' : c.stock}
                  onChange={e => updateStock(c.name, e.target.value)}
                  className="w-16 rounded-lg border border-[#EEEBE4] px-2 py-1 text-center text-xs text-[#1C1C1A] outline-none focus:border-[#D4A373]"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => remove(c.name)}
                  className="text-[#9C9589] transition-colors hover:text-red-500"
                  title="Hapus warna"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EditProductPage() {
  const { id } = useParams()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', price: '', category: 'Atasan', stock: '', description: '', isActive: true, isFeatured: false })
  const [variants, setVariants] = useState({})
  const [images, setImages] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(p => {
      if (p?.id) {
        setForm({
          name: p.name,
          price: String(p.price),
          category: p.category,
          stock: String(p.stock),
          description: p.description,
          isActive: p.isActive,
          isFeatured: !!p.isFeatured,
        })
        setImages(p.images || [])

        const sizes = p.sizes || []
        const colors = p.colors && p.colors.length ? p.colors : []

        // Konversi data existing → per-size variant editor:
        // pakai stockPerVariant; kalau belum ada, distribusi stok total merata ke semua kombinasi.
        let stockMap = p.stockPerVariant || {}
        if ((!stockMap || Object.keys(stockMap).length === 0) && p.stock > 0 && sizes.length && colors.length) {
          stockMap = {}
          const combos = sizes.length * colors.length
          const base = Math.floor(p.stock / combos)
          let remainder = p.stock - base * combos
          for (const s of sizes) {
            for (const c of colors) {
              const key = `${s}-${c.name || c}`
              stockMap[key] = base + (remainder > 0 ? 1 : 0)
              if (remainder > 0) remainder--
            }
          }
        }

        const parsed = {}
        for (const s of sizes) {
          parsed[s] = colors.map(c => ({
            name: c.name,
            hex: c.hex,
            stock: Number(stockMap[`${s}-${c.name}`] ?? stockMap[`${s}-${c.hex}`] ?? 0),
          }))
        }
        setVariants(parsed)
      }
      setLoaded(true)
    })
  }, [id])

  if (!loaded) return null
  if (!form.name) {
    return <div className="p-8 text-sm text-[#9C9589]">Produk tidak ditemukan. <Link href="/admin/produk" className="text-[#D4A373] underline">Kembali</Link></div>
  }

  const toggleSize = (s) => setVariants(p => {
    if (p[s]) { const n = { ...p }; delete n[s]; return n }
    return { ...p, [s]: [] }
  })

  const setSizeVariant = (size, list) => setVariants(p => ({ ...p, [size]: list }))

  const sizeList = Object.keys(variants)
  const variantColors = sizeList.flatMap(s => variants[s] || [])
  const hasVariants = sizeList.length > 0 && variantColors.length > 0
  const totalVariantStock = variantColors.reduce((a, c) => a + (Number(c.stock) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    let stockPerVariant = null
    let totalStock = Number(form.stock) || 0
    if (hasVariants) {
      stockPerVariant = {}
      for (const s of sizeList) {
        for (const c of variants[s]) stockPerVariant[`${s}-${c.name}`] = Number(c.stock) || 0
      }
      totalStock = totalVariantStock
    }

    const unionColors = []
    for (const c of variantColors) {
      if (!unionColors.some(u => u.name.toLowerCase() === c.name.toLowerCase())) unionColors.push({ name: c.name, hex: c.hex })
    }

    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        price: Number(form.price),
        category: form.category,
        sizes: sizeList,
        colors: unionColors.length ? unionColors : [{ name: 'Default', hex: '#CCCCCC' }],
        stock: totalStock,
        stockPerVariant,
        description: form.description,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images: images.length ? images : undefined,
      }),
    })
    if (!res.ok) { setError('Gagal menyimpan'); return }
    router.push('/admin/produk')
  }

  return (
    <>
      {/* ── Page Header ── */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9C9589]">Katalog</p>
          <h1 className="mt-1.5 font-[var(--font-display)] text-2xl font-medium text-[#1C1C1A]">Edit Produk</h1>
          <p className="mt-1.5 text-sm text-[#9C9589]">Perbarui detail produk — {form.name}</p>
        </div>
        <Link
          href="/admin/produk"
          className="flex items-center gap-2 rounded-xl border border-[#EEEBE4] bg-white px-4 py-2 text-xs font-semibold text-[#6B655A] transition-colors hover:bg-[#F5F4F1] hover:text-[#1C1C1A]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Produk
        </Link>
      </div>

      {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-5 lg:col-span-2">
          {/* Informasi Dasar */}
          <SectionCard icon={<IcoInfo />} title="Informasi Dasar" sub="Nama, harga, dan kategori produk">
            <div>
              <label className={labelCls}>Nama Produk</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={inputCls} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Harga Jual</label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kategori</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                  {['Atasan', 'Bawahan', 'Outerwear', 'Aksesoris'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Varian */}
          <SectionCard
            icon={<IcoVariants />}
            title="Varian"
            sub="Pilih ukuran, lalu isi warna & stok untuk tiap ukuran"
          >
            <div>
              <label className={labelCls}>Ukuran</label>
              <div className="flex flex-wrap gap-2">
                {['S', 'M', 'L', 'XL'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`h-10 min-w-10 rounded-full px-2 text-xs font-bold transition-colors ${
                      variants[s] !== undefined ? 'bg-[#1C1C1A] text-white' : 'border border-[#EEEBE4] bg-[#FAFAF9] text-[#6B655A] hover:border-[#D4A373]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {sizeList.length > 0 ? (
              <div className="mt-5 space-y-3">
                {sizeList.map(s => (
                  <SizeVariantEditor key={s} size={s} colors={variants[s] || []} onChange={list => setSizeVariant(s, list)} />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-[#EEEBE4] bg-[#FAFAF9] px-4 py-3 text-[11px] text-[#9C9589]">
                Produk tanpa varian — stok diisi di form stok total. Pilih ukuran untuk mengatur warna & stok per ukuran.
              </p>
            )}
          </SectionCard>

          {/* Gambar */}
          <SectionCard icon={<IcoImage />} title="Gambar Produk" sub="Upload foto — gambar pertama menjadi thumbnail">
            <ImageUpload multiple value={images} onChange={setImages} label="Gambar Produk" />
          </SectionCard>

          {/* Deskripsi */}
          <SectionCard icon={<IcoText />} title="Deskripsi" sub="Cerita singkat tentang produk untuk halaman detail">
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </SectionCard>
        </div>

        {/* ── Side column ── */}
        <div className="space-y-5 lg:sticky lg:top-6">
          {/* Publikasi */}
          <SectionCard icon={<IcoPublish />} title="Publikasi" sub="Pengaturan tampilan di toko">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EEEBE4] bg-[#FAFAF9] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#1C1C1A]">Produk Aktif</p>
                  <p className="text-[11px] text-[#9C9589]">Nonaktifkan untuk menyembunyikan dari katalog</p>
                </div>
                <Toggle checked={form.isActive} onChange={() => setForm(p => ({ ...p, isActive: !p.isActive }))} onColor="bg-emerald-500" />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EEEBE4] bg-[#FAFAF9] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#1C1C1A]">Featured di Homepage</p>
                  <p className="text-[11px] text-[#9C9589]">Tampilkan di Koleksi Terbaru</p>
                </div>
                <Toggle checked={form.isFeatured} onChange={() => setForm(p => ({ ...p, isFeatured: !p.isFeatured }))} />
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-[#6B655A]">
              <div className="flex items-center justify-between">
                <span className="text-[#9C9589]">Varian aktif</span>
                <span className="font-semibold text-[#1C1C1A]">
                  {hasVariants
                    ? `${sizeList.length} ukuran · ${variantColors.length} warna`
                    : sizeList.length > 0 ? 'Ukuran dipilih, belum ada warna' : 'Tidak ada'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9C9589]">Total stok</span>
                <span className={`font-semibold ${hasVariants ? 'text-[#1C1C1A]' : 'text-[#9C9589]'}`}>
                  {hasVariants ? `${totalVariantStock} pcs` : form.stock ? `${form.stock} pcs` : '—'}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Actions */}
          <div className="rounded-2xl border border-[#EEEBE4] bg-white p-5">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1C1C1A] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#D4A373]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Simpan Perubahan
            </button>
            <Link
              href="/admin/produk"
              className="mt-2.5 flex w-full items-center justify-center rounded-xl border border-[#EEEBE4] px-4 py-2.5 text-xs font-semibold text-[#6B655A] transition-colors hover:bg-[#F5F4F1] hover:text-[#1C1C1A]"
            >
              Batal
            </Link>
            <p className="mt-3 text-center text-[10px] text-[#9C9589]">
              Perubahan langsung tampil di katalog setelah disimpan.
            </p>
          </div>
        </div>
      </form>
    </>
  )
}