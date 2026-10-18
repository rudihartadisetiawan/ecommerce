'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navigation from '../../components/shop/Navigation'
import HeroSection from '../../components/shop/HeroSection'
import ProductCard from '../../components/shop/ProductCard'
import Footer from '../../components/shop/Footer'
import Container from '../../components/ui/Container'
import Button from '../../components/ui/Button'
import { ProductGridSkeleton } from '../../components/ui/Skeleton'

gsap.registerPlugin(ScrollTrigger)

// Scroll reveal hook
function useScrollReveal() {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
        }
      )
    })
    return () => ctx.revert()
  }, [])
  return ref
}

const TICKER_ITEMS = [
  'GARANSI TUKAR SIZE 7 HARI',
  'HEAVYWEIGHT COTTON 220 GSM',
  'SAMEDAY & REGULER SHIPPING',
  'JAHITAN RANTAI DOUBLE-STITCH',
  'BOX-FIT PROPORTION',
  'ANTI-SHRINK TREATMENT',
]

const SPECS = [
  {
    code: '01 / FABRIC',
    title: '220 GSM Combed Heavy',
    desc: 'Bahan padat dan tidak menerawang, tetap sejuk di iklim tropis berkat sirkulasi serat katun murni.',
  },
  {
    code: '02 / FIT',
    title: 'Signature Relaxed Fit',
    desc: 'Siluet drop-shoulder proporsional untuk postur tubuh lokal, nyaman bergerak tanpa terasa kebesaran.',
  },
  {
    code: '03 / CRAFT',
    title: 'Double-Stitch Collar',
    desc: 'Rib leher rajut rapat dengan pengunci jahitan ganda agar tidak mudah melar setelah puluhan kali cuci.',
  },
]

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [tentang, setTentang] = useState(null)
  const koleksiRef = useScrollReveal()
  const categoryRef = useScrollReveal()
  const marqueeRef = useRef(null)
  const tentangRef = useScrollReveal()

  useEffect(() => {
    // Ambil konten homepage (kategori + tentang)
    fetch('/api/content')
      .then((r) => r.json())
      .then((blocks) => {
        for (const b of blocks) {
          if (b.key === 'kategori-pilihan') setCategories(b.data?.categories || [])
          if (b.key === 'tentang-gaul') setTentang(b.data)
        }
      })
      .catch(() => {})

    // Ambil produk featured dulu — fallback ke produk terbaru
    fetch('/api/products?featured=true&limit=10')
      .then((r) => r.json())
      .then((d) => {
        const featured = Array.isArray(d) ? d : d.products || []
        if (featured.length >= 5) {
          setProducts(featured)
          setLoading(false)
        } else {
          fetch('/api/products?limit=10')
            .then((r2) => r2.json())
            .then((d2) => {
              setProducts(Array.isArray(d2) ? d2 : d2.products || [])
              setLoading(false)
            })
            .catch(() => setLoading(false))
        }
      })
      .catch(() => {
        fetch('/api/products?limit=10')
          .then((r2) => r2.json())
          .then((d2) => {
            setProducts(Array.isArray(d2) ? d2 : d2.products || [])
            setLoading(false)
          })
          .catch(() => setLoading(false))
      })
  }, [])

  // Marquee infinite scroll
  useEffect(() => {
    if (!marqueeRef.current) return
    const ctx = gsap.context(() => {
      const width = marqueeRef.current.scrollWidth / 2
      gsap.to(marqueeRef.current, {
        x: -width,
        duration: 25,
        ease: 'none',
        repeat: -1,
      })
    }, marqueeRef)
    return () => ctx.revert()
  }, [])

  return (
    <>
      <Navigation />
      <HeroSection />

      {/* Brand Value Ticker Strip (Functional & Punchy) */}
      <section className="border-y border-black/10 bg-[#161614] py-3 text-white overflow-hidden">
        <div
          ref={marqueeRef}
          className="flex items-center gap-8 whitespace-nowrap will-change-transform"
          style={{ width: 'fit-content' }}
        >
          {[...Array(2)].flatMap(() => TICKER_ITEMS).map((item, idx) => (
            <div key={idx} className="flex items-center gap-8">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#E0DDD5]">
                {item}
              </span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            </div>
          ))}
        </div>
      </section>

      {/* Koleksi Terbaru */}
      <section id="koleksi" className="py-20 sm:py-28">
        <Container>
          <div ref={koleksiRef}>
            <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
                  <span>CATALOGUE DROP</span>
                  <span>/</span>
                  <span className="text-[var(--color-text-secondary)]">2026</span>
                </div>
                <h2 className="mt-2 font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
                  Rilisan Teranyar
                </h2>
                <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)] sm:text-base">
                  Siluet rileks, material katun tebal anti-gerah, disiapkan untuk rotasi pakaian harian Anda.
                </p>
              </div>

              <Link
                href="/produk"
                className="hidden items-center gap-2 border-b border-black/20 pb-1 font-mono text-xs uppercase tracking-wider text-[var(--color-text-primary)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:inline-flex"
              >
                Lihat Semua ({products.length} Artikel)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Product grid — Compact 5-column layout */}
            {loading ? (
              <ProductGridSkeleton count={10} />
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-4 lg:gap-y-8">
                {products.slice(0, 10).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Mobile: see all button */}
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/produk"
                className="inline-flex items-center justify-center rounded-lg border border-black/15 bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--color-text-primary)] shadow-xs"
              >
                Buka Katalog Lengkap
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Category Editorial Grid — Compact & Proportionate */}
      <section className="border-t border-black/5 bg-[var(--color-bg-section)] py-16 sm:py-20">
        <Container>
          <div ref={categoryRef}>
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
                  SERIES / DIVISION
                </span>
                <h2 className="mt-1.5 font-[var(--font-display)] text-2xl tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
                  Kategori Pilihan
                </h2>
              </div>
              <p className="max-w-md text-xs text-[var(--color-text-secondary)] sm:text-sm">
                Temukan siluet yang sesuai dengan kebutuhan aktivitas harian Anda.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(categories.length > 0 ? categories : []).map((cat, i) => (
                <motion.div
                  key={cat.slug || cat.id || i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <Link
                    href={`/produk?cat=${cat.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white p-2 transition-all duration-300 hover:border-black/30 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#E6E2D8]">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <span className="absolute top-2 left-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9px] uppercase text-white backdrop-blur-xs">
                        DIV. 0{i + 1}
                      </span>
                    </div>

                    <div className="mt-2.5 px-1 pb-0.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-[var(--font-display)] text-base text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
                          {cat.name}
                        </h3>
                        <span className="font-mono text-[11px] text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
                          EXPLORE &rarr;
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                        {cat.desc}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Tentang GAUL & Spesifikasi Material */}
      <section id="tentang" className="border-t border-black/5 py-20 sm:py-28">
        <Container>
          <div ref={tentangRef} className="space-y-16">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Image side */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#E6E2D8] lg:col-span-5">
                <Image
                  src={
                    tentang?.image ||
                    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop'
                  }
                  alt="Tentang GAUL"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 rounded border border-white/20 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-xs">
                  DAILY WEAR ARCHIVE
                </div>
              </div>

              {/* Story side */}
              <div className="lg:col-span-7 lg:pl-6">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
                  <span>MANIFESTO</span>
                  <span>/</span>
                  <span>STANDAR KUALITAS</span>
                </div>

                <h2 className="mt-3 font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
                  {tentang?.title || 'Bukan Sekadar Pakaian Kasual.'}
                </h2>

                <p className="mt-6 text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
                  {tentang?.paragraph1 ||
                    'Kami menolak pakaian kasual yang tipis menerawang, menyusut setelah dua kali pencucian, atau kerah yang cepat bergelombang. GAUL dirancang dengan kompromi nol antara ketahanan serat dan kenyamanan cuaca tropis.'}
                </p>

                <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
                  {tentang?.paragraph2 ||
                    'Setiap pola dirancang unisex dengan potongan bahu proporsional. Siap dipakai berulang tanpa kehilangan karakter aslinya.'}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button href={tentang?.ctaLink || '/produk'} variant="primary">
                    {tentang?.ctaText || 'Jelajahi Semua Produk'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Spec / Quality Pillars (Replaces generic buzzwords with real apparel specs) */}
            <div className="grid gap-6 border-t border-black/10 pt-12 sm:grid-cols-3">
              {SPECS.map((spec, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-black/5 bg-[var(--color-bg-section)]/50 p-6"
                >
                  <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-accent)]">
                    {spec.code}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">
                    {spec.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {spec.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  )
}
