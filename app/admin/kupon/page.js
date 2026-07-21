'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

export default function AdminCouponPage() {
  const addToast = useToast()
  const [coupons, setCoupons] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null) // id kupon yang akan dihapus
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minPurchase: '0', maxUses: '0', expiresAt: '' })
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/admin/coupons').then(r => r.json()).then(setCoupons).catch(() => {})

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setMsg('')
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
    if (!res.ok) { const d = await res.json(); addToast('❌ ' + (d.error || 'Gagal'), 'error'); return }
    setShowAdd(false)
    setForm({ code: '', type: 'percentage', value: '', minPurchase: '0', maxUses: '0', expiresAt: '' })
    addToast('✅ Kupon berhasil dibuat!', 'success')
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
    load()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Kembali ke CMS</Link>
          <h1 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Kupon Diskon</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-full bg-[var(--color-text-primary)] px-5 py-2.5 text-xs font-semibold text-white hover:brightness-125">
          + Kupon Baru
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Kupon Baru</h2>
          {msg && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{msg}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Kode Kupon</label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Tipe</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]">
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Nilai {form.type === 'percentage' ? '(%)' : '(Rp)'}</label>
              <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Min. Belanja (Rp)</label>
              <input type="number" value={form.minPurchase} onChange={e => setForm(p => ({ ...p, minPurchase: e.target.value }))} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Maks Penggunaan (0 = unlimited)</label>
              <input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Kedaluwarsa (opsional)</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-full bg-[var(--color-text-primary)] px-5 py-2 text-xs font-semibold text-white hover:brightness-125">Simpan</button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-full border border-[var(--color-text-secondary)]/20 px-5 py-2 text-xs font-medium text-[var(--color-text-secondary)]">Batal</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {coupons.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">Belum ada kupon.</p>
        ) : coupons.map(c => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => handleToggle(c)} className={`relative h-6 w-11 rounded-full transition-colors ${c.isActive ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${c.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <div>
                <span className="font-mono font-bold text-sm text-[var(--color-text-primary)]">{c.code}</span>
                <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
                  {c.type === 'percentage' ? `${c.value}%` : `Rp${c.value.toLocaleString('id-ID')}`}
                  {c.minPurchase > 0 && ` · min Rp${c.minPurchase.toLocaleString('id-ID')}`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-text-secondary)]">{c.usedCount}/{c.maxUses || '∞'}</span>
              {c.expiresAt && <span className="text-[10px] text-[var(--color-text-secondary)]">Exp: {new Date(c.expiresAt).toLocaleDateString('id-ID')}</span>}
              <button onClick={() => setConfirmDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        title="Hapus kupon?"
        message="Kupon akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
