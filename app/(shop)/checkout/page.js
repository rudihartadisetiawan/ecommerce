'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/cart-context'
import Navigation from '@/components/shop/Navigation'
import Container from '@/components/ui/Container'

const paymentMethods = [
  { id: 'Transfer BCA', label: 'Transfer BCA', iconUrl: '/payments/bca.svg' },
  { id: 'Transfer BNI', label: 'Transfer BNI', iconUrl: '/payments/bni.svg' },
  { id: 'Transfer Mandiri', label: 'Transfer Mandiri', iconUrl: '/payments/mandiri.svg' },
  { id: 'gopay', label: 'GoPay', iconUrl: '/payments/gopay.svg' },
  { id: 'ovo', label: 'OVO', iconUrl: '/payments/ovo.svg' },
  { id: 'dana', label: 'DANA', iconUrl: '/payments/dana.svg' },
  { id: 'qris', label: 'QRIS', iconUrl: '/payments/qris.svg' },
]

const SNAP_JS_URL = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'

// Weight per item (gram) — default 500g, upgrade ke field DB nanti
const WEIGHT_PER_ITEM = 500

function loadSnapScript() {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve()
    const existing = document.getElementById('midtrans-snap-script')
    if (existing) {
      existing.addEventListener('load', resolve)
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.id = 'midtrans-snap-script'
    script.src = SNAP_JS_URL
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY)
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { data: session, status } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({ name: '', phone: '', address: '', zip: '' })
  const [payment, setPayment] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // RajaOngkir state
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [shippingOptions, setShippingOptions] = useState([])
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCity, setSelectedCity] = useState(null) // { id, name }
  const [selectedShipping, setSelectedShipping] = useState(null) // { courier, service, cost, etd }
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [shippingError, setShippingError] = useState('')

  const shippingCost = selectedShipping?.cost ?? 0
  const total = subtotal + shippingCost

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // Load provinsi saat mount
  useEffect(() => {
    setLoadingProvinces(true)
    fetch('/api/rajaongkir/provinces')
      .then(r => r.json())
      .then(data => setProvinces(Array.isArray(data) ? data : []))
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false))
  }, [])

  // Load kota saat provinsi dipilih
  useEffect(() => {
    if (!selectedProvince) { setCities([]); setSelectedCity(null); setShippingOptions([]); setSelectedShipping(null); return }
    setLoadingCities(true)
    setCities([])
    setSelectedCity(null)
    setShippingOptions([])
    setSelectedShipping(null)
    fetch(`/api/rajaongkir/cities?province_id=${selectedProvince}`)
      .then(r => r.json())
      .then(data => setCities(Array.isArray(data) ? data : []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
  }, [selectedProvince])

  // Hitung ongkir saat kota dipilih
  const fetchShipping = useCallback(async (cityId) => {
    if (!cityId) return
    setLoadingShipping(true)
    setShippingError('')
    setShippingOptions([])
    setSelectedShipping(null)
    const totalWeight = items.reduce((sum, i) => sum + (i.qty * WEIGHT_PER_ITEM), 0) || WEIGHT_PER_ITEM
    try {
      const res = await fetch('/api/rajaongkir/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination_city_id: cityId, weight: totalWeight }),
      })
      const data = await res.json()
      if (!res.ok) { setShippingError(data.error || 'Gagal mengambil ongkir'); return }
      setShippingOptions(Array.isArray(data) ? data : [])
    } catch { setShippingError('Gagal mengambil ongkir. Coba lagi.') }
    finally { setLoadingShipping(false) }
  }, [items])

  useEffect(() => {
    if (selectedCity) fetchShipping(selectedCity.id)
  }, [selectedCity, fetchShipping])

  if (status === 'unauthenticated') {
    router.push('/account/login?callbackUrl=/checkout')
    return null
  }
  if (status !== 'authenticated') return null

  // ponytail: admin tidak punya akses ke checkout
  if (session?.user?.role === 'admin' || session?.user?.role === 'super_admin') {
    router.push('/admin')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!form.name) newErrors.name = 'Wajib diisi'
    if (!form.phone) newErrors.phone = 'Wajib diisi'
    if (!form.address) newErrors.address = 'Wajib diisi'
    if (!selectedProvince) newErrors.province = 'Pilih provinsi'
    if (!selectedCity) newErrors.city = 'Pilih kota'
    if (!selectedShipping) newErrors.shipping = 'Pilih metode pengiriman'
    if (!payment) newErrors.payment = 'Pilih metode pembayaran'
    setErrors(newErrors)
    if (Object.keys(newErrors).length) return

    setLoading(true)
    setErrorMsg('')

    try {
      const orderItems = items.map(i => ({
        productId: i.productId || i.product_id,
        variant: { size: i.size, color: i.colorName || i.color },
        qty: i.qty,
      }))

      const shippingLabel = `${selectedShipping.courier} ${selectedShipping.service} (${selectedShipping.etd} hari)`
      const provinceName = provinces.find(p => String(p.id) === String(selectedProvince))?.name ?? ''
      const fullAddress = `${form.name}, ${form.address}, ${selectedCity.name}, ${provinceName}, ${form.zip ? `Kode Pos: ${form.zip}, ` : ''}Telp: ${form.phone}`

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress: fullAddress,
          paymentMethod: payment,
          shippingCost: selectedShipping.cost,
          shippingCourier: shippingLabel,
        }),
      })

      const order = await res.json()
      if (!res.ok) { setErrorMsg(order.error || 'Gagal membuat pesanan'); setLoading(false); return }

      const midRes = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })

      const mid = await midRes.json()
      if (!midRes.ok || !mid.token) {
        setErrorMsg(mid.message || 'Gagal menghubungi Midtrans')
        setLoading(false)
        return
      }

      await loadSnapScript()
      setLoading(false)

      window.snap.pay(mid.token, {
        onSuccess: async () => {
          clearCart()
          // Sync status dari Midtrans sebelum redirect — penting di localhost karena webhook tidak bisa masuk
          try {
            await fetch('/api/midtrans/check-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id }),
            })
          } catch { /* tetap redirect meskipun gagal sync */ }
          router.push(`/account/orders/${order.id}?status=success`)
        },
        onPending: () => { clearCart(); router.push(`/account/orders/${order.id}?status=pending`) },
        onError:   () => { clearCart(); router.push(`/account/orders/${order.id}?status=error`) },
        onClose:   () => { clearCart(); router.push(`/account/orders/${order.id}`) },
      })
    } catch (err) {
      setErrorMsg('Terjadi kesalahan. Coba lagi.')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-20">
          <Container>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Keranjang masih kosong.</p>
              <Link href="/produk" className="mt-4 text-xs font-medium text-[var(--color-accent)] underline underline-offset-4">Mulai Belanja</Link>
            </div>
          </Container>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        <Container>
          <div className="mb-8">
            <p className="text-xs text-[var(--color-text-secondary)]">Beranda / Checkout</p>
            <h1 className="mt-2 font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Checkout</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="lg:flex lg:gap-10">
              <div className="flex-1 space-y-8">

                {/* Alamat Pengiriman */}
                <section>
                  <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Alamat Pengiriman</h2>
                  <div className="space-y-4">
                    {[
                      { name: 'name', label: 'Nama Lengkap', type: 'text' },
                      { name: 'phone', label: 'No. HP', type: 'tel' },
                      { name: 'address', label: 'Alamat Lengkap (Jalan, No, RT/RW)', type: 'text' },
                    ].map(field => (
                      <div key={field.name}>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">{field.label}</label>
                        <input
                          type={field.type}
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          className={`w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)]/50 ${errors[field.name] ? 'border-red-400' : 'border-[var(--color-text-secondary)]/20 focus:border-[var(--color-accent)]'}`}
                          placeholder={field.label}
                        />
                        {errors[field.name] && <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>}
                      </div>
                    ))}

                    {/* Dropdown Provinsi */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Provinsi</label>
                      <select
                        value={selectedProvince}
                        onChange={e => setSelectedProvince(e.target.value)}
                        disabled={loadingProvinces}
                        className={`w-full rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors ${errors.province ? 'border-red-400' : 'border-[var(--color-text-secondary)]/20 focus:border-[var(--color-accent)]'}`}
                      >
                        <option value="">{loadingProvinces ? 'Memuat provinsi...' : '— Pilih Provinsi —'}</option>
                        {provinces.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province}</p>}
                    </div>

                    {/* Dropdown Kota */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Kota / Kabupaten</label>
                      <select
                        value={selectedCity?.id ?? ''}
                        onChange={e => {
                          const city = cities.find(c => String(c.id) === e.target.value)
                          setSelectedCity(city ? { id: city.id, name: city.name } : null)
                        }}
                        disabled={!selectedProvince || loadingCities}
                        className={`w-full rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors ${errors.city ? 'border-red-400' : 'border-[var(--color-text-secondary)]/20 focus:border-[var(--color-accent)]'} disabled:opacity-50`}
                      >
                        <option value="">{loadingCities ? 'Memuat kota...' : !selectedProvince ? '— Pilih provinsi dulu —' : '— Pilih Kota —'}</option>
                        {cities.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                    </div>

                    {/* Kode Pos (opsional) */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Kode Pos <span className="text-[var(--color-text-secondary)]/50">(opsional)</span></label>
                      <input
                        type="text"
                        name="zip"
                        value={form.zip}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-secondary)]/50"
                        placeholder="Contoh: 50123"
                      />
                    </div>
                  </div>
                </section>

                {/* Pilihan Pengiriman — dari RajaOngkir */}
                <section>
                  <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Pilihan Pengiriman</h2>

                  {!selectedCity && (
                    <p className="text-sm text-[var(--color-text-secondary)]">Pilih kota tujuan untuk melihat opsi pengiriman.</p>
                  )}

                  {loadingShipping && (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                      Menghitung ongkos kirim...
                    </div>
                  )}

                  {shippingError && (
                    <p className="text-sm text-red-500">{shippingError} <button type="button" onClick={() => selectedCity && fetchShipping(selectedCity.id)} className="underline">Coba lagi</button></p>
                  )}

                  {shippingOptions.length > 0 && (
                    <div className="space-y-2.5">
                      {shippingOptions.map((opt, i) => {
                        const key = `${opt.courier}-${opt.service}`
                        const isSelected = selectedShipping && `${selectedShipping.courier}-${selectedShipping.service}` === key
                        return (
                          <label
                            key={i}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors ${isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-text-secondary)]/20 hover:border-[var(--color-text-secondary)]/40'}`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="shipping"
                                checked={!!isSelected}
                                onChange={() => setSelectedShipping(opt)}
                                className="accent-[var(--color-accent)]"
                              />
                              <div>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{opt.courier} {opt.service}</p>
                                <p className="text-xs text-[var(--color-text-secondary)]">{opt.description} · Est. {opt.etd || '-'} hari</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">
                              {opt.cost === 0 ? 'Gratis' : `Rp${opt.cost.toLocaleString('id-ID')}`}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {errors.shipping && <p className="mt-2 text-xs text-red-500">{errors.shipping}</p>}
                </section>

                {/* Metode Pembayaran */}
                <section>
                  <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Metode Pembayaran</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {paymentMethods.map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPayment(pm.id)}
                        className={`group flex flex-col items-center justify-center rounded-xl border p-3 transition-all gap-2 ${
                          payment === pm.id
                            ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 shadow-sm'
                            : 'border-[var(--color-text-secondary)]/20 hover:border-[var(--color-accent)]/40 hover:shadow-sm bg-[var(--color-surface)]'
                        }`}
                      >
                        <div className="w-full h-10 flex items-center justify-center rounded-lg bg-white overflow-hidden px-2 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pm.iconUrl}
                            alt={pm.label}
                            className="h-8 w-auto max-w-full object-contain"
                          />
                        </div>
                        <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] leading-tight text-center truncate w-full">{pm.label}</p>
                      </button>
                    ))}
                  </div>
                  {errors.payment && <p className="mt-2 text-xs text-red-500">{errors.payment}</p>}
                </section>
              </div>

              {/* Ringkasan Pesanan */}
              <div className="mt-8 lg:mt-0 lg:w-80 lg:shrink-0">
                <div className="sticky top-28 rounded-2xl bg-[var(--color-bg-section)] p-6">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Ringkasan Pesanan</h3>
                  <div className="mt-4 space-y-3">
                    {items.slice(0, 3).map(item => (
                      <div key={item.id} className="flex gap-3">
                        <div className="h-12 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-text-secondary)]/10">
                          <Image src={item.image} alt={item.name} width={100} height={120} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-medium text-[var(--color-text-primary)]">{item.name} × {item.qty}</p>
                          <p className="text-[var(--color-text-secondary)]">{item.size} {item.colorName ? `· ${item.colorName}` : ''}</p>
                        </div>
                        <p className="text-xs font-medium text-[var(--color-text-primary)]">Rp{(item.price * item.qty).toLocaleString('id-ID')}</p>
                      </div>
                    ))}
                    {items.length > 3 && <p className="text-xs text-[var(--color-text-secondary)]">+{items.length - 3} item lainnya</p>}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-[var(--color-text-secondary)]/20 pt-4 text-sm">
                    <div className="flex justify-between text-[var(--color-text-secondary)]">
                      <span>Subtotal</span>
                      <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-text-secondary)]">
                      <span>Ongkir {selectedShipping ? `(${selectedShipping.courier} ${selectedShipping.service})` : ''}</span>
                      <span>
                        {selectedShipping
                          ? shippingCost === 0 ? 'Gratis' : `Rp${shippingCost.toLocaleString('id-ID')}`
                          : <span className="italic text-[var(--color-text-secondary)]/60">belum dipilih</span>
                        }
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-[var(--color-text-primary)] border-t border-[var(--color-text-secondary)]/20 pt-2">
                      <span>Total</span>
                      <span>Rp{total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {errorMsg && <p className="mt-3 text-xs text-red-500">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={loading || !selectedShipping}
                    className="mt-6 flex w-full items-center justify-center rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-125 disabled:opacity-50"
                  >
                    {loading ? 'Memproses...' : !selectedShipping ? 'Pilih pengiriman dulu' : 'Bayar'}
                  </button>
                  <p className="mt-3 text-center text-xs text-[var(--color-text-secondary)]">Pembayaran aman via Midtrans</p>
                </div>
              </div>
            </div>
          </form>

          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-[var(--color-bg-warm)] p-8 text-center shadow-xl">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                  <p className="text-sm text-[var(--color-text-secondary)]">Menyiapkan pembayaran...</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </main>
    </>
  )
}