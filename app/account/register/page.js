'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { signIn, getSession } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error === 'EMAIL_TAKEN' ? 'Email sudah terdaftar' : 'Pendaftaran gagal')
      return
    }
    await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    const session = await getSession()
    if (session?.user?.role === 'admin' || session?.user?.role === 'super_admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
    router.refresh()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">GAUL</Link>
        <h1 className="text-center font-[var(--font-display)] text-3xl text-[var(--color-text-primary)]">Daftar</h1>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">Sudah punya akun? <Link href="/account/login" className="font-medium text-[var(--color-accent)] underline underline-offset-4">Masuk</Link></p>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {['name', 'email', 'password', 'phone'].map(field => (
            <div key={field}>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1 capitalize">{field === 'phone' ? 'No. HP' : field}</label>
              <input type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} name={field} value={form[field]} onChange={handleChange} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-accent)]" placeholder={field === 'phone' ? '08xxxxxxxxxx' : field} />
            </div>
          ))}
          <button type="submit" className="w-full rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-125">Daftar</button>
        </form>
      </div>
    </motion.div>
  )
}
