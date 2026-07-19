'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SearchBar({ value, onChange }) {
  const [local, setLocal] = useState(value || '')
  const timer = useRef(null)

  useEffect(() => { setLocal(value || '') }, [value])

  const handleChange = (e) => {
    const v = e.target.value
    setLocal(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), 300)
  }

  const handleClear = () => {
    setLocal('')
    onChange('')
  }

  return (
    <div className="relative">
      <svg className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder="Cari produk..."
        className="w-full border-b border-[var(--color-text-secondary)]/20 bg-transparent py-3 pl-7 pr-8 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-accent)]"
      />
      <AnimatePresence>
        {local && (
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
        )}
      </AnimatePresence>
    </div>
  )
}
