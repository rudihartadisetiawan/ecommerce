'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password minimal 6 karakter'); return }
    if (password !== confirm) { setError('Password tidak cocok'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal'); setLoading(false); return }
      setDone(true)
      setLoading(false)
    } catch {
      setError('Terjadi kesalahan'); setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-warm)] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">Password Diubah!</h1>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Sekarang kamu bisa login dengan password baru.</p>
          <Link href="/account/login" className="mt-4 inline-block rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white">
            Login Sekarang
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-warm)] px-4">
      <Link href="/" className="mb-8 font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">GAUL</Link>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-8 shadow-sm">
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">Buat Password Baru</h1>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Minimal 6 karakter.</p>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password baru" required minLength={6}
            className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Konfirmasi password" required minLength={6}
            className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" />
          <button type="submit" disabled={loading}
            className="w-full rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-125 disabled:opacity-50">
            {loading ? 'Menyimpan…' : 'Ubah Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
