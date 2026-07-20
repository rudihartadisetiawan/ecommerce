'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { signIn, getSession } from 'next-auth/react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    if (res?.error) {
      setError('Email atau password salah')
    } else {
      const session = await getSession()
      if (session?.user?.role === 'admin' || session?.user?.role === 'super_admin') {
        router.push('/admin')
      } else {
        router.push(callbackUrl === '/account/profile' ? '/' : callbackUrl)
      }
      router.refresh()
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">GAUL</Link>
        <h1 className="text-center font-[var(--font-display)] text-3xl text-[var(--color-text-primary)]">Masuk</h1>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">Belum punya akun? <Link href="/account/register" className="font-medium text-[var(--color-accent)] underline underline-offset-4">Daftar</Link></p>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-accent)]" placeholder="nama@email.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-accent)]" placeholder="••••••••" />
          </div>
          <div className="flex justify-end">
            <Link href="/account/forgot-password" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] underline underline-offset-2">Lupa Password?</Link>
          </div>
          <button type="submit" className="w-full rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-125">Masuk</button>
        </form>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  )
}
