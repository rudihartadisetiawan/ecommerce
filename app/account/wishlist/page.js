'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from '@/components/shop/ProductCard'

export default function WishlistPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wishlist')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Wishlist Saya</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Memuat wishlist...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Wishlist Saya</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Koleksi item favorit yang Anda simpan</p>
        </div>
        <span className="rounded-full bg-[var(--color-bg-section)] px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)]">
          {products.length} Item
        </span>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-text-secondary)]/20 py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Belum ada item di wishlist</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Tandai item favorit Anda dengan menekan ikon hati di halaman produk.</p>
          <Link
            href="/produk"
            className="mt-5 rounded-full bg-[var(--color-accent)] px-5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:brightness-110"
          >
            Jelajahi Koleksi
          </Link>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
        >
          {products.map(p => (
            <motion.div
              key={p.id}
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
