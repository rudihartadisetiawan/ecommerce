'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Navigation from '../../../components/shop/Navigation'
import ProductCard from '../../../components/shop/ProductCard'
import SearchBar from '../../../components/shop/SearchBar'
import FilterSidebar from '../../../components/shop/FilterSidebar'
import Container from '../../../components/ui/Container'
import Footer from '../../../components/shop/Footer'
import { ProductGridSkeleton } from '../../../components/ui/Skeleton'
import { getRecentlyViewed } from '@/lib/recently-viewed'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ categories: [], sizes: [], priceRange: null })
  const [sortBy, setSortBy] = useState('newest')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const recentScrollRef = useRef(null)

  const scrollRecent = (direction) => {
    if (recentScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260
      recentScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  useEffect(() => { setRecentlyViewed(getRecentlyViewed()) }, [])

  // Daftar kategori lengkap — independen dari sort/pagination
  useEffect(() => {
    fetch('/api/products?only=categories')
      .then(r => r.json())
      .then(cats => Array.isArray(cats) && setAllCategories(cats))
      .catch(() => {})
  }, [])

  const fetchProducts = async (pageNum, append = false) => {
    const params = new URLSearchParams({ page: pageNum, limit: '12' })
    if (searchQuery) params.set('q', searchQuery)
    if (filters.categories.length > 0) params.set('category', filters.categories.join(','))
    if (sortBy !== 'newest') params.set('sort', sortBy)

    if (!append) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (data.products) {
        setProducts(prev => append ? [...prev, ...data.products] : data.products)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch {}
    setLoading(false)
    setLoadingMore(false)
  }

  // Fetch when filters change (reset to page 1)
  useEffect(() => {
    setPage(1)
    fetchProducts(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters.categories.join(','), sortBy])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchProducts(next, true)
  }

  // Baca filter kategori dari URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('cat')
    if (cat) setFilters(f => ({ ...f, categories: [cat] }))
  }, [])

  // Kategori sidebar: pakai daftar lengkap dari API; fallback ke kategori dari produk termuat
  const categories = useMemo(() => {
    const fromApi = allCategories.length ? allCategories : null
    const fromLoaded = [...new Set(products.map((p) => p.category).filter(Boolean))]
    return fromApi || fromLoaded
  }, [allCategories, products])

  // Client-side filter untuk loaded products (size, price) — kategori & search via API
  const filtered = useMemo(() => {
    let result = [...products]
    if (filters.sizes.length > 0) {
      result = result.filter((p) => (p.sizes || []).some((s) => filters.sizes.includes(s)))
    }
    if (filters.priceRange) {
      result = result.filter((p) => p.price >= filters.priceRange.min && p.price <= filters.priceRange.max)
    }
    return result
  }, [filters, products])

  const handleReset = () => setFilters({ categories: [], sizes: [], priceRange: null })

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        <Container>
          <div className="mb-8">
            <p className="text-xs text-[var(--color-text-secondary)]">Beranda / Koleksi</p>
            <h1 className="mt-2 font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Koleksi</h1>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md flex-1">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-[var(--color-text-secondary)]/20 bg-transparent px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] outline-none"
              >
                <option value="newest">Terbaru</option>
                <option value="price-asc">Termurah</option>
                <option value="price-desc">Termahal</option>
              </select>
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex items-center gap-2 rounded-full border border-[var(--color-text-secondary)]/20 px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] lg:hidden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                </svg>
                Filter
              </button>
            </div>
          </div>

          <div className="lg:flex lg:gap-8">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleReset}
              categories={categories}
              isMobileOpen={mobileFilterOpen}
              onMobileClose={() => setMobileFilterOpen(false)}
            />

            <div className="min-w-0 flex-1">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <svg className="mb-4 h-16 w-16 text-[var(--color-text-secondary)]/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                  <p className="text-sm text-[var(--color-text-secondary)]">Tidak ada produk yang cocok dengan filter kamu.</p>
                  <button onClick={handleReset} className="mt-4 text-xs font-medium text-[var(--color-accent)] underline underline-offset-4">Reset Filter</button>
                </div>
              ) : loading ? (
                <ProductGridSkeleton count={8} />
              ) : (
                <>
                  <p className="mb-6 text-xs text-[var(--color-text-secondary)]">
                    Menampilkan {filtered.length} dari {total} produk
                  </p>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                  >
                    {filtered.map((product, index) => (
                      <motion.div key={product.id ? `prod-${product.id}-${index}` : `prod-${index}`} variants={itemVariants}>
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                  {page < totalPages && (
                    <div className="mt-10 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="rounded-full border border-[var(--color-text-primary)]/20 bg-white px-8 py-3 text-xs font-medium text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-text-primary)] hover:text-white disabled:opacity-50"
                      >
                        {loadingMore ? 'Memuat…' : `Muat Lainnya (${total - page * 12 > 0 ? Math.min(12, total - page * 12) : 0})`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Container>
      </main>

      {recentlyViewed.length > 0 && (
        <section className="border-t border-black/5 bg-[var(--color-bg-section)]/40 py-10">
          <Container>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-[var(--font-display)] text-lg text-[var(--color-text-primary)] sm:text-xl">
                  Baru Dilihat
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Produk yang baru saja Anda buka
                </p>
              </div>

              {recentlyViewed.length > 2 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollRecent('left')}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-[var(--color-text-primary)] shadow-2xs transition-all hover:bg-black/5 active:scale-95"
                    aria-label="Scroll kiri"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollRecent('right')}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-[var(--color-text-primary)] shadow-2xs transition-all hover:bg-black/5 active:scale-95"
                    aria-label="Scroll kanan"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Horizontal Scroll Track — Compact Cards */}
            <div
              ref={recentScrollRef}
              className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 pt-1 scroll-smooth snap-x snap-mandatory sm:mx-0 sm:gap-4 sm:px-0 [scrollbar-width:thin]"
            >
              {recentlyViewed.map((p, index) => (
                <div
                  key={p.id ? `rv-${p.id}-${index}` : `rv-${index}`}
                  className="w-36 shrink-0 snap-start sm:w-44"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      <Footer />
    </>
  )
}
