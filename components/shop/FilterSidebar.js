'use client'

import { motion, AnimatePresence } from 'framer-motion'

const priceRanges = [
  { label: '< Rp200rb', min: 0, max: 200000 },
  { label: 'Rp200–350rb', min: 200000, max: 350000 },
  { label: 'Rp350–500rb', min: 350000, max: 500000 },
  { label: '> Rp500rb', min: 500000, max: Infinity },
]

export default function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
  categories,
  isMobileOpen,
  onMobileClose,
}) {
  const toggleCategory = (cat) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat]
    onFilterChange({ ...filters, categories: next })
  }

  const toggleSize = (size) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size]
    onFilterChange({ ...filters, sizes: next })
  }

  const setPriceRange = (range) => {
    if (filters.priceRange && filters.priceRange.min === range.min && filters.priceRange.max === range.max) {
      onFilterChange({ ...filters, priceRange: null })
    } else {
      onFilterChange({ ...filters, priceRange: range })
    }
  }

  const filterContent = (
    <div className="space-y-8">
      <div>
        <h4 className="mb-3 text-xs font-semibold tracking-widest text-[var(--color-text-secondary)] uppercase">Kategori</h4>
        <div className="space-y-2">
          {categories.map((cat, index) => (
            <label key={cat || `cat-${index}`} className="flex cursor-pointer items-center gap-3 text-sm text-[var(--color-text-primary)]">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="h-4 w-4 rounded border-[var(--color-text-secondary)]/30 text-[var(--color-accent)] accent-[var(--color-accent)]"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold tracking-widest text-[var(--color-text-secondary)] uppercase">Ukuran</h4>
        <div className="flex flex-wrap gap-2">
          {['S', 'M', 'L', 'XL'].map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`h-9 w-9 rounded-full text-xs font-medium transition-colors ${
                filters.sizes.includes(size)
                  ? 'bg-[var(--color-text-primary)] text-white'
                  : 'bg-[var(--color-bg-section)] text-[var(--color-text-secondary)] hover:bg-[var(--color-text-secondary)]/20'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold tracking-widest text-[var(--color-text-secondary)] uppercase">Harga</h4>
        <div className="flex flex-wrap gap-2">
          {priceRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => setPriceRange(range)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                filters.priceRange?.min === range.min && filters.priceRange?.max === range.max
                  ? 'bg-[var(--color-text-primary)] text-white'
                  : 'bg-[var(--color-bg-section)] text-[var(--color-text-secondary)] hover:bg-[var(--color-text-secondary)]/20'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="text-xs font-medium text-[var(--color-text-secondary)] underline underline-offset-4 transition-colors hover:text-[var(--color-text-primary)]"
      >
        Reset Filter
      </button>
    </div>
  )

  return (
    <>
      <div className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="sticky top-28">
          <h3 className="mb-6 text-sm font-semibold text-[var(--color-text-primary)]">Filter</h3>
          {filterContent}
        </div>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            key="mobile-filter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[var(--color-bg-warm)] p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Filter</h3>
                <button onClick={onMobileClose} className="text-[var(--color-text-secondary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {filterContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
