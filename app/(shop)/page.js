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
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
        }
      )
    })
    return () => ctx.revert()
  }, [])
  return ref
}

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
      .then(r => r.json())
      .then(blocks => {
        for (const b of blocks) {
          if (b.key === 'kategori-pilihan') setCategories(b.data?.categories || [])
          if (b.key === 'tentang-gaul') setTentang(b.data)
        }
      })
      .catch(() => {})

    // Coba ambil produk featured dulu — fallback ke produk terbaru kalau kosong
    fetch('/api/products?featured=true&limit=8')
      .then(r => r.json())
      .then(d => {
        const featured = Array.isArray(d) ? d : (d.products || [])
        if (featured.length >= 4) {
          setProducts(featured)
          setLoading(false)
        } else {
          fetch('/api/products?limit=8')
            .then(r2 => r2.json())
            .then(d2 => { setProducts(Array.isArray(d2) ? d2 : (d2.products || [])); setLoading(false) })
            .catch(() => setLoading(false))
        }
      })
      .catch(() => {
        fetch('/api/products?limit=8')
          .then(r2 => r2.json())
          .then(d2 => { setProducts(Array.isArray(d2) ? d2 : (d2.products || [])); setLoading(false) })
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
        duration: 30,
        ease: 'none',
        repeat: -1,
      })
    }, marqueeRef)
    return () => ctx.revert()
  }, [])

  // Featured products: first 5 for the editorial layout
  const featured = products.slice(0, 5)
  // Hero product (largest card)
  const heroProduct = featured[0]
  // Side products
  const sideProducts = featured.slice(1, 3)
  // Bottom row
  const bottomProducts = featured.slice(3, 5)

  return (
    <>
      <Navigation />
      <HeroSection />

      {/* Koleksi Terbaru — Editorial Asymmetric Grid */}
      <section id="koleksi" className="py-20 sm:py-28">
        <Container>
          <div ref={koleksiRef}>
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent)]">
                  Fresh Drop
                </p>
                <h2 className="font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
                  Koleksi Terbaru
                </h2>
                <p className="mt-3 max-w-md text-[var(--color-text-secondary)]">
                  Piece yang dirancang untuk mix & match harian — bisa dipakai
                  berulang tanpa bosan.
                </p>
              </div>
              <Link
                href="/produk"
                className="hidden items-center gap-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-dark)] sm:flex"
              >
                Lihat Semua
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Uniform premium product grid */}
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
                {products.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Mobile: see all link */}
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/produk"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]"
              >
                Lihat Semua Koleksi
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Category Highlight */}
      <section className="bg-[var(--color-bg-section)] py-20 sm:py-28">
        <Container>
          <div ref={categoryRef}>
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent)]">
                Telusuri
              </p>
              <h2 className="font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
                Kategori Pilihan
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(categories.length > 0 ? categories : []).map((cat, i) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  <Link
                    href={`/produk?cat=${cat.slug}`}
                    className="group relative block aspect-[3/4] overflow-hidden rounded-2xl"
                  >
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <h3 className="font-[var(--font-display)] text-2xl text-white">
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/70">{cat.desc}</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-white/90 transition-colors group-hover:text-[var(--color-accent)]">
                        Lihat Koleksi
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Brand marquee strip — infinite scroll */}
      <section className="overflow-hidden py-14 sm:py-20">
        <div className="flex gap-6 sm:gap-10" ref={marqueeRef} style={{ width: 'fit-content' }}>
          {[...Array(2)].flatMap(() => ['NYAMAN', '·', 'STYLISH', '·', 'BERULANG', '·', 'KAMU']).map((word, i) => (
            <span
              key={i}
              className={`whitespace-nowrap font-[var(--font-display)] ${
                word === '·'
                  ? 'text-2xl text-[var(--color-accent)] sm:text-3xl'
                  : 'text-3xl tracking-tight text-[var(--color-text-primary)]/20 sm:text-5xl lg:text-6xl'
              }`}
            >
              {word}
            </span>
          ))}
        </div>
      </section>

      {/* Tentang GAUL */}
      <section id="tentang" className="py-20 sm:py-28">
        <Container>
          <div ref={tentangRef} className="lg:flex lg:items-center lg:gap-16">
            {/* Image side */}
            <div className="relative mb-10 aspect-[4/5] w-full overflow-hidden rounded-3xl lg:mb-0 lg:w-[45%]">
              <Image
                src={tentang?.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop'}
                alt="Tentang GAUL"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Text side */}
            <div className="flex-1 lg:max-w-lg">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent)]">
                {tentang?.subtitle || 'Cerita Kami'}
              </p>
              <h2 className="font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
                {tentang?.title || 'Tentang GAUL'}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-secondary)]">
                {tentang?.paragraph1 || 'GAUL lahir dari keyakinan bahwa outfit harian harusnya nggak ribet — cukup nyaman, cukup stylish, dan cukup kamu.'}
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-secondary)]">
                {tentang?.paragraph2 || 'Koleksi kami dirancang untuk dipakai berulang, dicuci berulang, dan tetap terasa sama fresh-nya.'}
              </p>
              <div className="mt-8">
                <Button href={tentang?.ctaLink || '/produk'} variant="outline">
                  {tentang?.ctaText || 'Telusuri Koleksi'}
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  )
}
