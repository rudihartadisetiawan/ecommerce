'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setForm({ name: session.user.name || '', email: session.user.email || '', phone: session.user.phone || '' })
    }
  }, [session])

  const initial = (session?.user?.name || 'U').charAt(0).toUpperCase()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-text-primary)] text-xl font-[var(--font-display)] text-white">{initial}</div>
          <div>
            <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">{session?.user?.name || 'Pengguna'}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-6 sm:p-8">
        <h2 className="mb-6 text-sm font-semibold text-[var(--color-text-primary)]">Informasi Akun</h2>
        <form onSubmit={handleSubmit} className="max-w-md space-y-5">
          {[
            { name: 'name', label: 'Nama Lengkap', type: 'text' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'phone', label: 'No. HP', type: 'tel' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
                className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]"
              />
            </div>
          ))}
          <button
            type="submit"
            className={`rounded-full px-6 py-3 text-sm font-medium text-white transition-all ${saved ? 'bg-green-500' : 'bg-[var(--color-text-primary)] hover:brightness-125'}`}
          >
            {saved ? 'Tersimpan!' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </>
  )
}
