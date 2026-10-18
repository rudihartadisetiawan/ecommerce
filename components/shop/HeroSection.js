'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Container from '../ui/Container'

gsap.registerPlugin(ScrollTrigger)

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=1600&fit=crop'
const EASE = [0.22, 1, 0.36, 1]
const MICRO = 'text-[10px] font-medium uppercase tracking-[0.32em]'

function formatRupiah(n) {
  if (typeof n !== 'number') return ''
  return 'Rp' + n.toLocaleString('id-ID')
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

export default function HeroSection() {
  const heroRef = useRef(null)
  const copyRef = useRef(null)
  const plateRef = useRef(null)
  const cardsRef = useRef(null)

  const [hero, setHero] = useState(null)
  const [products, setProducts] = useState([])
  const [ready, setReady] = useState(false)
  const [edition, setEdition] = useState('')
  const [issueNumber, setIssueNumber] = useState('')
  const [reduced, setReduced] = useState(false)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const now = new Date()
    setEdition(new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now))
    setIssueNumber(pad2(now.getMonth() + 1))

    const unique = (arr) => {
      const seen = new Set()
      return arr.filter((p) => {
        const k = p.image || `id-${p.id}`
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
    }

    const load = async () => {
      try {
        const heroData = await fetch('/api/hero').then((r) => r.json())
        const h = Array.isArray(heroData) ? heroData[0] : heroData

        // Kurasi: produk featured dulu; fallback ke produk terbaru — selalu unik per gambar.
        const featRes = await fetch('/api/products?featured=true&limit=12').then((r) => r.json())
        let pool = Array.isArray(featRes) ? featRes : (featRes.products || [])
        if (unique(pool).length < 3) {
          const latestRes = await fetch('/api/products?limit=24').then((r) => r.json())
          const latest = Array.isArray(latestRes) ? latestRes : (latestRes.products || [])
          pool = [...pool, ...latest]
        }

        const seen = new Set()
        if (h?.imageUrl) seen.add(h.imageUrl) // jangan tampilkan foto yang sama dengan cover
        const picked = []
        for (const p of pool) {
          const k = p.image || `id-${p.id}`
          if (seen.has(k) || !p.image) continue
          seen.add(k)
          picked.push(p)
          if (picked.length >= 3) break
        }

        setHero(h || null)
        setProducts(picked)
        setReady(true)
      } catch {
        setReady(true)
      }
    }

    load()
  }, [])

  const title = hero?.title || 'New Collection'
  const words = title.split(' ').filter(Boolean).slice(0, 3)
  const subtext = hero?.subtitle ||
    'Casual daily outfit yang dirancang untuk keseharian kamu — nyaman, stylish, dan terasa seperti diri kamu sendiri.'
  const ctaText = hero?.ctaText || 'Lihat Koleksi'
  const ctaLink = hero?.ctaLink || '/produk'
  const coverImage = hero?.imageUrl || products[0]?.image || FALLBACK_COVER

  // Scroll storytelling tetap: parallax saat hero keluar viewport (bukan crossfade full-bleed).
  useEffect(() => {
    if (!ready || reduced || !heroRef.current) return

    const ctx = gsap.context(() => {
      const st = { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true }
      if (plateRef.current) gsap.to(plateRef.current, { scale: 1.06, ease: 'none', scrollTrigger: st })
      if (copyRef.current) gsap.to(copyRef.current, { y: -56, opacity: 0.85, ease: 'none', scrollTrigger: st })
      if (cardsRef.current) gsap.to(cardsRef.current, { y: -28, ease: 'none', scrollTrigger: st })
    }, heroRef)

    return () => ctx.revert()
  }, [ready, reduced])

  return (
    <section
      ref={heroRef}
      className="relative h-[100svh] w-full overflow-hidden bg-[var(--color-bg-warm)]"
    >
      {/* Piringan cover — satu foto editorial (dari CMS), sudut tajam, full-height kanan (desktop) */}
      <div
        ref={plateRef}
        className="absolute left-0 right-0 top-[54%] -bottom-8 overflow-hidden lg:left-auto lg:right-0 lg:top-[-2rem] lg:w-[54%]"
      >
        <Image
          src={coverImage}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 54vw"
          className="object-cover [filter:grayscale(0.45)_contrast(1.03)_brightness(1.02)]"
        />

        {/* Duotone warm — menyatukan cover dengan palet brand */}
        <div className="pointer-events-none absolute inset-0 bg-[var(--color-accent-dark)]/25 mix-blend-multiply" />
        <div className="pointer-events-none absolute inset-0 bg-[var(--color-accent)]/10 mix-blend-overlay" />

        {/* Seam: lebur ke kanvas warm */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--color-bg-warm)] to-transparent lg:hidden" />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-52 bg-gradient-to-r from-[var(--color-bg-warm)] via-[var(--color-bg-warm)]/60 to-transparent lg:block" />
      </div>

      {/* Scrim atas agar nav (teks ink) tetap terbaca di atas foto (desktop) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden h-28 bg-gradient-to-b from-[var(--color-bg-warm)] to-transparent lg:block" />

      {/* Label edisi vertikal — rail editorial kiri (desktop) */}
      <div className="absolute left-3 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
        <span className="block rotate-180 text-[10px] uppercase tracking-[0.4em] text-[var(--color-text-secondary)] [writing-mode:vertical-rl]">
          GAUL — Edisi {edition}
        </span>
      </div>

      {/* Baris atas: edisi + nomor lookbook di atas hairline (desktop) */}
      <div className="absolute inset-x-0 top-0 z-30 hidden lg:block">
        <Container>
          <div className="pt-24">
            <div className={`flex items-center justify-between ${MICRO} text-[var(--color-text-secondary)]`}>
              <span>Edisi {edition}</span>
              <span>Lookbook № {issueNumber}</span>
            </div>
            <motion.div
              className="mt-4 h-px w-full origin-left bg-[var(--color-text-primary)]/15"
              initial={prefersReduced ? false : { scaleX: 0 }}
              animate={prefersReduced ? false : { scaleX: 1 }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
            />
          </div>
        </Container>
      </div>

      {/* Copy utama */}
      <Container className="relative z-10 h-full">
        <div
          ref={copyRef}
          className="flex h-[54%] flex-col justify-center pb-4 pt-20 lg:h-full lg:w-[46%] lg:justify-start lg:pb-0 lg:pr-12 lg:pt-40"
        >
          <motion.div
            className="mb-5 flex items-center gap-3"
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={prefersReduced ? false : { opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="h-2 w-2 bg-[var(--color-accent)]" />
            <span className={`${MICRO} text-[var(--color-text-secondary)]`}>Koleksi Terbaru</span>
          </motion.div>

          <h1 className="font-[var(--font-display)] text-[clamp(2.75rem,10vw,4.5rem)] uppercase leading-[0.9] tracking-[-0.02em] text-[var(--color-text-primary)] lg:text-[clamp(3.5rem,5vw,6rem)]">
            {words.map((w, i) => (
              <span key={`${w}-${i}`} className="block overflow-hidden pb-1">
                <motion.span
                  className="block"
                  initial={prefersReduced ? false : { y: '115%' }}
                  animate={prefersReduced ? false : { y: 0 }}
                  transition={{ delay: 0.25 + i * 0.1, duration: 0.9, ease: EASE }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className="mt-6 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base"
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
          >
            {subtext}
          </motion.p>

          <motion.div
            className="mt-9 flex items-center gap-6"
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
          >
            <Link
              href={ctaLink}
              className="group inline-flex items-center gap-3 bg-[var(--color-text-primary)] px-7 py-4 text-[11px] font-medium uppercase tracking-[0.25em] text-white transition-colors hover:bg-[var(--color-accent-dark)]"
            >
              {ctaText}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#koleksi"
              className="group relative hidden text-[11px] font-medium uppercase tracking-[0.25em] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] sm:inline-block"
            >
              Telusuri
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[var(--color-text-primary)] transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          </motion.div>
        </div>
      </Container>

      {/* Trio produk terkurasi — kartu editorial 3:4 (desktop) */}
      {products.length > 0 && (
        <div className="absolute inset-x-0 bottom-10 z-20 hidden lg:block">
          <Container>
            <div ref={cardsRef} className="flex items-end gap-8">
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={prefersReduced ? false : { opacity: 0, y: 24 }}
                  animate={prefersReduced ? false : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 + i * 0.12, duration: 0.7, ease: EASE }}
                >
                  <Link href={`/produk/${p.slug}`} className="group block w-[132px]">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-bg-section)]">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="132px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="pointer-events-none absolute inset-0 border border-[var(--color-text-primary)]/10 transition-colors group-hover:border-[var(--color-text-primary)]/30" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-[var(--font-display)] text-sm leading-none text-[var(--color-text-primary)]">{pad2(i + 1)}</span>
                      <span className="h-px flex-1 bg-[var(--color-text-primary)]/15" />
                    </div>
                    <p className="mt-2 text-xs font-medium leading-snug text-[var(--color-text-primary)]">{p.name}</p>
                    <p className="mt-0.5 text-[11px] tracking-wide text-[var(--color-text-secondary)]">{formatRupiah(p.price)}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Container>
        </div>
      )}
    </section>
  )
}
