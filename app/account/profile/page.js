'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/Skeleton'
import PageHeader from '@/components/ui/PageHeader'

const inputCls =
    'w-full rounded-lg border px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-all placeholder:text-[var(--color-text-secondary)]/60 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/20'
const errorBorderCls = 'border-red-500 focus:border-red-500 focus:ring-red-500/20'

// Format nomor Indonesia: 08xx / +628xx, total digit 10–13
function isValidPhone(v) {
    const d = v.replace(/[^\d+]/g, '')
    if (!/^(?:08\d{8,11}|\+628\d{8,11})$/.test(d)) return false
    const digits = d.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 13
}

const fields = [
    { name: 'name', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama kamu', hint: 'Muncul di riwayat dan notifikasi pesanan.' },
    { name: 'phone', label: 'No. HP', type: 'tel', placeholder: '08xxxxxxxxxx', hint: 'Dipakai kurir buat update pengiriman.' },
]

function ProfileSkeleton() {
    return (
        <div>
            <div className="rounded-xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-4 py-3">
                <Skeleton className="h-4 w-72 max-w-full rounded" />
            </div>
            <div className="mt-8">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="mt-2 h-3.5 w-64 max-w-full rounded" />
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Skeleton className="h-[46px] rounded-lg" />
                    <Skeleton className="h-[46px] rounded-lg" />
                    <Skeleton className="h-[46px] rounded-lg sm:col-span-2" />
                </div>
                <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--color-bg-section)] pt-5">
                    <Skeleton className="h-4 w-40 rounded-full" />
                    <Skeleton className="h-10 w-36 rounded-full" />
                </div>
            </div>
        </div>
    )
}

export default function ProfilePage() {
    const router = useRouter()
    const addToast = useToast()
    const { update } = useSession()
    const reduce = useReducedMotion()

    const [profile, setProfile] = useState(null) // baseline dari server
    const [form, setForm] = useState({ name: '', phone: '' })
    const [touched, setTouched] = useState({ name: false, phone: false })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/auth/profile')
            .then(r => { if (!r.ok) throw new Error('GAGAL'); return r.json() })
            .then(d => {
                const base = {
                    name: d.name || '',
                    email: d.email || '',
                    phone: d.phone || '',
                    createdAt: d.createdAt || null,
                }
                setProfile(base)
                setForm({ name: base.name, phone: base.phone })
            })
            .catch(() => addToast('Gagal memuat profil. Coba muat ulang halaman.', 'error'))
            .finally(() => setLoading(false))
    }, [addToast])

    const header = <PageHeader title="Profil" description="Data diri dan kontak yang kami pakai untuk pesanan kamu." />

    if (loading) return <>{header}<ProfileSkeleton /></>

    if (!profile) {
        return (
            <>
                {header}
                <div className="py-16 text-center">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Profil gagal dimuat</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Periksa koneksi kamu, lalu coba lagi.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-5 rounded-full bg-[var(--color-text-primary)] px-5 py-2 text-xs font-medium text-white transition-all hover:brightness-125"
                    >
                        Muat ulang
                    </button>
                </div>
            </>
        )
    }

    const nameError = !form.name.trim() || form.name.trim().length < 2 ? 'Nama minimal 2 karakter.' : ''
    const phoneError = !isValidPhone(form.phone) ? 'Gunakan nomor Indonesia: 08… atau +628…, 10–13 digit.' : ''
    const nameValid = !nameError
    const phoneValid = !phoneError

    const dirty = form.name.trim() !== profile.name || form.phone.trim() !== profile.phone
    const canSave = dirty && nameValid && phoneValid && !saving

    const joined = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        : null

    const reset = () => {
        setForm({ name: profile.name, phone: profile.phone })
        setTouched({ name: false, phone: false })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setTouched({ name: true, phone: true })
        if (!canSave) return
        setSaving(true)
        try {
            const payload = { name: form.name.trim(), phone: form.phone.trim() }
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (res.ok) {
                setProfile(p => ({ ...p, ...payload }))
                // sinkronkan nama baru ke session → sidebar AccountNav ikut ter-update
                if (payload.name !== profile.name) update({ name: payload.name })
                addToast('Perubahan profil berhasil disimpan.', 'success')
                router.refresh()
            } else {
                const data = await res.json().catch(() => ({}))
                addToast(data.error || 'Gagal menyimpan perubahan. Coba lagi.', 'error')
            }
        } catch {
            addToast('Terjadi kesalahan. Coba lagi.', 'error')
        }
        setSaving(false)
    }

    const container = {
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
    }
    const item = reduce
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : {
            hidden: { opacity: 0, y: 16 },
            show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26 } },
        }

    return (
        <>
            {header}
            <motion.div variants={container} initial="hidden" animate="show">
                {/* Blok ringkas identitas — nama, email, bergabung */}
                <motion.header
                    data-testid="identity"
                    variants={item}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] px-4 py-3"
                >
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{profile.name}</span>
                    <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--color-text-secondary)]" />
                    <span className="min-w-0 truncate text-sm text-[var(--color-text-secondary)]">{profile.email}</span>
                    {joined && (
                        <>
                            <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--color-text-secondary)]" />
                            <span className="text-sm text-[var(--color-text-secondary)]">Bergabung {joined}</span>
                        </>
                    )}
                </motion.header>

                {/* Form data diri */}
                <motion.section variants={item} className="mt-8">
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Data Diri</h2>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        Nama dan kontak ini yang kami pakai untuk pesanan kamu.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            {fields.map(f => {
                                const invalid = touched[f.name] && (f.name === 'name' ? !nameValid : !phoneValid)
                                const error = f.name === 'name' ? nameError : phoneError
                                return (
                                    <div key={f.name}>
                                        <label
                                            htmlFor={f.name}
                                            className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]"
                                        >
                                            {f.label}
                                        </label>
                                        <input
                                            id={f.name}
                                            type={f.type}
                                            name={f.name}
                                            value={form[f.name]}
                                            placeholder={f.placeholder}
                                            onChange={e => {
                                                setTouched(t => ({ ...t, [e.target.name]: true }))
                                                setForm(p => ({ ...p, [e.target.name]: e.target.value }))
                                            }}
                                            aria-invalid={invalid || undefined}
                                            className={`${inputCls} bg-white ${invalid ? errorBorderCls : 'border-[var(--color-bg-section)]'}`}
                                        />
                                        <p className={`mt-1.5 text-[11px] leading-relaxed ${invalid ? 'font-medium text-red-600' : 'text-[var(--color-text-secondary)]'}`}>
                                            {invalid ? error : f.hint}
                                        </p>
                                    </div>
                                )
                            })}

                            {/* Email — read-only, terlihat disabled */}
                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="email"
                                    className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        disabled
                                        aria-disabled="true"
                                        className={`${inputCls} cursor-not-allowed border-[var(--color-bg-section)] bg-[var(--color-bg-section)] pr-10 text-[var(--color-text-secondary)]`}
                                    />
                                    <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                </div>
                                <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                                    Notifikasi pesanan dikirim ke email ini. Email tidak bisa diubah di halaman ini — untuk ganti, hubungi CS lewat ikon chat.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-bg-section)] pt-5">
                            <p className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                {dirty ? (
                                    <>
                                        <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
                                        Ada perubahan belum disimpan
                                    </>
                                ) : (
                                    'Tidak ada perubahan'
                                )}
                            </p>
                            <div className="flex items-center gap-2.5">
                                {dirty && (
                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="rounded-full border border-[var(--color-text-secondary)]/40 px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)]"
                                    >
                                        Batalkan
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={!canSave}
                                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-section)] disabled:text-[var(--color-text-secondary)] disabled:hover:brightness-100"
                                >
                                    {saving && (
                                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    )}
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.section>
            </motion.div>
        </>
    )
}
