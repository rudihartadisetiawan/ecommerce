'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

const statusColors = {
  pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  paid: 'text-blue-600 bg-blue-50 border-blue-200',
  processing: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  shipped: 'text-purple-600 bg-purple-50 border-purple-200',
  completed: 'text-green-600 bg-green-50 border-green-200',
  cancelled: 'text-red-600 bg-red-50 border-red-200',
}

const statusLabels = {
  pending: 'Menunggu Bayar',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

// Varian warna selalu tampil sebagai NAMA warna, bukan kode hex
const variantColorName = (item) => {
  const v = item.variant?.colorName || item.variant?.color || ''
  if (!v) return ''
  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
    const m = (item.colors || []).find(c => String(c.hex || '').toLowerCase() === v.toLowerCase())
    return m?.name || ''
  }
  return v
}

// Toast — pakai notifikasi bersama (components/ui/Toast.js)

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [printOrders, setPrintOrders] = useState([])
  const [filterTab, setFilterTab] = useState('pending')
  const [exporting, setExporting] = useState(false)
  const addToast = useToast()

  // Modal Resi State
  const [shipModalOrder, setShipModalOrder] = useState(null)
  const [inputResi, setInputResi] = useState('')
  const [autoPrintLabel, setAutoPrintLabel] = useState(false)
  const [isSubmittingResi, setIsSubmittingResi] = useState(false)

  // Modal Cancel State
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)

  const [syncingId, setSyncingId] = useState(null)
  const [showProcessAll, setShowProcessAll] = useState(false)
  const [processingAll, setProcessingAll] = useState(false)
  const [archiveQuery, setArchiveQuery] = useState('')
  const [archiveStatus, setArchiveStatus] = useState('all')

  const load = () => fetch('/api/orders?all=true').then(r => r.json()).then(setOrders).catch(() => {})

  useEffect(() => { load() }, [])

  const handleUpdateStatus = async (id, newStatus, extraData = {}) => {
    const ERR_MSG = {
      UNAUTHORIZED: 'Sesi Anda berakhir. Silakan login ulang.',
      FORBIDDEN: 'Anda tidak punya akses untuk melakukan ini.',
      NOT_FOUND: 'Pesanan tidak ditemukan.',
      INVALID_STATUS: 'Status pesanan tidak valid.',
      NO_DATA_TO_UPDATE: 'Tidak ada data yang bisa diperbarui.',
    }
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extraData }),
      })
      if (res.ok) {
        load()
        addToast('Status pesanan berhasil diperbarui', 'success')
        return true
      } else {
        const err = await res.json()
        addToast(err.message || ERR_MSG[err.error] || err.error || 'Gagal mengubah status', 'error')
        return false
      }
    } catch {
      addToast('Gagal terhubung ke server', 'error')
      return false
    }
  }

  const handleSyncMidtrans = async (orderId) => {
    setSyncingId(orderId)
    try {
      const res = await fetch('/api/midtrans/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        addToast(data.message || 'Gagal mengecek status ke Midtrans. Coba lagi.', 'error')
      } else if (data.updated) {
        load()
        addToast(`Status pembayaran disinkronisasi → ${statusLabels[data.status] || data.status}`, 'success')
      } else {
        addToast(`Status Midtrans masih "${statusLabels[data.status] || data.status || 'pending'}" — belum ada perubahan.`, 'info')
      }
    } catch {
      addToast('Gagal menghubungi Midtrans. Coba lagi.', 'error')
    }
    setSyncingId(null)
  }

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return
    setIsSubmittingCancel(true)
    await handleUpdateStatus(cancelModalOrder.id, 'cancelled')
    setIsSubmittingCancel(false)
    setCancelModalOrder(null)
  }

  const handleOpenShipModal = (or) => {
    setShipModalOrder(or)
    setInputResi(or.trackingNumber || '')
    setAutoPrintLabel(false)
  }

  const handleConfirmShip = async () => {
    if (!inputResi.trim()) {
      addToast('Nomor Resi (AWB) wajib diisi!', 'warning')
      return
    }
    setIsSubmittingResi(true)
    const trackingNumber = inputResi.trim()
    const updated = await handleUpdateStatus(shipModalOrder.id, 'shipped', { trackingNumber })
    setIsSubmittingResi(false)
    setShipModalOrder(null)
    setInputResi('')
    if (updated && autoPrintLabel) {
      setAutoPrintLabel(false)
      printLabels([{ ...shipModalOrder, status: 'shipped', trackingNumber }])
    }
  }

  const printLabels = (list) => {
    if (!list.length) return
    setPrintOrders(list)
    setTimeout(() => window.print(), 400)
  }

  const handlePrintLabel = (order) => printLabels([order])

  // Proses / Kemas → status processing, langsung auto cetak label (tanpa resi)
  const handleProcessAndPrint = async (or) => {
    const ok = await handleUpdateStatus(or.id, 'processing')
    if (ok) printLabels([{ ...or, status: 'processing' }])
  }

  // Proses Semua — ubah semua pesanan paid → processing, lalu cetak label semua berurutan
  const handleProcessAll = async () => {
    const paidOrders = orders.filter(o => o.status === 'paid')
    if (paidOrders.length === 0) return
    setProcessingAll(true)
    const results = await Promise.allSettled(
      paidOrders.map(o =>
        fetch(`/api/orders/${o.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'processing' }),
        }).then(r => r.ok)
      )
    )
    const successOrders = paidOrders.filter((_, i) => results[i].status === 'fulfilled' && results[i].value)
    setProcessingAll(false)
    setShowProcessAll(false)
    load()
    printLabels(successOrders.map(o => ({ ...o, status: 'processing' })))
    if (successOrders.length === paidOrders.length) {
      addToast(`${successOrders.length} pesanan diproses — ${successOrders.length} label dicetak berurutan`, 'success')
    } else {
      addToast(`${successOrders.length}/${paidOrders.length} pesanan diproses`, 'warning')
    }
  }

  // Tombol aksi per status — Cetak Label hanya di processing & shipped
  const renderActions = (or) => (
    <>
      {or.status === 'pending' && (
        <button
          onClick={() => handleSyncMidtrans(or.id)}
          disabled={syncingId === or.id}
          title="Cek & sinkronisasi status pembayaran dari Midtrans"
          className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
        >
          <svg className={`h-3.5 w-3.5 ${syncingId === or.id ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          {syncingId === or.id ? 'Sync...' : 'Cek Bayar'}
        </button>
      )}

      {or.status === 'paid' && (
        <button
          onClick={() => handleProcessAndPrint(or)}
          title="Proses pesanan & langsung cetak label packing (tanpa resi)"
          className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
          Proses / Kemas
        </button>
      )}

      {or.status === 'processing' && (
        <button
          onClick={() => handlePrintLabel(or)}
          className="rounded-lg border border-[var(--color-text-secondary)]/20 px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-section)] transition-colors inline-flex items-center gap-1"
          title="Cetak Label Pengiriman (tanpa resi)"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M3 9.456V15.75c0 1.08.768 2.015 1.837 2.175a48.055 48.055 0 0 1 1.913.247M3 9.456c0-1.081.768-2.015 1.837-2.175a48.055 48.055 0 0 1 1.913-.247m0 0a48.1 48.1 0 0 1 10.56 0m-10.56 0V3.375c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v3.656" /></svg>
          Cetak Label
        </button>
      )}

      {or.status === 'processing' && (
        <button
          onClick={() => handleOpenShipModal(or)}
          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-1"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V14.25m0 0h3.375" /></svg>
          Input Resi & Kirim
        </button>
      )}

      {or.status === 'shipped' && (
        <button
          onClick={() => handlePrintLabel(or)}
          className="rounded-lg border border-[var(--color-text-secondary)]/20 px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-section)] transition-colors inline-flex items-center gap-1"
          title="Cetak ulang label (dengan no. resi)"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          Reprint
        </button>
      )}

      {or.status === 'shipped' && (
        <button
          onClick={() => handleUpdateStatus(or.id, 'completed')}
          className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors inline-flex items-center gap-1"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
          Tandai Selesai
        </button>
      )}

      {(or.status === 'pending' || or.status === 'paid') && (
        <button
          onClick={() => setCancelModalOrder(or)}
          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors inline-flex items-center gap-1"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          Batalkan
        </button>
      )}
    </>
  )

  return (
    <>
      {/* Printable Area - hanya terlihat saat window.print() */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label, #printable-label * {
            visibility: visible;
          }
          #printable-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-label {
            break-after: page;
          }
          .print-label:last-child {
            break-after: auto;
          }
        }
      `}</style>

      {printOrders.length > 0 && (
        <div id="printable-label" className="hidden print:block bg-white text-black font-sans">
          {printOrders.map(p => (
          <div key={p.id} className="print-label p-6">
          <div className="border-2 border-black p-4 rounded-lg max-w-md mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-3">
              <div>
                <h1 className="font-bold text-2xl tracking-wider">GAUL STORE</h1>
                <p className="text-xs">Outfit Casual Daily</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-sm">{p.id}</p>
                <p className="text-xs">{new Date(p.createdAt).toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            {/* Courier Info */}
            <div className="bg-gray-100 p-2.5 rounded border border-black mb-3">
              <p className="text-xs font-bold uppercase text-gray-700">Ekspedisi & Kurir:</p>
              <p className="text-base font-bold">{p.paymentMethod?.split('|')?.[1]?.replace('Kurir:', '')?.trim() || 'JNE / J&T / SiCepat'}</p>
              {p.trackingNumber && (
                <p className="text-xs font-mono font-bold mt-1">No. Resi: {p.trackingNumber}</p>
              )}
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4 border-b pb-3 border-gray-300">
              <div>
                <p className="font-bold text-gray-500 uppercase">Pengirim (PENGIRIM):</p>
                <p className="font-bold text-sm mt-0.5">GAUL STORE</p>
                <p>Kab. Demak, Jawa Tengah</p>
                <p>Telp: 0812-3456-7890</p>
              </div>
              <div>
                <p className="font-bold text-gray-500 uppercase">Penerima (PENERIMA):</p>
                <p className="font-bold text-sm mt-0.5">{p.shippingAddress?.split(',')?.[0] || 'Pembeli'}</p>
                <p className="leading-tight mt-0.5">{p.shippingAddress}</p>
              </div>
            </div>

            {/* Packing List */}
            <div>
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Daftar Isi Paket (Packing Check List):</p>
              <table className="w-full text-xs text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="p-1 border-r border-gray-300">Item</th>
                    <th className="p-1 border-r border-gray-300">Varian</th>
                    <th className="p-1 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(p.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="p-1 border-r border-gray-300 font-medium">{item.name || `Produk #${item.productId}`}</td>
                      <td className="p-1 border-r border-gray-300">{item.variant?.size} {variantColorName(item) ? `(${variantColorName(item)})` : ''}</td>
                      <td className="p-1 text-center font-bold">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Note */}
            <div className="mt-4 text-center border-t border-dashed border-gray-400 pt-2 text-[10px] text-gray-500">
              Terima kasih telah berbelanja di GAUL Store! — Harap rekam video unboxing saat membuka paket.
            </div>
          </div>
          </div>
          ))}
        </div>
      )}

      {/* Main Admin UI */}
      {(() => {
        const counts = {
          pending: orders.filter(o => o.status === 'pending').length,
          processing: orders.filter(o => o.status === 'paid').length,
          packing: orders.filter(o => o.status === 'processing').length,
          shipped: orders.filter(o => o.status === 'shipped').length,
          archive: orders.filter(o => ['completed', 'cancelled'].includes(o.status)).length,
          all: orders.length,
        }

        const filteredOrders = orders.filter(o => {
          if (filterTab === 'pending') return o.status === 'pending'
          if (filterTab === 'processing') return o.status === 'paid'
          if (filterTab === 'packing') return o.status === 'processing'
          if (filterTab === 'shipped') return o.status === 'shipped'
          if (filterTab === 'archive') {
            if (!['completed', 'cancelled'].includes(o.status)) return false
            if (archiveStatus !== 'all' && o.status !== archiveStatus) return false
            const q = archiveQuery.trim().toLowerCase()
            if (q) {
              const haystack = `${o.id} ${o.userName || ''} ${o.shippingAddress || ''} ${o.trackingNumber || ''}`.toLowerCase()
              if (!haystack.includes(q)) return false
            }
            return true
          }
          return true // 'all'
        })

        return (
          <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8 lg:px-12">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Kelola Pesanan</h1>
                <p className="text-sm text-[var(--color-text-secondary)]">Kelola & pantau status transaksi toko</p>
              </div>

              {/* Tab Navigation Filter */}
              <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-[var(--color-bg-section)] p-1.5 text-xs font-medium">
                {[
                  {
                    id: 'pending',
                    label: 'Menunggu',
                    count: counts.pending,
                    icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                  },
                  {
                    id: 'processing',
                    label: 'Diproses',
                    count: counts.processing,
                    icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
                  },
                  {
                    id: 'packing',
                    label: 'Antrian Packing',
                    count: counts.packing,
                    icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  },
                  {
                    id: 'shipped',
                    label: 'Dikirim',
                    count: counts.shipped,
                    icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V14.25m0 0h3.375" /></svg>
                  },
                  {
                    id: 'archive',
                    label: 'Arsip',
                    count: counts.archive,
                    icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  },
                  {
                    id: 'all',
                    label: 'Semua',
                    count: counts.all,
                    icon: null
                  },
                ].map(tab => {
                  const isActive = filterTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setFilterTab(tab.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${
                        isActive
                          ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        isActive ? 'bg-[var(--color-text-primary)] text-white' : 'bg-[var(--color-text-secondary)]/15 text-[var(--color-text-secondary)]'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Toolbar per-tab — Proses Semua di dalam konten Diproses; Export + pencarian di Arsip */}
            {(filterTab === 'processing' || filterTab === 'archive') && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                {filterTab === 'processing' && counts.processing > 0 && (
                  <button
                    onClick={() => setShowProcessAll(true)}
                    disabled={processingAll}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                    {processingAll ? 'Memproses…' : `Proses Semua (${counts.processing} pesanan)`}
                  </button>
                )}

                {filterTab === 'archive' && (
                  <>
                    <div className="relative flex-1 min-w-[220px] max-w-md">
                      <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      <input
                        type="text"
                        value={archiveQuery}
                        onChange={e => setArchiveQuery(e.target.value)}
                        placeholder="Lacak pesanan: ID, nama, alamat, atau no. resi…"
                        className="w-full rounded-full border border-[var(--color-text-secondary)]/20 bg-[var(--color-surface)] py-2.5 pl-9 pr-4 text-xs text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]"
                      />
                    </div>

                    <div className="flex items-center gap-1 rounded-2xl bg-[var(--color-bg-section)] p-1 text-xs font-medium">
                      {[['all', 'Semua'], ['completed', 'Selesai'], ['cancelled', 'Dibatalkan']].map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setArchiveStatus(val)}
                          className={`rounded-xl px-3 py-2 transition-all ${
                            archiveStatus === val
                              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm font-semibold'
                              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => { setExporting(true); window.open('/api/orders/export', '_blank'); setTimeout(() => setExporting(false), 2000) }}
                      disabled={exporting}
                      className="flex items-center gap-2 rounded-full border border-[var(--color-text-secondary)]/20 bg-white px-4 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      {exporting ? 'Mengunduh…' : 'Export CSV'}
                    </button>
                  </>
                )}
              </div>
            )}

            {filterTab === 'packing' ? (
              /* Card grid — memudahkan tim packing scan visual */
              filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] py-12 text-center text-sm text-[var(--color-text-secondary)] shadow-sm">
                  Tidak ada pesanan dalam antrian packing.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredOrders.map(or => (
                    <div key={or.id} className="flex flex-col rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-4 shadow-sm transition-shadow hover:shadow-md">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">{or.id}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {new Date(or.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${statusColors[or.status] || 'text-gray-600 bg-gray-50'}`}>
                          {statusLabels[or.status] || or.status}
                        </span>
                      </div>

                      <div className="mb-3 space-y-1.5 rounded-xl bg-[var(--color-bg-warm)] p-3">
                        {(or.items || []).map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-medium text-[var(--color-text-primary)]">
                              {item.name || `Produk #${item.productId}`}
                            </span>
                            <span className="shrink-0 text-[var(--color-text-secondary)]">
                              {item.variant?.size || ''} {variantColorName(item)} × {item.qty}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="mb-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{or.shippingAddress}</p>
                      <p className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
                        {or.total == null ? <span className="text-xs italic font-normal">Nominal — Super Admin</span> : `Rp${or.total.toLocaleString('id-ID')}`}
                      </p>

                      <div className="mt-auto flex flex-wrap gap-2">
                        {renderActions(or)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-bg-section)] text-xs font-medium uppercase text-[var(--color-text-secondary)]">
                    <th className="px-4 py-3">ID & Tanggal</th>
                    <th className="px-4 py-3">Item Pesanan</th>
                    <th className="px-4 py-3">Alamat Penerima</th>
                    <th className="px-4 py-3">Total & Pembayaran</th>
                    <th className="px-4 py-3">No. Resi (AWB)</th>
                    <th className="px-4 py-3">Status Saat Ini</th>
                    <th className="px-4 py-3 text-right">Aksi Selanjutnya</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
                        Tidak ada pesanan di kategori ini.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(or => {
                      const date = new Date(or.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      return (
                        <tr key={or.id} className="border-b border-[var(--color-bg-section)]/50 last:border-0 hover:bg-[var(--color-bg-warm)]/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-mono font-semibold text-[var(--color-text-primary)]">{or.id}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">{date}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {(or.items || []).map((item, i) => (
                                <div key={i} className="text-xs">
                                  <span className="font-medium text-[var(--color-text-primary)]">{item.name || `Produk #${item.productId}`}</span>
                                  <span className="text-[var(--color-text-secondary)]"> ({item.variant?.size || ''} {variantColorName(item)}) × {item.qty}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs text-xs text-[var(--color-text-secondary)]">
                            <p className="line-clamp-2">{or.shippingAddress}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {or.total == null ? (
                              <p className="text-xs italic text-[var(--color-text-secondary)]/60">Nominal — Super Admin</p>
                            ) : (
                              <p className="font-semibold text-[var(--color-text-primary)]">Rp{or.total.toLocaleString('id-ID')}</p>
                            )}
                            <p className="text-xs text-[var(--color-text-secondary)]">{or.paymentMethod}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {or.trackingNumber ? (
                              <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-section)] px-2.5 py-1 rounded-md border border-[var(--color-text-secondary)]/20">
                                {or.trackingNumber}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--color-text-secondary)] italic opacity-60">Belum dikirim</span>
                            )}
                            {or.receivedProofImage && (
                              <div className="mt-1">
                                <a
                                  href={or.receivedProofImage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-medium text-green-600 underline hover:text-green-700 flex items-center gap-1"
                                >
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" /></svg>
                                  Bukti Penerimaan
                                </a>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${statusColors[or.status] || 'text-gray-600 bg-gray-50'}`}>
                              {statusLabels[or.status] || or.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                            {renderActions(or)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
          </table>
        </div>
            )
          }
      </div>
    )
  })()}

      {/* Modal Input Nomor Resi Pengiriman */}
      <AnimatePresence>
        {shipModalOrder && (
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
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V14.25m0 0h3.375" /></svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Input Nomor Resi (AWB)</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">Pesanan ID: <span className="font-mono font-medium text-[var(--color-text-primary)]">{shipModalOrder.id}</span></p>
                </div>
              </div>

              <div className="mb-4 rounded-xl bg-[var(--color-bg-warm)] p-3 text-xs text-[var(--color-text-secondary)] border border-[var(--color-bg-section)]">
                <p><strong className="text-[var(--color-text-primary)]">Kurir / Ekspedisi Pilihan:</strong></p>
                <p className="mt-0.5 font-semibold text-[var(--color-accent)]">{shipModalOrder.paymentMethod?.split('|')?.[1]?.replace('Kurir:', '')?.trim() || 'Reguler Ekspedisi'}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-primary)]">Nomor Resi Pengiriman:</label>
                <input
                  type="text"
                  value={inputResi}
                  onChange={(e) => setInputResi(e.target.value)}
                  placeholder="Contoh: JP0987654321"
                  autoFocus
                  className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm font-mono text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]"
                />
                <p className="text-[10px] text-[var(--color-text-secondary)]">Pastikan nomor resi dari kurir sudah benar sebelum disimpan.</p>
              </div>

              <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--color-bg-section)] bg-[var(--color-bg-warm)] p-3 transition-colors hover:border-[var(--color-accent)]">
                <input
                  type="checkbox"
                  checked={autoPrintLabel}
                  onChange={(e) => setAutoPrintLabel(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                <span className="text-xs text-[var(--color-text-primary)]">
                  Langsung cetak label setelah simpan
                  <span className="block text-[10px] text-[var(--color-text-secondary)]">Label tercetak beserta nomor resi (reprint).</span>
                </span>
              </label>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShipModalOrder(null)}
                  className="flex-1 rounded-full border border-[var(--color-text-secondary)]/20 py-2.5 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-section)]"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmShip}
                  disabled={isSubmittingResi || !inputResi.trim()}
                  className="flex-1 rounded-full bg-indigo-600 py-2.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 shadow-sm inline-flex items-center justify-center gap-1.5"
                >
                  {isSubmittingResi ? 'Menyimpan...' : 'Konfirmasi & Kirim'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Pembatalan Pesanan */}
      <AnimatePresence>
        {cancelModalOrder && (
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
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Batalkan Pesanan Ini?</h3>
              <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
                Pesanan <span className="font-mono font-bold text-[var(--color-text-primary)]">{cancelModalOrder.id}</span> akan dibatalkan. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 rounded-full border border-[var(--color-text-secondary)]/20 py-2 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-section)]"
                >
                  Kembali
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isSubmittingCancel}
                  className="flex-1 rounded-full bg-red-500 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  {isSubmittingCancel ? 'Membatalkan...' : 'Ya, Batalkan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Proses Semua */}
      <ConfirmModal
        open={showProcessAll}
        title="Proses Semua Pesanan?"
        message={`Semua pesanan berstatus "Dibayar" (${orders.filter(o => o.status === 'paid').length}) akan dipindah ke Antrian Packing. Lanjutkan?`}
        confirmLabel={processingAll ? 'Memproses...' : 'Ya, Proses Semua'}
        cancelLabel="Kembali"
        onConfirm={handleProcessAll}
        onCancel={() => setShowProcessAll(false)}
      />
    </>
  )
}