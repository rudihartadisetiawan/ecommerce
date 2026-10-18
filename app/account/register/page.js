'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { signIn, getSession } from 'next-auth/react'
import AuthShell from '@/components/ui/AuthShell'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error === 'EMAIL_TAKEN' ? 'Email sudah terdaftar' : 'Pendaftaran gagal')
      setLoading(false)
      return
    }
    await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    const session = await getSession()
    const targetUrl = (session?.user?.role === 'admin' || session?.user?.role === 'super_admin')
      ? '/admin'
      : '/'
    window.location.href = targetUrl
  }

  const fieldMeta = {
    name: { label: 'Nama Lengkap', placeholder: 'Nama kamu', type: 'text' },
    email: { label: 'Email', placeholder: 'nama@email.com', type: 'email' },
    password: { label: 'Password', placeholder: 'Minimal 6 karakter', type: 'password' },
    phone: { label: 'No. HP', placeholder: '08xxxxxxxxxx', type: 'tel' },
  }

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">Akun Baru</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)]">Daftar</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Sudah punya akun? <Link href="/account/login" className="font-medium text-[var(--color-accent)] underline underline-offset-4">Masuk</Link></p>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {['name', 'email', 'password', 'phone'].map(field => (
            <div key={field}>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">{fieldMeta[field].label}</label>
              <input type={fieldMeta[field].type} name={field} value={form[field]} onChange={handleChange} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)]/40 focus:border-[var(--color-accent)]" placeholder={fieldMeta[field].placeholder} />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-125 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </form>
      </motion.div>
    </AuthShell>
  )
}
