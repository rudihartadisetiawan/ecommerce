'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function SearchBar({ value, onChange }) {
  const [local, setLocal] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const timer = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { setLocal(value || '') }, [value])

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const v = e.target.value
    setLocal(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      onChange(v)
      if (v.trim().length >= 2) {
        setLoading(true)
        fetch(`/api/products?q=${encodeURIComponent(v.trim())}&limit=5`)
          .then(r => r.json())
          .then(data => {
            const list = Array.isArray(data) ? data : (data?.products || [])
            setSuggestions(list.slice(0, 5))
            setShowSuggestions(true)
          })
          .catch(() => {})
          .finally(() => setLoading(false))
      } else {
        setSuggestions([])
        setShowSuggestions(false)
        setLoading(false)
      }
    }, 300)
  }

  const handleClear = () => {
    setLocal('')
    onChange('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <svg className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={local}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Cari produk..."
        className="w-full border-b border-[var(--color-text-secondary)]/20 bg-transparent py-3 pl-7 pr-8 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-accent)]"
      />
      <AnimatePresence>
        {loading ? (
          <motion.div
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
          >
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </motion.div>
        ) : local ? (
          <motion.button
            key="clear"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleClear}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-xl"
          >
            {suggestions.map((p, index) => {
              const img = Array.isArray(p.images) ? p.images[0] : p.image
              return (
                <Link
                  key={p.id ? `sg-${p.id}-${index}` : `sg-${index}`}
                  href={`/produk/${p.slug}`}
                  className="flex items-center gap-3 px-4 py-3 text-xs transition-colors hover:bg-[var(--color-bg-section)]"
                >
                  {img && (
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-section)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--color-text-primary)]">{p.name}</p>
                    <p className="text-[var(--color-text-secondary)]">Rp{p.price?.toLocaleString('id-ID')}</p>
                  </div>
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
