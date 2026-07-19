'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from '../../../components/shop/Navigation'
import ProductCard from '../../../components/shop/ProductCard'
import SearchBar from '../../../components/shop/SearchBar'
import FilterSidebar from '../../../components/shop/FilterSidebar'
import Container from '../../../components/ui/Container'
import Footer from '../../../components/shop/Footer'

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

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {})
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('cat')
    if (cat) setFilters(f => ({ ...f, categories: [cat] }))
  }, [])

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products])

  const filtered = useMemo(() => {
    let result = [...products]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    }

    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category))
    }

    if (filters.sizes.length > 0) {
      result = result.filter((p) => (p.sizes || []).some((s) => filters.sizes.includes(s)))
    }

    if (filters.priceRange) {
      result = result.filter((p) => p.price >= filters.priceRange.min && p.price <= filters.priceRange.max)
    }

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price)
    else result.sort((a, b) => b.id - a.id)

    return result
  }, [searchQuery, filters, sortBy, products])

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
              ) : (
                <>
                  <p className="mb-6 text-xs text-[var(--color-text-secondary)]">{filtered.length} produk ditemukan</p>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
                  >
                    {filtered.map((product) => (
                      <motion.div key={product.id} variants={itemVariants}>
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  )
}
