'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const quickReplies = [
  'Stok ready kak, silakan langsung di-checkout sebelum kehabisan! 😊',
  'Estimasi pengiriman 2-3 hari kerja untuk wilayah Jabodetabek.',
  'Untuk BB 68kg TB 175cm kami sarankan ukuran L agar fit oversized yang pas.',
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
          ? `/api/products?q=${encodeURIComponent(query.trim())}&all=true`
          : `/api/products?all=true`
        const res = await fetch(url)
        if (res.ok) setResults(await res.json())
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
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Pilih Produk untuk Dibagikan</h3>
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
              placeholder="Cari produk berdasarkan nama..."
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

function ProductMessageCard({ product }) {
  if (!product) {
    return <p className="leading-relaxed italic opacity-80">Produk tidak tersedia</p>
  }
  const img = Array.isArray(product.images) ? product.images[0] : product.image
  return (
    <div className="space-y-2">
      {img && (
        <div className="overflow-hidden rounded-xl bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={product.name} className="h-32 w-full object-cover" />
        </div>
      )}
      <div>
        <p className="text-[10px] uppercase tracking-wider opacity-70">{product.category}</p>
        <p className="mt-0.5 text-xs font-semibold leading-snug">{product.name}</p>
        <p className="mt-1 text-xs font-bold">{formatRupiah(product.price)}</p>
      </div>
      <a
        href={`/products/${product.slug}`}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-full bg-white/20 py-1.5 text-[10px] font-semibold hover:bg-white/30 transition-colors"
      >
        Lihat Produk →
      </a>
    </div>
  )
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState([])
  const [messagesByConv, setMessagesByConv] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState('')
  const [inputText, setInputText] = useState('')
  const [isCustomerTyping, setIsCustomerTyping] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const typingTimeoutRef = useRef(null)
  const lastTypingSentRef = useRef(0)
  const messagesEndRef = useRef(null)

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat?adminList=true')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setConversations(data)
          if (!activeIdRef.current && data[0]) setActiveId(data[0].id)
        }
      }
    } catch {}
  }, [])

  const loadActiveMessages = useCallback(async (userId) => {
    if (!userId) return
    try {
      const res = await fetch(`/api/chat?userId=${userId}`)
      if (res.ok) {
        const msgs = await res.json()
        if (Array.isArray(msgs)) {
          setMessagesByConv(prev => ({ ...prev, [userId]: msgs }))
        }
      }
    } catch {}
  }, [])

  // ponytail: refs keep latest callbacks/activeId so SSE handler stays current without re-subscribing.
  const activeIdRef = useRef(activeId)
  useEffect(() => { activeIdRef.current = activeId }, [activeId])
  const loadConversationsRef = useRef(loadConversations)
  useEffect(() => { loadConversationsRef.current = loadConversations }, [loadConversations])

  // ponytail: SSE for real-time conversation + message + typing updates; polling fallback.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.EventSource) {
      loadConversationsRef.current()
      const interval = setInterval(() => loadConversationsRef.current(), 4000)
      return () => clearInterval(interval)
    }

    loadConversationsRef.current()

    const es = new EventSource('/api/chat/admin-stream')
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data)
        if (payload.type === 'newMessage') {
          const uid = Number(payload.userId)
          setMessagesByConv(prev => {
            const list = prev[uid] || []
            if (list.some(m => m.id === payload.data.id)) return prev
            return { ...prev, [uid]: [...list, payload.data] }
          })
          setConversations(prev => prev.map(c =>
            c.id === uid
              ? { ...c, lastMessage: payload.data.text, lastTime: payload.data.time, unread: 0 }
              : c
          ))
        } else if (payload.type === 'newConversation') {
          loadConversationsRef.current()
        } else if (payload.type === 'typing') {
          if (Number(payload.conversationUserId) === Number(activeIdRef.current) && payload.sender === 'customer') {
            setIsCustomerTyping(payload.isTyping)
          }
        }
      } catch {}
    }

    return () => es.close()
  }, [])

  useEffect(() => {
    if (activeId) loadActiveMessages(activeId)
  }, [activeId, loadActiveMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesByConv[activeId], isCustomerTyping])

  const activeConv = conversations.find(c => c.id === activeId) || conversations[0]
  const activeMessages = messagesByConv[activeId] || []

  const sendTyping = useCallback((isTyping) => {
    if (!activeId) return
    const now = Date.now()
    if (isTyping && now - lastTypingSentRef.current < 1500) return
    lastTypingSentRef.current = now
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationUserId: Number(activeId), isTyping }),
    }).catch(() => {})
  }, [activeId])

  const handleInputChange = (e) => {
    setInputText(e.target.value)
    sendTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000)
  }

  const handleSelectConv = (id) => {
    setActiveId(id)
    loadActiveMessages(id)
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread: 0 } : c)))
  }

  const handleSendReply = async (text) => {
    const msgText = text || inputText
    if (!msgText.trim() || !activeConv) return
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    sendTyping(false)

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText.trim(), targetUserId: activeConv.id }),
      })
    } catch {}
    if (!text) setInputText('')
    loadActiveMessages(activeConv.id)
    loadConversations()
  }

  const handlePickProduct = async (product) => {
    setPickerOpen(false)
    if (!activeConv) return
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, targetUserId: activeConv.id }),
      })
    } catch {}
    loadActiveMessages(activeConv.id)
    loadConversations()
  }

  const filteredConversations = conversations.filter(c =>
    c.userName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-text-primary)]">Live Chat CS</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Kelola & jawab pertanyaan pelanggan secara langsung</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            CS Online Active
          </span>
        </div>
      </div>

      <div className="grid h-[calc(100vh-220px)] min-h-[500px] grid-cols-1 overflow-hidden rounded-3xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] shadow-lg lg:grid-cols-12">
        <div className="border-r border-[var(--color-bg-section)] lg:col-span-4 flex flex-col bg-[var(--color-bg-warm)]/30">
          <div className="border-b border-[var(--color-bg-section)] p-3.5">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau isi pesan..."
                className="w-full rounded-xl border border-[var(--color-text-secondary)]/20 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[var(--color-accent)] shadow-sm"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-bg-section)]/60">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">
                {conversations.length === 0 ? 'Belum ada percakapan.' : 'Percakapan tidak ditemukan.'}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = c.id === activeConv?.id
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConv(c.id)}
                    className={`flex w-full items-start gap-3 p-4 text-left transition-all ${
                      isActive
                        ? 'bg-[var(--color-surface)] shadow-sm border-l-4 border-l-[var(--color-accent)]'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-text-primary)] text-xs font-bold text-white shadow-sm">
                      {c.userAvatar}
                      {c.online && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="truncate text-xs font-semibold text-[var(--color-text-primary)]">{c.userName}</h4>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">{c.lastTime}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow">
                        {c.unread}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col bg-white">
          {activeConv ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--color-bg-section)] p-4 bg-[var(--color-bg-warm)]/20">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white shadow-sm">
                    {activeConv.userAvatar}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">{activeConv.userName}</h3>
                    <p className="text-[10px] text-[var(--color-text-secondary)] flex items-center gap-1">
                      <span>{activeConv.userEmail}</span>
                      {isCustomerTyping && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-section)] px-2 py-0.5 text-[9px] font-medium text-[var(--color-text-primary)]">
                          <TypingDots /> sedang mengetik…
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--color-bg-section)] px-3 py-1 text-[10px] font-medium text-[var(--color-text-secondary)]">
                    Customer ID #{activeConv.id}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[var(--color-bg-warm)]/10">
                {activeMessages.map((m) => {
                  const isAdmin = m.sender === 'admin'
                  const isProduct = m.messageType === 'product'
                  return (
                    <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-end gap-2 max-w-[75%]">
                        {!isAdmin && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-text-secondary)]/20 text-[9px] font-bold text-[var(--color-text-primary)]">
                            {activeConv.userAvatar}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl text-xs shadow-sm ${
                            isAdmin
                              ? 'bg-[var(--color-text-primary)] text-white rounded-br-none'
                              : 'bg-white border border-[var(--color-bg-section)] text-[var(--color-text-primary)] rounded-bl-none'
                          } ${isProduct ? 'p-2' : 'px-4 py-2.5'}`}
                        >
                          {isProduct ? (
                            <div className="p-1.5">
                              <p className="mb-1.5 text-[10px] uppercase tracking-wider opacity-70">📦 Shared Product</p>
                              <ProductMessageCard product={m.metadata?.product} />
                              <span className={`mt-2 block text-[9px] ${isAdmin ? 'text-white/70' : 'text-[var(--color-text-secondary)]'}`}>
                                {m.time}
                              </span>
                            </div>
                          ) : (
                            <>
                              <p className="leading-relaxed">{m.text}</p>
                              <span className={`mt-1 block text-[9px] ${isAdmin ? 'text-white/70' : 'text-[var(--color-text-secondary)]'}`}>
                                {m.time}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isCustomerTyping && (
                  <div className="flex items-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-text-secondary)]/20 text-[9px] font-bold text-[var(--color-text-primary)]">
                      {activeConv.userAvatar}
                    </div>
                    <div className="rounded-2xl rounded-bl-none border border-[var(--color-bg-section)] bg-white px-4 py-2.5 shadow-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-[var(--color-bg-section)] bg-[var(--color-bg-warm)]/30 p-2.5 flex gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] self-center px-1">Template:</span>
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendReply(qr)}
                    className="whitespace-nowrap rounded-xl border border-[var(--color-accent)]/30 bg-white px-3 py-1.5 text-[10px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-white transition-all flex-shrink-0 shadow-2xs"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              <div className="border-t border-[var(--color-bg-section)] p-4 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendReply()
                  }}
                  className="flex items-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-text-secondary)]/20 bg-white text-[var(--color-text-primary)] transition-all hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
                    title="Share Produk"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Balas pesan pelanggan..."
                    className="flex-1 rounded-2xl border border-[var(--color-text-secondary)]/20 bg-[var(--color-bg-warm)]/50 px-4 py-3 text-xs outline-none focus:border-[var(--color-accent)] shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="flex h-10 px-5 items-center justify-center gap-2 rounded-2xl bg-[var(--color-text-primary)] text-xs font-medium text-white transition-all hover:bg-[var(--color-accent)] disabled:opacity-40 shadow-sm"
                  >
                    <span>Kirim</span>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-xs text-[var(--color-text-secondary)]">
              Pilih percakapan dari daftar di sebelah kiri untuk melihat pesan.
            </div>
          )}
        </div>
      </div>

      <ProductPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handlePickProduct} />
    </div>
  )
}
