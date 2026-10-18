'use client'

import { useState, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

// Ikon feather-style per tipe — tanpa emoji
const ICONS = {
  success: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  error: 'm15 9-6 6m0-6 6 6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
}

const STYLES = {
  success: { title: 'Berhasil', chip: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  error: { title: 'Gagal', chip: 'bg-red-50 text-red-500', bar: 'bg-red-500' },
  warning: { title: 'Perhatian', chip: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500' },
  info: { title: 'Informasi', chip: 'bg-sky-50 text-sky-600', bar: 'bg-sky-500' },
}

const DURATION = 4500

function Toast({ message, type, title, onClose }) {
  const s = STYLES[type] || STYLES.info
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto relative w-80 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl"
    >
      <div className="flex items-start gap-3 p-4">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${s.chip}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[type] || ICONS.info} />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#1C1C1A]">{title || s.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6B655A]">{message}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="shrink-0 rounded-full p-1 text-[#6B655A]/40 transition-colors hover:bg-black/5 hover:text-[#6B655A]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* progress bar — sisa waktu tampil */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: DURATION / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-0.5 w-full origin-left ${s.bar}`}
      />
    </motion.div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', title) => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p.slice(-3), { id, message, type, title }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), DURATION)
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed right-4 top-20 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.id} {...t} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
