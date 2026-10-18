'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthShell from '@/components/ui/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal'); setLoading(false); return }
      setSent(true)
      setLoading(false)
    } catch {
      setError('Terjadi kesalahan'); setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-8 shadow-sm">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="font-[var(--font-display)] text-xl text-[var(--color-text-primary)]">Cek Email Kamu</h1>
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              Kalau email {email} terdaftar, kami sudah kirim link reset password.
            </p>
            <Link href="/account/login" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] underline underline-offset-4">
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">Akun</p>
            <h1 className="mt-1.5 font-[var(--font-display)] text-xl text-[var(--color-text-primary)]">Lupa Password</h1>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Masukkan email untuk menerima link reset.</p>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email kamu"
                required
                className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-125 disabled:opacity-50"
              >
                {loading ? 'Mengirim…' : 'Kirim Link Reset'}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
              <Link href="/account/login" className="text-[var(--color-accent)] underline underline-offset-4">Kembali ke Login</Link>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  )
}
