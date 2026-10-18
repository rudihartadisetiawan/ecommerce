'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'

// ─── Constants ────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending: '#F59E0B',
  paid: '#3B82F6',
  processing: '#6366F1',
  shipped: '#06B6D4',
  completed: '#22C55E',
  cancelled: '#EF4444',
}
const STATUS_LABELS = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Batal',
}
const STATUS_ORDER = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled']
const AVATAR_TONES = ['#1C1C1A', '#6B655A', '#9C9589', '#8B7355', '#B8874F']

// Catmull-Rom → Bezier untuk kurva line yang halus melewati tiap titik
function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
}

function SalesLineChart({ data }) {
  const W = 560, H = 210, PAD_L = 38, PAD_R = 14, PAD_T = 22, PAD_B = 28
  const iw = W - PAD_L - PAD_R
  const ih = H - PAD_T - PAD_B
  const max = Math.max(...data.map(d => d.total), 1)
  const top = max * 1.15
  const rawStep = top / 4
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const norm = rawStep / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  const ticks = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  if (ticks.length < 2) ticks.push(step)

  const pts = data.map((d, i) => ({
    x: PAD_L + (i / (data.length - 1)) * iw,
    y: PAD_T + ih - Math.max(d.total / top, 0) * ih,
    total: d.total,
  }))
  const line = smoothPath(pts)
  const area = pts.length > 1
    ? `${line} L ${pts[pts.length - 1].x.toFixed(2)},${(PAD_T + ih).toFixed(2)} L ${pts[0].x.toFixed(2)},${(PAD_T + ih).toFixed(2)} Z`
    : ''

  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafik penjualan 12 bulan">
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A373" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#D4A373" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map(v => {
          const y = PAD_T + ih - (v / top) * ih
          return (
            <g key={v}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#F0EDE6" strokeWidth={1} />
              <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#9C9589">
                {(v / 1_000_000).toFixed(1)}jt
              </text>
            </g>
          )
        })}
        {area && <motion.path d={area} fill="url(#salesGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} />}
        {line && (
          <motion.path
            d={line}
            fill="none"
            stroke="#D4A373"
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
        )}
        {pts.map((p, i) => {
          const isLast = i === pts.length - 1
          return (
            <circle
              key={i}
              cx={p.x} cy={p.y} r={isLast ? 4.5 : 3.2}
              fill={isLast ? '#D4A373' : '#FFFFFF'}
              stroke="#D4A373" strokeWidth={2}
              className="cursor-pointer"
            >
              <title>{data[i].label} {data[i].year}: Rp {(p.total || 0).toLocaleString('id-ID')}</title>
            </circle>
          )
        })}
        {data.map((d, i) => {
          const p = pts[i]
          return (
            <text
              key={i}
              x={p.x}
              y={PAD_T + ih + 16}
              textAnchor="middle"
              fontSize={9}
              fill={i === data.length - 1 ? '#1C1C1A' : '#9C9589'}
              fontWeight={i === data.length - 1 ? 600 : 400}
            >
              {d.label}
            </text>
          )
        })}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-[#9C9589]">
        <span>{data[0]?.year}: {data[0]?.label} — {data[data.length - 1]?.label} · {data[data.length - 1]?.year}</span>
        <span className="font-semibold text-[#6B655A]">
          {(() => { const tot = data.reduce((s, d) => s + (d.total || 0), 0); return `Rp ${(tot / 1_000_000).toFixed(0)}jt total` })()}
        </span>
      </div>
    </div>
  )
}

const IcoCalendar = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
)

// ─── Sub-components ────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, subColor = 'text-[#9C9589]', accent = false, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border bg-white p-5 ${
        accent ? 'border-[#E7D6BB]' : 'border-[#EEEBE4]'
      }`}
    >
      {accent && <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#D4A373]/10" />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9589]">{label}</p>
          <p className="mt-2 truncate text-[26px] font-bold leading-none tracking-tight text-[#1C1C1A]">{value}</p>
          {sub && <p className={`mt-2.5 text-[11px] font-medium ${subColor}`}>{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          accent ? 'bg-[#D4A373] text-white' : 'bg-[#F5F4F1] text-[#6B655A]'
        }`}>
          {icon}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

function SectionHeader({ title, sub, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-[var(--font-display)] text-lg font-medium text-[#1C1C1A]">{title}</h2>
        {sub && <p className="mt-1 text-[11px] text-[#9C9589]">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

function SectionEyebrow({ children }) {
  return (
    <p className="mb-3.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9C9589]">{children}</p>
  )
}

// ─── Icons (inline SVG) ────────────────────────────────────────────
const IcoBox = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
)
const IcoOrders = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
  </svg>
)
const IcoRevenue = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
  </svg>
)
const IcoStock = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
)
const IcoAvg = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
)
const IcoClock = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)

// ─── Helpers ────────────────────────────────────────────────────────
const customerNameOf = (o) =>
  o.userName || (o.shippingAddress || '').split(',')[0]?.trim() || 'Pelanggan'
const orderItemsCount = (o) => (o.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0)
const paymentShort = (m) => (m || '').split('|')[0].trim().toUpperCase().slice(0, 12)

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Baru saja'
  if (min < 60) return `${min} mnt lalu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [ordersCount, setOrdersCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [chartReady, setChartReady] = useState(false)

  const isSuperAdmin = session?.user?.role === 'super_admin'

  const load = useCallback(() => {
    Promise.all([
      fetch('/api/products?all=true').then(r => r.json()).then(d => { setProducts(Array.isArray(d) ? d : (d.products || [])) }).catch(() => {}),
      fetch('/api/orders?all=true').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          setOrders(data)
          const pending = data.filter(o => o.status === 'paid' || o.status === 'pending').length
          const revenue = data.filter(o => o.status === 'paid' || o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0)
          setOrdersCount(pending)
          setTotalRevenue(revenue)
        } else { setOrders([]) }
      }).catch(() => setOrders([])),
    ]).finally(() => setChartReady(true))
  }, [])

  useEffect(() => { load() }, [load])

  const monthlySales = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('id-ID', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), total: 0 })
    }
    orders.forEach(o => {
      if (o.status !== 'paid' && o.status !== 'completed') return
      const d = new Date(o.createdAt)
      const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth())
      if (m) m.total += o.total || 0
    })
    return months
  }, [orders])

  // Omset & delta bulan ini vs bulan lalu
  const revenueThisMonth = monthlySales[11]?.total || 0
  const revenueLastMonth = monthlySales[10]?.total || 0
  const revenueDelta = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : null

  // AOV — rata-rata nilai order (paid + completed)
  const paidCompletedOrders = useMemo(
    () => orders.filter(o => o.status === 'paid' || o.status === 'completed'),
    [orders],
  )
  const aov = paidCompletedOrders.length > 0
    ? Math.round(paidCompletedOrders.reduce((s, o) => s + (o.total || 0), 0) / paidCompletedOrders.length)
    : 0

  // Pesanan terbaru (semua status, urut createdAt desc dari API)
  const recentOrders = useMemo(() => orders.slice(0, 6), [orders])

  const topProducts = useMemo(() => {
    const counts = new Map()
    orders.forEach(o => {
      if (o.status !== 'completed') return
      ;(o.items || []).forEach(item => {
        const pid = item.productId || item.product?.id
        if (!pid) return
        counts.set(pid, (counts.get(pid) || 0) + (item.quantity || 1))
      })
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, qty]) => ({
      id, qty,
      name: products.find(p => p.id === id)?.name || 'Produk dihapus',
    }))
  }, [orders, products])

  const statusBreakdown = useMemo(() => {
    const counts = { pending: 0, paid: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 }
    orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++ })
    return counts
  }, [orders])

  const lowStockProducts = useMemo(() =>
    products.filter(p => p.isActive && p.stock <= 5 && p.stock > 0).sort((a, b) => a.stock - b.stock),
  [products])

  const outOfStockCount = useMemo(() =>
    products.filter(p => p.isActive && p.stock === 0).length,
  [products])

  const topCustomers = useMemo(() => {
    const counts = new Map()
    orders.forEach(o => {
      if (!o.userId && !(o.shippingAddress || '').trim()) return
      const key = o.userId ? `u${o.userId}` : `g${o.id}`
      if (!counts.has(key)) counts.set(key, { name: customerNameOf(o), orderCount: 0, totalSpent: 0, userId: o.userId })
      const c = counts.get(key)
      c.orderCount++
      if (o.status === 'paid' || o.status === 'completed') c.totalSpent += o.total || 0
    })
    return [...counts.values()].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5)
  }, [orders])

  const fmtRp = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

  const today = chartReady
    ? new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <>
      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9C9589]">CMS Overview</p>
          <h1 className="mt-1.5 font-[var(--font-display)] text-2xl font-medium text-[#1C1C1A]">Dashboard</h1>
          <p className="mt-1.5 text-sm text-[#9C9589]">Selamat datang kembali, {session?.user?.name?.split(' ')[0] || 'Admin'}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#EEEBE4] bg-white px-4 py-2 text-[11px] font-medium text-[#6B655A] shadow-sm">
          <span className="text-[#D4A373]"><IcoCalendar /></span>
          {today}
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <SectionEyebrow>Ringkasan</SectionEyebrow>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<IcoBox />}
          label="Total Produk"
          value={products.length}
          sub={`${products.filter(p => p.isActive).length} aktif · ${outOfStockCount} habis stok`}
          subColor={outOfStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}
        />
        <StatCard
          icon={<IcoOrders />}
          label="Perlu Diproses"
          value={ordersCount}
          sub="Pesanan pending & paid"
          subColor={ordersCount > 0 ? 'text-amber-600' : 'text-[#9C9589]'}
        />
        <StatCard
          icon={<IcoStock />}
          label="Stok Hampir Habis"
          value={lowStockProducts.length + outOfStockCount}
          sub={lowStockProducts.length + outOfStockCount > 0 ? 'Segera restok' : 'Semua aman'}
          subColor={lowStockProducts.length + outOfStockCount > 0 ? 'text-red-500' : 'text-emerald-600'}
        />
        {isSuperAdmin ? (
          <StatCard
            icon={<IcoRevenue />}
            label="Total Omset"
            value={fmtRp(totalRevenue)}
            sub="Paid + Completed"
            accent
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-[#EEEBE4] bg-white p-5 flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9589]">Laporan Keuangan</p>
            <p className="mt-2 text-xs text-[#9C9589]/60 italic">Akses khusus Super Admin</p>
          </div>
        )}
      </div>

      {/* ── Omset Bulan Ini + AOV (super_admin) ── */}
      {isSuperAdmin && (
        <>
          <SectionEyebrow>Kinerja Bulan Ini</SectionEyebrow>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Omset bulan ini + delta */}
            <div className="rounded-2xl border border-[#E7D6BB] bg-white p-6 relative overflow-hidden">
              <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#D4A373]/10" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9C9589]">Omset Bulan Ini</p>
                  <p className="mt-2 text-3xl font-bold leading-none tracking-tight text-[#1C1C1A]">{fmtRp(revenueThisMonth)}</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] font-medium">
                    {revenueDelta === null ? (
                      <span className="text-[#9C9589]">Bulan lalu kosong — ini bulan pertama</span>
                    ) : revenueDelta >= 0 ? (
                      <>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.281 5.941" /></svg>
                          {revenueDelta}% vs bulan lalu
                        </span>
                        <span className="text-[#9C9589]">Sedang naik</span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-500">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 5.306-4.762l2.564-1.077m0 0-5.012-2.155M21.158 6.69l-2.155 5.012" /></svg>
                          {Math.abs(revenueDelta)}% vs bulan lalu
                        </span>
                        <span className="text-[#9C9589]">Perlu perhatian</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4A373] text-white">
                  <IcoRevenue />
                </div>
              </div>
              {/* Mini bar 6 bulan terakhir */}
              <div className="mt-5 flex h-14 items-end gap-1.5">
                {monthlySales.slice(-6).map((m, i) => (
                  <div key={m.key} className="group relative flex-1" title={`${m.label} ${m.year}: ${fmtRp(m.total)}`}>
                    <div
                      className={`w-full rounded-t ${i === 5 ? 'bg-[#D4A373]' : 'bg-[#E8DCC8] group-hover:bg-[#D4A373]/60'}`}
                      style={{ height: `${Math.max((m.total / Math.max(revenueThisMonth, revenueLastMonth, 1)) * 100, m.total > 0 ? 8 : 2)}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* AOV */}
            <div className="rounded-2xl border border-[#EEEBE4] bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9C9589]">Rata-rata Nilai Order</p>
                  <p className="mt-2 text-3xl font-bold leading-none tracking-tight text-[#1C1C1A]">{fmtRp(aov)}</p>
                  <p className="mt-3 text-[11px] font-medium text-[#9C9589]">
                    Dari {paidCompletedOrders.length} pesanan berhasil (paid + completed)
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5F4F1] text-[#6B655A]">
                  <IcoAvg />
                </div>
              </div>
              {aov > 0 && (
                <div className="mt-5 rounded-xl bg-[#FAFAF9] px-4 py-3 text-[11px] leading-relaxed text-[#6B655A]">
                  Pelanggan rata-rata belanja <span className="font-bold text-[#1C1C1A]">{fmtRp(aov)}</span> per pesanan.
                  {aov >= 200000 ? <span> Nilai order tinggi — fokus pertahankan kualitas & bundling.</span> : <span> Ajak upgrade via bundle produk atau gratis ongkir minimal belanja.</span>}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Charts Row ── */}
      {chartReady && orders.length > 0 && (
        <>
          <SectionEyebrow>Analitik</SectionEyebrow>
          <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Line Chart — finansial, hanya super_admin */}
            {isSuperAdmin && (
              <div className="lg:col-span-2 rounded-2xl border border-[#EEEBE4] bg-white p-6">
                <SectionHeader
                  title="Penjualan Setahun"
                  sub="Total omset (paid + completed) — 12 bulan terakhir"
                action={<span className="rounded-md bg-[#F5F4F1] px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#6B655A]">IDR</span>}
              />
              <SalesLineChart data={monthlySales} />
            </div>
            )}
            <div className={`rounded-2xl border border-[#EEEBE4] bg-white p-6 ${isSuperAdmin ? '' : 'lg:col-span-3'}`}>
              <SectionHeader title="Status Pesanan" sub="Komposisi saat ini" />
              {(() => {
                const total = Object.values(statusBreakdown).reduce((s, v) => s + v, 0)
                let cursor = 0
                const segments = []
                if (total > 0) {
                  STATUS_ORDER.forEach(key => {
                    const val = statusBreakdown[key]
                    if (val === 0) return
                    const start = cursor
                    const end = cursor + (val / total) * 100
                    segments.push({ key, start, end, color: STATUS_COLORS[key], val })
                    cursor = end
                  })
                }
                const gradient = total > 0
                  ? `conic-gradient(${segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`
                  : 'conic-gradient(#F5F4F1 0% 100%)'
                return (
                  <div>
                    <div className="relative h-32 w-32 mx-auto mb-5">
                      <div className="absolute inset-0 rounded-full" style={{ background: gradient }} />
                      <div className="absolute inset-[18px] rounded-full bg-white flex items-center justify-center shadow-sm">
                        <div className="text-center">
                          <p className="text-xl font-bold text-[#1C1C1A] leading-none">{total}</p>
                          <p className="text-[9px] text-[#9C9589] uppercase tracking-wide mt-0.5">Total</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {STATUS_ORDER.filter(s => statusBreakdown[s] > 0).map(s => (
                        <div key={s} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: STATUS_COLORS[s] }} />
                            <span className="text-[#6B655A]">{STATUS_LABELS[s]}</span>
                          </div>
                          <span className="font-semibold text-[#1C1C1A]">{statusBreakdown[s]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </>
      )}

      {/* ── Recent Orders ── */}
      {chartReady && recentOrders.length > 0 && (
        <>
          <SectionEyebrow>Pesanan Terbaru</SectionEyebrow>
          <div className="mb-8 rounded-2xl border border-[#EEEBE4] bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-[#F0EDE6] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F4F1] text-[#6B655A]">
                  <IcoClock />
                </div>
                <div>
                  <h2 className="font-[var(--font-display)] text-base font-medium text-[#1C1C1A]">Aktivitas Pesanan</h2>
                  <p className="text-[11px] text-[#9C9589]">6 pesanan terbaru di semua status</p>
                </div>
              </div>
              <Link
                href="/admin/pesanan"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#EEEBE4] px-3 py-1.5 text-[11px] font-semibold text-[#6B655A] transition-colors hover:bg-[#F5F4F1] hover:text-[#1C1C1A]"
              >
                Lihat Semua
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              </Link>
            </div>
            <div className="divide-y divide-[#F0EDE6]">
              {recentOrders.map(o => (
                <div key={o.id} className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-[#FAFAF9]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F4F1] text-[11px] font-bold text-[#6B655A]">
                    {(customerNameOf(o) || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-semibold text-[#1C1C1A]">{customerNameOf(o)}</p>
                      <span className="hidden shrink-0 text-[10px] text-[#9C9589] sm:inline">{o.id}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-[#9C9589]">
                      {orderItemsCount(o)} item · {paymentShort(o.paymentMethod) || '—'} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-[#1C1C1A]">{o.total == null ? <span className="italic text-[#9C9589]">Diakses Super Admin</span> : fmtRp(o.total)}</p>
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{ color: STATUS_COLORS[o.status], backgroundColor: `${STATUS_COLORS[o.status]}14` }}
                    >
                      {STATUS_LABELS[o.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Top Products + Customers Row ── */}
      {chartReady && (topProducts.length > 0 || (isSuperAdmin && topCustomers.length > 0)) && (
        <div className={`mb-8 grid grid-cols-1 gap-5 ${isSuperAdmin && topCustomers.length > 0 ? 'lg:grid-cols-2' : ''}`}>
          {/* Top Products */}
          {topProducts.length > 0 && (
            <div className="rounded-2xl border border-[#EEEBE4] bg-white p-6">
              <SectionHeader title="Produk Terlaris" sub="Top 5 berdasarkan qty terjual (completed)" />
              <div className="space-y-4">
                {(() => {
                  const maxQty = topProducts[0]?.qty || 1
                  return topProducts.map((p, i) => {
                    const pct = (p.qty / maxQty) * 100
                    const colors = ['bg-[#D4A373]', 'bg-[#C49060]', 'bg-[#B47D4D]', 'bg-[#A46A3A]', 'bg-[#945727]']
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="w-5 text-[11px] font-bold text-[#9C9589] tabular-nums shrink-0">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1.5 gap-2">
                            <span className="text-xs font-semibold text-[#1C1C1A] truncate">{p.name}</span>
                            <span className="text-xs font-bold text-[#6B655A] shrink-0">{p.qty} terjual</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#F5F4F1] overflow-hidden">
                            <div className={`h-full rounded-full ${colors[i] || 'bg-[#D4A373]'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* Top Customers — hanya super_admin (data nominal) */}
          {isSuperAdmin && topCustomers.length > 0 && (
            <div className="rounded-2xl border border-[#EEEBE4] bg-white p-6">
              <SectionHeader title="Top Pelanggan" sub="Berdasarkan jumlah pesanan" />
              <div className="space-y-2.5">
                {topCustomers.map((c, i) => {
                  const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={c.userId || i} className="flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors hover:border-[#EEEBE4] hover:bg-[#FAFAF9]">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm" style={{ background: AVATAR_TONES[i] || '#D4A373' }}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1C1C1A] truncate">{c.name}</p>
                        <p className="text-[10px] text-[#9C9589]">{c.orderCount} pesanan · {fmtRp(c.totalSpent)}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#F5F4F1] px-2 py-0.5 text-[9px] font-bold text-[#6B655A]">
                        #{i + 1}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Low Stock Alert ── */}
      {chartReady && (lowStockProducts.length > 0 || outOfStockCount > 0) && (
        <div className="mb-8 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Peringatan Stok</p>
              <p className="text-[10px] text-amber-600">{lowStockProducts.length + outOfStockCount} produk perlu perhatian</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {outOfStockCount > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">0</div>
                <div>
                  <p className="text-xs font-semibold text-red-700">{outOfStockCount} produk habis</p>
                  <p className="text-[10px] text-red-400">Stok kosong — segera restok</p>
                </div>
              </div>
            )}
            {lowStockProducts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#EEEBE4] bg-white p-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0 ${p.stock <= 2 ? 'bg-red-500' : 'bg-amber-400'}`}>{p.stock}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#1C1C1A]">{p.name}</p>
                  <p className="text-[10px] text-[#9C9589]">{p.category}</p>
                </div>
                <Link href={`/admin/produk/${p.id}/edit`} className="shrink-0 rounded-lg border border-[#EEEBE4] px-2.5 py-1 text-[10px] font-medium text-[#6B655A] hover:bg-[#F5F4F1] transition-colors">Edit</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}