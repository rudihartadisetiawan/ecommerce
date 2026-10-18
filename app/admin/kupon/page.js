'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

const fmtRp = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

const inputCls = 'w-full rounded-xl border border-[#EEEBE4] bg-[#FAFAF9] px-3.5 py-2.5 text-sm text-[#1C1C1A] outline-none transition-colors focus:border-[#D4A373] focus:bg-white focus:ring-2 focus:ring-[#D4A373]/15'
const labelCls = 'mb-1.5 block text-xs font-semibold text-[#6B655A]'

function StatTile({ icon, label, value, accent }) {
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

// Ikon inline kecil
const Ico = {
  Ticket: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-4.125-1.688L11.25 21.75l-4.125-1.688L3 21.75V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  ),
  Active: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Uses: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
    </svg>
  ),
  Clock: () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Plus: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Close: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  ),
}

// Ticket kupon — satu kartu bergaya voucher
function CouponTicket({ c, onToggle, onDelete, index }) {
  const isPct = c.type === 'percentage'
  const big = isPct ? `${c.value}%` : fmtRp(c.value)
  const expired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false
  const usedPct = c.maxUses > 0 ? Math.min((c.usedCount / c.maxUses) * 100, 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', damping: 26, stiffness: 300 }}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${expired ? 'border-red-100' : 'border-[#EEEBE4]'}`}
    >
      <div className="flex">
        {/* Panel kiri — nilai diskon */}
        <div className="relative flex w-32 shrink-0 items-center justify-center bg-[#1C1C1A] px-3 py-6 sm:w-36">
          <div className="text-center">
            <p className={`font-[var(--font-display)] leading-none text-white ${isPct ? 'text-3xl' : 'text-xl'}`}>
              {big}
            </p>
            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
              {isPct ? 'Diskon' : 'Potongan'}
            </p>
          </div>
          {/* Takik perforasi */}
          <span className="absolute -right-2 top-4 h-4 w-4 rounded-full bg-[#F5F4F1]" />
          <span className="absolute -right-2 bottom-4 h-4 w-4 rounded-full bg-[#F5F4F1]" />
          <span className="absolute -right-px top-0 h-full w-px border-r border-dashed border-white/25" />
        </div>

        {/* Panel kanan — detail */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#F5F4F1] px-2 py-1 font-mono text-xs font-bold tracking-widest text-[#1C1C1A]">
                  {c.code}
                </span>
                {expired && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">Kedaluwarsa</span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-[#9C9589]">
                {c.minPurchase > 0 ? `Min. belanja ${fmtRp(c.minPurchase)}` : 'Tanpa minimum belanja'}
                {c.expiresAt && ` · berlaku s.d. ${new Date(c.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(c)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  c.isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    : 'border-[#EEEBE4] bg-[#F5F4F1] text-[#9C9589] hover:text-[#6B655A]'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                {c.isActive ? 'Aktif' : 'Nonaktif'}
              </button>
              <button
                onClick={() => onDelete(c.id)}
                className="rounded-full border border-red-100 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                Hapus
              </button>
            </div>
          </div>

          {/* Pemakaian */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-medium text-[#6B655A]">
                {c.maxUses > 0 ? `Terpakai ${c.usedCount}/${c.maxUses} kali` : `Terpakai ${c.usedCount} kali · tanpa batas`}
              </span>
              {c.maxUses > 0 && (
                <span className="font-bold text-[#1C1C1A]">{Math.round(usedPct)}%</span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#F5F4F1]">
              {c.maxUses > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usedPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${usedPct >= 100 ? 'bg-red-400' : usedPct >= 70 ? 'bg-[#B8874F]' : 'bg-[#D4A373]'}`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminCouponPage() {
  const addToast = useToast()
  const [coupons, setCoupons] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minPurchase: '', maxUses: '', expiresAt: '' })

  const load = () => fetch('/api/admin/coupons').then(r => r.json()).then(setCoupons).catch(() => {})
  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    const active = coupons.filter(c => c.isActive).length
    const used = coupons.reduce((s, c) => s + (c.usedCount || 0), 0)
    const in7d = new Date(Date.now() + 7 * 86400000)
    const expiringSoon = coupons.filter(c => c.isActive && c.expiresAt && new Date(c.expiresAt) <= in7d && new Date(c.expiresAt) >= new Date()).length
    return { total: coupons.length, active, used, expiringSoon }
  }, [coupons])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minPurchase: Number(form.minPurchase) || 0,
      maxUses: Number(form.maxUses) || 0,
      expiresAt: form.expiresAt || undefined,
    }
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      addToast(d.error || 'Gagal membuat kupon', 'error')
      return
    }
    setShowAdd(false)
    setForm({ code: '', type: 'percentage', value: '', minPurchase: '', maxUses: '', expiresAt: '' })
    addToast('Kupon berhasil dibuat.', 'success')
    load()
  }

  const handleToggle = async (c) => {
    await fetch('/api/admin/coupons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
    })
    load()
  }

  const handleDelete = async (id) => {
    await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    addToast('Kupon dihapus.', 'info')
    load()
  }

  const resetForm = () => setForm({ code: '', type: 'percentage', value: '', minPurchase: '', maxUses: '', expiresAt: '' })

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl text-[#1C1C1A] sm:text-4xl">Voucher Diskon</h1>
            <p className="mt-2 text-sm text-[#6B655A]">Buat dan kelola kupon promo untuk pelanggan</p>
          </div>
          <button
            onClick={() => { setShowAdd(true); resetForm() }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1C1C1A] px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#D4A373]"
          >
            <Ico.Plus />
            Buat Voucher
          </button>
        </div>
      </div>

      {/* ── Ringkasan ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<Ico.Ticket />} label="Total Voucher" value={stats.total} />
        <StatTile icon={<Ico.Active />} label="Sedang Aktif" value={stats.active} accent />
        <StatTile icon={<Ico.Uses />} label="Total Pemakaian" value={stats.used} />
        <StatTile icon={<Ico.Clock />} label="Segera Kedaluwarsa" value={stats.expiringSoon} />
      </div>

      {/* ── Form Tambah (popup) ── */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAdd(false)}
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              onSubmit={handleAdd}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#EEEBE4] bg-white shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between border-b border-[#EEEBE4] bg-[#FAFAF9] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1C1C1A] text-[#D4A373]">
                    <Ico.Ticket />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1C1C1A]">Voucher Baru</h2>
                    <p className="text-[11px] text-[#9C9589]">Kode otomatis disimpan dalam huruf kapital</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg p-1.5 text-[#9C9589] transition-colors hover:bg-[#F0EDE6] hover:text-[#1C1C1A]">
                  <Ico.Close />
                </button>
              </div>

              <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Kode Voucher</label>
                  <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required placeholder="HEBAT10" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tipe Diskon</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nilai {form.type === 'percentage' ? '(%)' : '(Rp)'}</label>
                  <input type="number" min="1" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} required placeholder={form.type === 'percentage' ? '10' : '25000'} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Min. Belanja (opsional)</label>
                  <input type="number" value={form.minPurchase} onChange={e => setForm(p => ({ ...p, minPurchase: e.target.value }))} placeholder="0 = tanpa minimum" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Maks Penggunaan (opsional)</label>
                  <input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="0 = unlimited" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Kedaluwarsa (opsional)</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#EEEBE4] bg-[#FAFAF9] px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-xl border border-[#EEEBE4] bg-white px-4 py-2 text-xs font-semibold text-[#6B655A] transition-colors hover:bg-[#F0EDE6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1C1C1A] px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#D4A373] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  Simpan Voucher
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ── Daftar Voucher ── */}
      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#EEEBE4] bg-white/60 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F4F1] text-[#9C9589]">
            <Ico.Ticket />
          </div>
          <p className="text-sm font-semibold text-[#1C1C1A]">Belum ada voucher</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-[#9C9589]">Buat voucher pertama untuk mendorong repeat purchase pelanggan.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {coupons.map((c, i) => (
            <CouponTicket key={c.id} c={c} index={i} onToggle={handleToggle} onDelete={setConfirmDelete} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Hapus voucher?"
        message="Voucher akan dihapus permanen. Kupon yang sudah dipakai pelanggan tidak bisa dipulihkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}