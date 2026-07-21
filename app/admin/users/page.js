'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'

const mockUsers = [
  { id: 1, name: 'Rudi', email: 'owner@gaul.com', role: 'super_admin', createdAt: '2026-01-01' },
  { id: 2, name: 'Admin Gudang', email: 'admin@gaul.com', role: 'admin', createdAt: '2026-02-15' },
  { id: 3, name: 'CS Staff Rina', email: 'rina.cs@gaul.com', role: 'admin', createdAt: '2026-03-10' },
  { id: 4, name: 'Budi Santoso', email: 'budi@gmail.com', role: 'customer', createdAt: '2026-05-01' },
]

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState(mockUsers)
  const [isSuperAdmin, setIsSuperAdmin] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [msg, setMsg] = useState('')
  const [loginLogs, setLoginLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users?filter=staff')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setUsers(data)
        }
      }
    } catch {}
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Check if session role is super_admin or admin
  useEffect(() => {
    if (session?.user?.role) {
      setIsSuperAdmin(session.user.role === 'super_admin')
    }
  }, [session])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setMsg('❌ Semua field wajib diisi!')
      return
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setShowAddModal(false)
        setForm({ name: '', email: '', password: '' })
        setMsg('✅ Akun Staff berhasil ditambahkan!')
        loadUsers()
      } else {
        setMsg('❌ ' + (data.error || 'Gagal membuat akun staff.'))
      }
    } catch {
      setMsg('❌ Terjadi kesalahan jaringan.')
    }
    setTimeout(() => setMsg(''), 4000)
  }

  const toggleLogs = async () => {
    if (showLogs) { setShowLogs(false); return }
    if (!isSuperAdmin) return
    setLogsLoading(true)
    setShowLogs(true)
    try {
      const res = await fetch('/api/admin/login-logs')
      if (res.ok) setLoginLogs(await res.json())
    } catch {} finally { setLogsLoading(false) }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (res.ok) {
        setMsg('✅ Role pengguna berhasil diperbarui.')
        loadUsers()
      } else {
        const data = await res.json()
        setMsg('❌ ' + (data.error || 'Gagal memperbarui role.'))
      }
    } catch {
      setMsg('❌ Terjadi kesalahan jaringan.')
    }
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Kelola Staff & Role</h1>
            <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isSuperAdmin ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-gray-100 text-gray-700'
            }`}>
              {isSuperAdmin ? 'Akses Super Admin' : 'Akses Limited Admin'}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Manajemen akun Super Admin (Owner) dan Admin Staff (CS/Gudang).
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-full bg-[var(--color-text-primary)] px-5 py-2 text-xs font-medium text-white transition-colors hover:brightness-125 inline-flex items-center gap-1.5 shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            + Tambah Staff Admin
          </button>
        )}
      </div>

      {/* Notification Message */}
      {msg && (
        <div className="mb-6 rounded-2xl bg-[var(--color-bg-section)] px-4 py-3 text-xs font-medium text-[var(--color-text-primary)] shadow-xs">
          {msg}
        </div>
      )}

      {/* Access Warning Banner if not Super Admin */}
      {!isSuperAdmin && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-center gap-3">
          <svg className="h-5 w-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <span className="font-bold">Mode Pembatasan Role:</span> Anda masuk sebagai Admin Staff. Pengubahan role dan penambahan akun staff hanya dapat dilakukan oleh **Super Admin (Owner)**.
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-bg-section)] text-xs font-medium uppercase text-[var(--color-text-secondary)]">
              <th className="px-4 py-3.5">Pengguna</th>
              <th className="px-4 py-3.5">Email</th>
              <th className="px-4 py-3.5">Tipe Role</th>
              <th className="px-4 py-3.5">Hak Akses Modul</th>
              <th className="px-4 py-3.5 text-right">Aksi Super Admin</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isSuper = u.role === 'super_admin'
              const isAdminStaff = u.role === 'admin'
              return (
                <tr key={u.id} className="border-b border-[var(--color-bg-section)]/50 last:border-0 hover:bg-[var(--color-bg-warm)]/50 transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${
                        isSuper ? 'bg-purple-600' : isAdminStaff ? 'bg-blue-600' : 'bg-gray-500'
                      }`}>
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--color-text-primary)]">{u.name}</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">Didaftarkan: {u.createdAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-[var(--color-text-secondary)]">
                    {u.email}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                      isSuper
                        ? 'text-purple-700 bg-purple-50 border-purple-200'
                        : 'text-blue-700 bg-blue-50 border-blue-200'
                    }`}>
                      {isSuper ? '👑 Super Admin' : '🛠️ Admin Staff'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[var(--color-text-secondary)]">
                    {isSuper && <span className="font-medium text-purple-600">Akses Penuh + Keuangan Omset</span>}
                    {isAdminStaff && <span className="font-medium text-blue-600">Produk, Pesanan & Live Chat CS</span>}
                    {!isSuper && !isAdminStaff && <span>Akses Pembeli Toko</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    {isSuperAdmin ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="rounded-xl border border-[var(--color-text-secondary)]/20 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-[var(--color-accent)] shadow-2xs"
                      >
                        <option value="super_admin">Set: Super Admin</option>
                        <option value="admin">Set: Admin Staff</option>
                      </select>
                    ) : (
                      <span className="text-xs text-[var(--color-text-secondary)] italic opacity-60">Terunci</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Riwayat Login */}
      {isSuperAdmin && (
        <div className="mt-8">
          <button
            onClick={toggleLogs}
            className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
          >
            <svg className={`h-4 w-4 transition-transform ${showLogs ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            Riwayat Login Staff
          </button>

          {showLogs && (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-sm">
              {logsLoading ? (
                <div className="p-6 text-center text-xs text-[var(--color-text-secondary)]">Memuat...</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-bg-section)] text-xs font-medium uppercase text-[var(--color-text-secondary)]">
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginLogs.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-[var(--color-text-secondary)]">Belum ada riwayat login.</td></tr>
                    ) : loginLogs.map(l => (
                      <tr key={l.id} className="border-b border-[var(--color-bg-section)]/50 last:border-0 hover:bg-[var(--color-bg-warm)]/50 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[var(--color-text-primary)] font-mono">
                          {new Date(l.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-[var(--color-text-primary)]">{l.name}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            l.role === 'super_admin'
                              ? 'text-purple-700 bg-purple-50 border-purple-200'
                              : 'text-blue-700 bg-blue-50 border-blue-200'
                          }`}>
                            {l.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-[var(--color-text-secondary)] font-mono">{l.ip || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Tambah Akun Staff Baru</h3>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Buatkan kredensial akses untuk tim operasional toko.</p>

              <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-primary)]">Nama Lengkap:</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Contoh: Rina CS Staff"
                    className="mt-1 w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-3 py-2 text-xs outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-primary)]">Email Login:</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="rina.cs@gaul.com"
                    className="mt-1 w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-3 py-2 text-xs outline-none focus:border-[var(--color-accent)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-primary)]">Password Login:</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Minimal 6 karakter"
                    className="mt-1 w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-transparent px-3 py-2 text-xs outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="mt-6 flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-full border border-[var(--color-text-secondary)]/20 py-2 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-section)]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-full bg-[var(--color-text-primary)] py-2 text-xs font-medium text-white transition-colors hover:brightness-125"
                  >
                    Simpan Staff
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
