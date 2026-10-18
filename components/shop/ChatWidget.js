'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'

// ponytail: halaman auth — chat disembunyikan agar tidak mengganggu form login/registrasi.
const hiddenPaths = ['/account/login', '/account/register']

// ponytail: wrapper kecil — hanya 1 hook, return null atau render ChatWidget. Mencegah hooks mismatch.
export function ChatWidgetWrapper() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  if (hiddenPaths.includes(pathname)) return null
  if (status !== 'authenticated' || (session?.user?.role !== 'admin' && session?.user?.role !== 'super_admin')) {
    return <ChatWidget />
  }
  return null
}

// ponytail: string ID prefix agar tidak collate dengan integer ID dari DB
const initialMockMessages = [
  { id: 'mock-1', sender: 'admin', text: 'Halo! Selamat datang di GAUL. Ada yang bisa kami bantu seputar ukuran atau stok produk?', time: '14:00', messageType: 'text' },
]

const quickQuestions = [
  'Apakah stok produk ini ready?',
  'Berapa lama estimasi pengiriman?',
  'Bagaimana cara cek ukuran yang pas?',
]

function formatRupiah(n) {
  if (typeof n !== 'number') return ''
  return 'Rp ' + n.toLocaleString('id-ID')
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-secondary)]"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function ProductPickerModal({ open, onClose, onPick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const url = query.trim()
          ? `/api/products?q=${encodeURIComponent(query.trim())}`
          : `/api/products`
        const res = await fetch(url)
        if (res.ok) { const data = await res.json(); setResults(Array.isArray(data) ? data : (data.products || [])) }
      } catch {} finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query, open])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-bg-section)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Bagikan Produk ke CS</h3>
            <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="border-b border-[var(--color-bg-section)] p-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Cari produk yang ingin ditanyakan..."
              className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-bg-warm)]/50 px-4 py-2.5 text-xs outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto p-3">
            {loading ? (
              <p className="py-8 text-center text-xs text-[var(--color-text-secondary)]">Mencari produk…</p>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-xs text-[var(--color-text-secondary)]">Tidak ada produk ditemukan</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {results.map(p => {
                  const img = Array.isArray(p.images) ? p.images[0] : p.image
                  return (
                    <button
                      key={p.id}
                      onClick={() => onPick(p)}
                      className="group flex flex-col items-stretch overflow-hidden rounded-xl border border-[var(--color-bg-section)] bg-white text-left transition-all hover:border-[var(--color-accent)] hover:shadow-md"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-[var(--color-bg-section)]">
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-[var(--color-text-primary)]">{p.name}</p>
                        <p className="mt-1 text-[11px] font-bold text-[var(--color-accent)]">{formatRupiah(p.price)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ProductCard({ product }) {
  if (!product) {
    return <p className="leading-relaxed text-[var(--color-text-secondary)] italic">Produk tidak tersedia</p>
  }
  const img = Array.isArray(product.images) ? product.images[0] : product.image
  return (
    <div className="space-y-2">
      {img && (
        <div className="overflow-hidden rounded-xl bg-[var(--color-bg-section)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={product.name} className="h-32 w-full object-cover" />
        </div>
      )}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">{product.category}</p>
        <p className="mt-0.5 text-xs font-semibold leading-snug">{product.name}</p>
        <p className="mt-1 text-xs font-bold text-[var(--color-accent)]">{formatRupiah(product.price)}</p>
        <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">
          Stok: {product.stock > 0 ? product.stock : 'Habis'}
        </p>
      </div>
      <a
        href={`/products/${product.slug}`}
        className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-full bg-[var(--color-text-primary)] py-1.5 text-[10px] font-semibold text-white hover:bg-[var(--color-accent)] transition-colors"
      >
        Lihat Produk →
      </a>
    </div>
  )
}

export default function ChatWidget() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(initialMockMessages)
  const [inputText, setInputText] = useState('')
  const [unreadCount, setUnreadCount] = useState(1)
  const [isAdminTyping, setIsAdminTyping] = useState(false)
  const [adminOnline, setAdminOnline] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const lastTypingSentRef = useRef(0)

  // Load initial messages — prepend mock greeting only if no messages from API
  const loadInitial = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      const res = await fetch('/api/chat')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          if (data.length === 0) setMessages(initialMockMessages)
          else setMessages([initialMockMessages[0], ...data])
        }
      }
    } catch {}
  }, [status])

  // ponytail: poll admin online status — setiap 30 detik + saat mount.
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/chat/admin-status')
        if (res.ok) {
          const data = await res.json()
          setAdminOnline(!!data.online)
        }
      } catch {}
    }
    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Poll — fetch messages WITHOUT prepending mock greeting (mencegah duplikasi)
  const pollMessages = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      const res = await fetch('/api/chat')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newOnes = data.filter(m => !existingIds.has(m.id))
            if (newOnes.length === 0) return prev
            // Keep mock greeting if present, append only new messages at correct positions
            const mock = prev.find(m => m.id === 'mock-1')
            const rest = prev.filter(m => m.id !== 'mock-1')
            const merged = [...rest, ...newOnes].sort((a, b) => a.id - b.id)
            return mock ? [mock, ...merged] : merged
          })
        }
      }
    } catch {}
  }, [status])

  // ponytail: SSE for real-time; fall back to polling if EventSource unavailable.
  useEffect(() => {
    if (status !== 'authenticated') return
    if (typeof window === 'undefined' || !window.EventSource) {
      loadInitial()
      const interval = setInterval(pollMessages, 4000)
      return () => clearInterval(interval)
    }

    loadInitial()

    const es = new EventSource('/api/chat/stream')
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data)
        if (payload.type === 'message') {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.data.id)) return prev
            return [...prev, payload.data]
          })
        } else if (payload.type === 'typing' && payload.sender === 'admin') {
          setIsAdminTyping(payload.isTyping)
        }
      } catch {}
    }
    es.onerror = () => {
      // ponytail: browser auto-reconnects; close only if explicitly closed.
    }

    return () => es.close()
  }, [status, loadInitial, pollMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      scrollToBottom()
    }
  }, [isOpen, messages, isAdminTyping])

  const sendTyping = useCallback((isTyping) => {
    if (status !== 'authenticated') return
    const now = Date.now()
    if (isTyping && now - lastTypingSentRef.current < 1500) return
    lastTypingSentRef.current = now
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationUserId: Number(session.user.id), isTyping }),
    }).catch(() => {})
  }, [status, session])

  const handleInputChange = (e) => {
    setInputText(e.target.value)
    if (status !== 'authenticated') return
    sendTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000)
  }

  const handleSend = async (textToSend) => {
    const content = textToSend || inputText
    if (!content.trim()) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

    const userMsg = {
      id: Date.now(),
      sender: 'customer',
      text: content.trim(),
      time: timeStr,
      messageType: 'text',
    }

    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInputText('')

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    sendTyping(false)

    if (status === 'authenticated') {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content.trim() }),
        })
        if (res.ok) {
          const data = await res.json()
          // Remove optimistic placeholder + any SSE-arrived duplicate (same real id),
          // then add the real message once. This handles all race conditions:
          // SSE before response → SSE message removed + re-added; SSE after → id match skips.
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== userMsg.id && m.id !== data.id)
            return [...filtered, { ...data, text: data.text || content.trim() }]
          })
        }
      } catch {}
    } else {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'admin',
            text: 'Terima kasih atas pesan Anda! Silakan masuk ke akun Anda agar tim CS kami dapat membalas pesan secara personal.',
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            messageType: 'text',
          },
        ])
      }, 1200)
    }
  }

  const handleShareProduct = async (product) => {
    setPickerOpen(false)
    if (status !== 'authenticated') return
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      if (res.ok) {
        const data = await res.json()
        // Dedup: remove any SSE-arrived copy before adding, prevents double append
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev // SSE already added it
          return [...prev, { ...data, text: data.text || product.name }]
        })
      }
    } catch {}
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-text-primary)] text-white shadow-2xl hover:brightness-125 transition-all"
        aria-label="Live Chat CS"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.596.596 0 0 1-.743-.65 4.35 4.35 0 0 1 .906-2.008A8.04 8.04 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </motion.svg>
          )}
        </AnimatePresence>

        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-18 right-0 w-[90vw] max-w-[380px] overflow-hidden rounded-3xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-bg-section)] bg-[var(--color-text-primary)] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white shadow-inner">
                  CS
                  <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--color-text-primary)] transition-colors duration-500 ${
                    adminOnline ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold">GAUL Customer Support</h3>
                  {adminOnline ? (
                    <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online · Siap Membantu
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
                      Offline · Respon maks. 1×24 jam
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-[var(--color-bg-warm)]/40">
              {messages.map((m) => {
                const isAdmin = m.sender === 'admin'
                const isProduct = m.messageType === 'product'
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                        isAdmin
                          ? 'bg-white text-[var(--color-text-primary)] border border-[var(--color-bg-section)] rounded-tl-none'
                          : 'bg-[var(--color-text-primary)] text-white rounded-tr-none'
                      }`}
                    >
                      {isProduct ? (
                        <ProductCard product={m.metadata?.product} />
                      ) : (
                        <p className="leading-relaxed">{m.text}</p>
                      )}
                      <span
                        className={`mt-1 block text-[9px] ${
                          isAdmin ? 'text-[var(--color-text-secondary)]' : 'text-white/70'
                        }`}
                      >
                        {m.time}
                      </span>
                    </div>
                  </div>
                )
              })}

              {isAdminTyping && (
                <div className="flex items-start">
                  <div className="rounded-2xl rounded-tl-none border border-[var(--color-bg-section)] bg-white px-4 py-2.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <TypingDots />
                      <span className="text-[10px] text-[var(--color-text-secondary)]">CS sedang mengetik…</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && (
              <div className="border-t border-[var(--color-bg-section)] bg-white p-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="whitespace-nowrap rounded-full bg-[var(--color-bg-section)] px-3 py-1 text-[10px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)] hover:text-white transition-all flex-shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-[var(--color-bg-section)] bg-white p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Ketik pesan untuk CS..."
                  className="flex-1 rounded-full border border-[var(--color-text-secondary)]/20 bg-[var(--color-bg-warm)]/60 px-4 py-2 text-xs outline-none focus:border-[var(--color-accent)]"
                />
                {status === 'authenticated' && (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-text-secondary)]/20 bg-white text-[var(--color-text-primary)] transition-all hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
                    title="Bagikan Produk"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                    </svg>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-text-primary)] text-white transition-all hover:bg-[var(--color-accent)] disabled:opacity-40"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handleShareProduct} />
    </div>
  )
}
