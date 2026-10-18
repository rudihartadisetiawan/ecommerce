'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const quickReplies = [
  'Stok ready kak, silakan langsung di-checkout sebelum kehabisan!',
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
          className="h-1.5 w-1.5 rounded-full bg-current"
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
          <div className="flex items-center justify-between border-b border-[#EEEBE4] p-4">
            <h3 className="text-sm font-semibold text-[#1C1C1A]">Pilih Produk untuk Dibagikan</h3>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9C9589] hover:bg-[#F5F4F1] hover:text-[#1C1C1A] transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="border-b border-[#EEEBE4] p-3">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9C9589]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                placeholder="Cari produk berdasarkan nama..."
                className="w-full rounded-xl border border-[#EEEBE4] bg-[#FAFAF9] py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#D4A373] focus:bg-white"
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-3">
            {loading ? (
              <p className="py-8 text-center text-xs text-[#9C9589]">Mencari produk…</p>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#9C9589]">Tidak ada produk ditemukan</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {results.map(p => {
                  const img = Array.isArray(p.images) ? p.images[0] : p.image
                  return (
                    <button
                      key={p.id}
                      onClick={() => onPick(p)}
                      className="group flex flex-col items-stretch overflow-hidden rounded-xl border border-[#EEEBE4] bg-white text-left transition-all hover:border-[#D4A373] hover:shadow-md"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-[#F5F4F1]">
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-[#1C1C1A]">{p.name}</p>
                        <p className="mt-1 text-[11px] font-bold text-[#B8874F]">{formatRupiah(p.price)}</p>
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
    <div className="w-44 space-y-2">
      {img && (
        <div className="overflow-hidden rounded-lg bg-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={product.name} className="h-24 w-full object-cover" />
        </div>
      )}
      <div>
        <p className="text-[9px] uppercase tracking-wider opacity-70">{product.category}</p>
        <p className="mt-0.5 text-xs font-semibold leading-snug">{product.name}</p>
        <p className="mt-1 text-xs font-bold">{formatRupiah(product.price)}</p>
      </div>
      <a
        href={`/produk/${product.slug}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#1C1C1A] py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#D4A373]"
      >
        Lihat Produk →
      </a>
    </div>
  )
}

function ConvAvatar({ initials, active = false }) {
  return (
    <div className="shrink-0">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
        active ? 'bg-[#1C1C1A] text-white' : 'bg-[#EFE7DA] text-[#6B4F2A]'
      }`}>
        {initials}
      </div>
    </div>
  )
}

export default function AdminChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Guard: redirect non-admin via useEffect — semua hooks HARUS tetap dipanggil
  // (Rules of Hooks: jangan ada early return di tengah)
  const [guardOk, setGuardOk] = useState(false)
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'admin' || session?.user?.role === 'super_admin') {
        setGuardOk(true)
      } else {
        router.push('/')
      }
    } else if (status === 'unauthenticated') {
      router.push('/account/login')
    }
  }, [status, session, router])

  const [conversations, setConversations] = useState([])
  const [messagesByConv, setMessagesByConv] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState('')
  const [inputText, setInputText] = useState('')
  const [isCustomerTyping, setIsCustomerTyping] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mobileOpenChat, setMobileOpenChat] = useState(false)
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
              ? {
                  ...c,
                  lastMessage: payload.data.text || c.lastMessage,
                  lastTime: payload.data.time || c.lastTime,
                  unread: activeIdRef.current === uid ? 0 : (c.unread || 0) + 1,
                }
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
    setMobileOpenChat(true)
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

  // Jangan render apa-apa sampai guard selesai
  if (!guardOk) return <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8 lg:px-12"><p className="text-sm text-[#9C9589]">Memuat...</p></div>

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8 lg:px-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9C9589]">Customer Service</p>
          <h1 className="mt-1.5 font-[var(--font-display)] text-2xl font-medium text-[#1C1C1A]">Live Chat</h1>
          <p className="mt-1.5 text-sm text-[#9C9589]">Balas pertanyaan pelanggan secara real-time</p>
        </div>
      </div>

      <div className="grid h-[calc(100dvh-150px)] min-h-[520px] grid-cols-1 overflow-hidden rounded-2xl border border-[#EEEBE4] bg-white shadow-sm lg:h-[calc(100vh-220px)] lg:min-h-[600px] lg:grid-cols-12">
        {/* ── Conversation List ── */}
        <div className={`${mobileOpenChat ? 'hidden' : 'flex'} min-w-0 flex-col border-r border-[#EEEBE4] bg-[#FAFAF9] lg:flex lg:col-span-4`}>
          <div className="border-b border-[#EEEBE4] px-4 py-3.5">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9C9589]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau isi pesan..."
                className="w-full rounded-xl border border-[#EEEBE4] bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#D4A373]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9C9589]">Percakapan</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#6B655A] shadow-sm">{filteredConversations.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F5F4F1]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#9C9589]">
                {conversations.length === 0 ? 'Belum ada percakapan.' : 'Percakapan tidak ditemukan.'}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = c.id === activeConv?.id
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConv(c.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                      isActive
                        ? 'bg-white shadow-[inset_3px_0_0_0_#D4A373]'
                        : 'hover:bg-[#F5F4F1]/70'
                    }`}
                  >
                    <ConvAvatar initials={c.userAvatar} active={isActive} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="truncate text-[13px] font-semibold text-[#1C1C1A]">{c.userName}</h4>
                        <span className="shrink-0 text-[10px] text-[#9C9589]">{c.lastTime}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className={`truncate text-[11px] ${c.unread > 0 ? 'font-semibold text-[#1C1C1A]' : 'text-[#9C9589]'}`}>
                          {c.lastMessage || 'Memulai percakapan…'}
                        </p>
                        {c.unread > 0 && (
                          <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Chat Pane ── */}
        <div className={`${mobileOpenChat ? 'flex' : 'hidden'} min-w-0 flex-col bg-white lg:flex lg:col-span-8`}>
          {activeConv ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-[#EEEBE4] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => setMobileOpenChat(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#EEEBE4] text-[#6B655A] transition-colors hover:bg-[#F5F4F1] lg:hidden"
                    title="Kembali ke daftar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  <ConvAvatar initials={activeConv.userAvatar} active />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-[#1C1C1A]">{activeConv.userName}</h3>
                      {isCustomerTyping && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F5F4F1] px-2.5 py-1 text-[10px] font-medium text-[#6B655A]">
                          <TypingDots /> mengetik
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-[#9C9589]">{activeConv.userEmail}</p>
                  </div>
                </div>
                <span className="hidden shrink-0 rounded-lg bg-[#F5F4F1] px-2.5 py-1 text-[10px] font-medium text-[#6B655A] sm:inline-flex">
                  Customer ID #{activeConv.id}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#FAFAF9] p-4 space-y-3 sm:p-5">
                {activeMessages.map((m) => {
                  const isAdmin = m.sender === 'admin'
                  const isProduct = m.messageType === 'product'
                  return (
                    <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                        {!isAdmin && (
                          <div className="mb-4 hidden shrink-0 sm:flex">
                            <ConvAvatar initials={activeConv.userAvatar} />
                          </div>
                        )}
                        <div
                          className={`text-xs ${
                            isAdmin
                              ? 'rounded-2xl rounded-br-sm bg-[#1C1C1A] text-white shadow-sm'
                              : 'rounded-2xl rounded-bl-sm border border-[#EEEBE4] bg-white text-[#1C1C1A] shadow-sm'
                          } ${isProduct ? 'p-2.5' : 'px-3.5 py-2.5'}`}
                        >
                          {isProduct ? (
                            <div>
                              <p className={`mb-2 text-[9px] font-bold uppercase tracking-wider ${isAdmin ? 'text-white/60' : 'text-[#B8874F]'}`}>
                                Produk dibagikan
                              </p>
                              <ProductMessageCard product={m.metadata?.product} />
                              <span className={`mt-2 block text-[9px] ${isAdmin ? 'text-white/60' : 'text-[#9C9589]'}`}>{m.time}</span>
                            </div>
                          ) : (
                            <>
                              <p className="leading-relaxed">{m.text}</p>
                              <span className={`mt-1 block text-[9px] ${isAdmin ? 'text-white/60' : 'text-[#9C9589]'}`}>{m.time}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isCustomerTyping && !isProduct && (
                  <div className="flex items-start">
                    <div className="hidden shrink-0 sm:flex">
                      <ConvAvatar initials={activeConv.userAvatar} />
                    </div>
                    <div className="rounded-2xl rounded-bl-sm border border-[#EEEBE4] bg-white px-4 py-2.5 text-[#6B655A] shadow-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-[#EEEBE4] bg-white">
                <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-3">
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#9C9589]">Template</span>
                  {quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendReply(qr)}
                      className="shrink-0 whitespace-nowrap rounded-lg border border-[#EEEBE4] bg-[#FAFAF9] px-3 py-1.5 text-[11px] font-medium text-[#6B655A] transition-all hover:border-[#D4A373] hover:bg-[#D4A373] hover:text-white"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendReply()
                  }}
                  className="flex items-center gap-2.5 border-t border-[#F5F4F1] p-3.5"
                >
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEEBE4] bg-white text-[#6B655A] transition-all hover:border-[#D4A373] hover:bg-[#D4A373] hover:text-white"
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
                    className="flex-1 rounded-xl border border-[#EEEBE4] bg-[#FAFAF9] px-4 py-2.5 text-xs outline-none focus:border-[#D4A373] focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1C1C1A] px-5 text-xs font-semibold text-white transition-all hover:bg-[#D4A373] disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">Kirim</span>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-xs text-[#9C9589]">
              Pilih percakapan dari daftar di sebelah kiri untuk melihat pesan.
            </div>
          )}
        </div>
      </div>

      <ProductPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handlePickProduct} />
    </div>
  )
}