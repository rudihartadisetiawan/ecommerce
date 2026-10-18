'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

const statusFlow = [
  { key: 'pending', label: 'Menunggu Pembayaran' },
  { key: 'paid', label: 'Pembayaran Dikonfirmasi' },
  { key: 'processing', label: 'Pesanan Diproses' },
  { key: 'shipped', label: 'Pesanan Dikirim' },
  { key: 'completed', label: 'Pesanan Selesai' },
]

const statusConfig = {
  pending: { label: 'Menunggu Pembayaran', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  paid: { label: 'Dibayar', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  processing: { label: 'Diproses', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  shipped: { label: 'Dikirim', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  completed: { label: 'Selesai', color: 'text-green-600 bg-green-50 border-green-200' },
  cancelled: { label: 'Dibatalkan', color: 'text-red-600 bg-red-50 border-red-200' },
}

// Varian warna selalu tampil sebagai NAMA warna, bukan kode hex
function variantColorName(item) {
  const v = item?.variant?.colorName || item?.variant?.color || ''
  if (!v) return ''
  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
    const m = (item.colors || []).find(c => String(c.hex || '').toLowerCase() === v.toLowerCase())
    return m?.name || ''
  }
  return v
}

const SNAP_JS_URL = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'

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

export default function OrderDetailPage() {
  const { id } = useParams()
  const addToast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [proofImage, setProofImage] = useState('')
  const [completing, setCompleting] = useState(false)

  // Review Modal State
  const [reviewItem, setReviewItem] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewedProductIds, setReviewedProductIds] = useState([])

  const handleSubmitReview = async () => {
    if (!reviewItem) return
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: reviewItem.productId,
          orderId: id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setReviewedProductIds(prev => [...prev, reviewItem.productId])
        setReviewItem(null)
        setReviewComment('')
        addToast('Terima kasih! Ulasan kamu telah berhasil dikirim.', 'success')
      } else {
        addToast(data.error || 'Gagal mengirim ulasan.', 'error')
      }
    } catch {
      addToast('Terjadi kesalahan. Coba lagi.', 'error')
    }
    setSubmittingReview(false)
  }

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Cek status ke Midtrans
  const checkPayment = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/midtrans/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id }),
      })
      const data = await res.json()
      if (!res.ok) {
        addToast(data.message || 'Gagal mengecek status ke Midtrans. Coba lagi.', 'error')
      } else {
        if (data.status) setOrder(o => ({ ...o, status: data.status }))
        if (data.updated) {
          addToast('Pembayaran terkonfirmasi! Status pesanan diperbarui.', 'success')
        } else if (data.alreadyUpdated) {
          addToast('Status pesanan sudah terbaru.', 'info')
        } else {
          addToast('Status masih pending — belum ada pembayaran masuk.', 'info')
        }
      }
    } catch {
      addToast('Gagal mengecek status. Coba lagi.', 'error')
    }
    setChecking(false)
  }

  // Buka ulang Snap popup untuk bayar
  const handlePay = async () => {
    setPaying(true)
    try {
      const midRes = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id }),
      })
      const mid = await midRes.json()
      if (!midRes.ok || !mid.token) {
        addToast(mid.message || 'Gagal memuat halaman pembayaran.', 'error')
        setPaying(false)
        return
      }
      await loadSnapScript()
      setPaying(false)
      window.snap.pay(mid.token, {
        onSuccess: async () => {
          // Sync status ke DB — force=paid hanya dihormati server saat sandbox + ALLOW_TEST_PAYMENT
          try {
            const res = await fetch('/api/midtrans/check-status?force=paid', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: id }),
            })
            const data = await res.json()
            if (res.ok && data.status) setOrder(o => ({ ...o, status: data.status }))
          } catch { /* biarkan pending — user bisa klik "Cek Status" */ }
        },
        onPending: () => addToast('Menunggu pembayaran — selesaikan transfer kamu.', 'warning'),
        onError:   () => addToast('Pembayaran gagal. Coba lagi.', 'error'),
        onClose:   () => addToast('Pembayaran ditutup. Klik "Bayar Sekarang" jika ingin melanjutkan.', 'info'),
      })
    } catch {
      addToast('Terjadi kesalahan. Coba lagi.', 'error')
      setPaying(false)
    }
  }

  // Batalkan pesanan
  const handleCancel = async () => {
    setCancelling(true)
    setShowCancelConfirm(false)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (res.ok) {
        setOrder(o => ({ ...o, status: 'cancelled' }))
        addToast('Pesanan berhasil dibatalkan.', 'success')
      } else {
        const data = await res.json()
        addToast(data.error || 'Gagal membatalkan pesanan.', 'error')
      }
    } catch {
      addToast('Terjadi kesalahan. Coba lagi.', 'error')
    }
    setCancelling(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-text-secondary)]/20 py-20 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">Pesanan tidak ditemukan.</p>
        <Link href="/account/orders" className="mt-4 text-xs font-medium text-[var(--color-accent)] hover:underline">Kembali</Link>
      </div>
    )
  }

  const cfg = statusConfig[order.status] || { label: order.status, color: 'text-gray-600 bg-gray-50' }
  const date = new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const statusIdx = statusFlow.findIndex(s => s.key === order.status)
  const isCancelled = order.status === 'cancelled'
  const isPending = order.status === 'pending'

  // Konfirmasi pesanan diterima + simpan foto bukti
  const handleConfirmReceived = async () => {
    setCompleting(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          receivedProofImage: proofImage || 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=500&fit=crop', // default sample proof jika kosong
        }),
      })
      if (res.ok) {
        setOrder(o => ({
          ...o,
          status: 'completed',
          receivedProofImage: proofImage || 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=500&fit=crop',
        }))
        setShowReceiveModal(false)
        addToast('Pesanan diselesaikan! Terima kasih telah berbelanja di GAUL.', 'success')
      } else {
        const err = await res.json()
        addToast(err.error || 'Gagal mengonfirmasi pesanan.', 'error')
      }
    } catch {
      addToast('Terjadi kesalahan. Coba lagi.', 'error')
    }
    setCompleting(false)
  }

  return (
    <>
      {/* Breadcrumb + Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <Link href="/account/orders" className="hover:text-[var(--color-text-primary)]">Pesanan</Link>
          <span>/</span>
          <span className="text-[var(--color-text-primary)]">{order.id}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">Detail Pesanan</p>
            <h1 className="mt-1.5 font-mono text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">{order.id}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{date}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-4 py-1.5 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            {isPending && (
              <>
                {/* Bayar Sekarang */}
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="rounded-full bg-[var(--color-text-primary)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-125 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5z" /></svg>
                  {paying ? 'Memuat...' : 'Bayar Sekarang'}
                </button>

                {/* Cek Status */}
                <button
                  onClick={checkPayment}
                  disabled={checking}
                  className="rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                  {checking ? 'Mengecek...' : 'Cek Status'}
                </button>

                {/* Batalkan */}
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling}
                  className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  {cancelling ? 'Membatalkan...' : 'Batalkan'}
                </button>
              </>
            )}

            {order.status === 'shipped' && (
              <button
                onClick={() => setShowReceiveModal(true)}
                className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 shadow-sm inline-flex items-center gap-1.5"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                Pesanan Diterima
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Modal Upload Bukti Diterima */}
      <AnimatePresence>
        {showReceiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] p-6 shadow-xl border border-[var(--color-bg-section)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Konfirmasi Pesanan Diterima</h3>
              <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
                Apakah kamu telah menerima paket pesanan <span className="font-mono font-medium text-[var(--color-text-primary)]">{order.id}</span> dalam kondisi baik?
              </p>

              <div className="mt-4 space-y-2">
                <label className="block text-xs font-medium text-[var(--color-text-primary)]">Foto Bukti Paket (URL Foto):</label>
                <input
                  type="text"
                  value={proofImage}
                  onChange={(e) => setProofImage(e.target.value)}
                  placeholder="https://... (URL foto paket yang diterima)"
                  className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-3 py-2 text-xs outline-none focus:border-[var(--color-accent)] font-mono"
                />
                <p className="text-[10px] text-[var(--color-text-secondary)]">*Jika dikosongkan, akan menggunakan foto konfirmasi standar.</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1 rounded-full border border-[var(--color-text-secondary)]/20 py-2 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-section)]"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmReceived}
                  disabled={completing}
                  className="flex-1 rounded-full bg-green-600 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {completing ? 'Menyimpan...' : 'Selesaikan Pesanan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Beri Ulasan */}
      <AnimatePresence>
        {reviewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] p-6 shadow-xl border border-[var(--color-bg-section)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500 font-bold text-lg">
                ★
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Beri Ulasan Produk</h3>
              <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">{reviewItem.name}</p>

              {/* Rating Bintang */}
              <div className="mt-4 flex flex-col items-center justify-center gap-1 rounded-xl bg-[var(--color-bg-section)]/50 p-4">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">Pilih Rating:</span>
                <div className="flex gap-1.5 text-2xl cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`transition-transform hover:scale-125 ${star <= reviewRating ? 'text-amber-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Komentar */}
              <div className="mt-4 space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-primary)]">Ulasan / Komentar kamu:</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ceritakan pengalaman kamu memakai produk ini..."
                  className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent p-3 text-xs outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setReviewItem(null)}
                  className="flex-1 rounded-full border border-[var(--color-text-secondary)]/20 py-2 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-section)]"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex-1 rounded-full bg-amber-500 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50 font-medium"
                >
                  {submittingReview ? 'Kirim...' : 'Kirim Ulasan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Cancel Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-6 shadow-xl border border-[var(--color-bg-section)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Batalkan Pesanan?</h3>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                Pesanan <span className="font-mono font-medium text-[var(--color-text-primary)]">{order.id}</span> akan dibatalkan dan tidak bisa dipulihkan.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 rounded-full border border-[var(--color-text-secondary)]/20 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-section)]"
                >
                  Kembali
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-full bg-red-500 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  Ya, Batalkan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Timeline */}
      <div className="mb-8 rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-6">
        {isCancelled ? (
          <div className="flex items-center gap-3 text-red-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-sm">✕</span>
            <span className="text-sm font-medium">Pesanan dibatalkan</span>
          </div>
        ) : (
          <div className="flex items-center gap-0">
            {statusFlow.map((s, i) => {
              const done = i <= statusIdx
              const isLast = i === statusFlow.length - 1
              return (
                <div key={s.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ${
                      done ? 'bg-[var(--color-text-primary)] text-white' : 'bg-[var(--color-bg-section)] text-[var(--color-text-secondary)]'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`mt-1.5 whitespace-nowrap text-[10px] font-medium ${
                      done ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                    }`}>{s.label}</span>
                  </div>
                  {!isLast && (
                    <div className={`mx-2 mt-[-1.5rem] h-px flex-1 ${i < statusIdx ? 'bg-[var(--color-text-primary)]' : 'bg-[var(--color-bg-section)]'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="lg:flex lg:gap-8">
        {/* Items */}
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-6">
            <h2 className="mb-5 text-sm font-semibold text-[var(--color-text-primary)]">Item Pesanan</h2>
            <div className="space-y-4">
              {(order.items || []).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4 border-b border-[var(--color-bg-section)] pb-4 last:border-0 last:pb-0"
                >
                  <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-section)]">
                    {item.image && <img src={item.image} alt={item.name || ''} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    {item.slug ? (
                      <Link href={`/produk/${item.slug}`} className="text-sm font-medium text-[var(--color-text-primary)] hover:underline">{item.name}</Link>
                    ) : (
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.name}</p>
                    )}
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                      {item.variant?.size && <span>{item.variant.size}</span>}
                      {variantColorName(item) && <span> · {variantColorName(item)}</span>}
                      <span> × {item.qty}</span>
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Rp{item.priceAtPurchase.toLocaleString('id-ID')}</p>
                      {order.status === 'completed' && (
                        reviewedProductIds.includes(item.productId) ? (
                          <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                            ✓ Ulasan Dikirim
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setReviewItem(item)
                              setReviewRating(5)
                              setReviewComment('')
                            }}
                            className="rounded-full bg-amber-500/10 border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-500 hover:text-white transition-colors"
                          >
                            ★ Beri Ulasan
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details Sidebar */}
        {(() => {
          const itemsSubtotal = (order.items || []).reduce((sum, item) => sum + (item.priceAtPurchase * item.qty), 0)
          const shippingFee = Math.max(0, order.total - itemsSubtotal)

          return (
            <aside className="mt-8 lg:mt-0 lg:w-72 lg:shrink-0">
              <div className="rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Ringkasan</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Subtotal Produk</span>
                    <span className="font-medium text-[var(--color-text-primary)]">Rp{itemsSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Ongkos Kirim</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {shippingFee === 0 ? 'Gratis' : `Rp${shippingFee.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--color-bg-section)] pt-3 text-sm font-semibold text-[var(--color-text-primary)]">
                    <span>Total</span>
                    <span>Rp{order.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="mt-5 space-y-2.5 text-xs text-[var(--color-text-secondary)]">
                  <div className="flex justify-between">
                    <span className="font-medium text-[var(--color-text-primary)]">Pembayaran</span>
                    <span className="text-right max-w-[150px] truncate">{order.paymentMethod}</span>
                  </div>
                  {order.paymentRef && (
                    <div className="flex justify-between">
                      <span className="font-medium text-[var(--color-text-primary)]">Ref.</span>
                      <span className="font-mono">{order.paymentRef}</span>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="flex justify-between rounded-lg bg-[var(--color-accent)]/10 p-2 text-[var(--color-text-primary)]">
                      <span className="font-semibold">No. Resi</span>
                      <span className="font-mono font-bold text-[var(--color-accent)]">{order.trackingNumber}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <p className="font-medium text-[var(--color-text-primary)]">Alamat Pengiriman</p>
                    <p className="mt-1 leading-relaxed">{order.shippingAddress}</p>
                  </div>
                </div>
              </div>
            </aside>
          )
        })()}
      </div>
    </>
  )
}