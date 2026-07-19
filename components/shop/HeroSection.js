'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Container from '../ui/Container'
import Button from '../ui/Button'

gsap.registerPlugin(ScrollTrigger)

export default function HeroSection() {
  const wrapperRef = useRef(null)
  const stickyRef = useRef(null)
  const headlineRef = useRef(null)
  const subtextRef = useRef(null)
  const ctaRef = useRef(null)
  const imageRefs = useRef([])

  const bgRef = useRef(null)
  const [hero, setHero] = useState(null)
  const [products, setProducts] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/hero').then(r => r.json()).then(d => d[0] || null),
      fetch('/api/products').then(r => r.json()).then(d => d.slice(0, 3)),
    ])
      .then(([h, p]) => { setHero(h); setProducts(p); setReady(true) })
      .catch(() => setReady(true))
  }, [])

  const title = hero?.title || 'NEW COLLECTION'
  const words = title.split(' ')
  const subtext = hero?.subtitle || 'Casual daily outfit yang dirancang untuk keseharian kamu — nyaman, stylish, dan terasa seperti diri kamu sendiri.'
  const ctaText = hero?.ctaText || 'Lihat Koleksi'
  const ctaLink = hero?.ctaLink || '/produk'

  // GSAP scroll storytelling — NO pin, using CSS sticky instead
  useEffect(() => {
    if (!ready || !wrapperRef.current || products.length === 0) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      })

      // Background banner animation
      if (bgRef.current) {
        tl.fromTo(bgRef.current, { y: 0, scale: 1 }, { y: 100, scale: 1.08, duration: 1.5 }, 0)
      }

      // Phase 1: Headline splits apart
      const headlineWords = headlineRef.current?.querySelectorAll('.hero-word')
      if (headlineWords?.length) {
        tl.fromTo(headlineWords[0], { x: 0, opacity: 1 }, { x: -60, opacity: 0.3, duration: 1 }, 0)
        if (headlineWords[1]) {
          tl.fromTo(headlineWords[1], { x: 0, opacity: 1 }, { x: 60, opacity: 0.3, duration: 1 }, 0)
        }
      }

      // Subtitle and CTA fade out
      if (subtextRef.current) {
        tl.to(subtextRef.current, { y: -20, opacity: 0, duration: 0.5 }, 0)
      }
      if (ctaRef.current) {
        tl.to(ctaRef.current, { y: -10, opacity: 0, duration: 0.4 }, 0)
      }

      // Image transitions
      if (imageRefs.current[0]) {
        tl.fromTo(imageRefs.current[0],
          { scale: 1, opacity: 1 },
          { scale: 0.9, opacity: 0, duration: 1 }, 0.5)
      }
      if (imageRefs.current[1]) {
        tl.fromTo(imageRefs.current[1],
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1 }, 1)
        tl.to(imageRefs.current[1],
          { scale: 0.9, opacity: 0, duration: 1 }, 2)
      }
      if (imageRefs.current[2]) {
        tl.fromTo(imageRefs.current[2],
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1 }, 2)
      }

      // Phase 3: Everything comes back together
      if (headlineWords?.length) {
        tl.to(headlineWords[0], { x: 0, opacity: 1, duration: 0.8 }, 2.5)
        if (headlineWords[1]) {
          tl.to(headlineWords[1], { x: 0, opacity: 1, duration: 0.8 }, 2.5)
        }
      }
      if (subtextRef.current) {
        tl.to(subtextRef.current, { y: 0, opacity: 1, duration: 0.6 }, 2.8)
      }
      if (ctaRef.current) {
        tl.to(ctaRef.current, { y: 0, opacity: 1, duration: 0.6 }, 3.0)
      }
    }, wrapperRef)

    return () => ctx.revert()
  }, [ready, products])

  return (
    // Tall wrapper creates scroll distance; inner section sticks via CSS
    <div ref={wrapperRef} className="relative" style={{ height: '300vh' }}>
      <section
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[var(--color-bg-warm)]"
      >
        {/* Background Banner Image */}
        {hero?.imageUrl && (
          <div ref={bgRef} className="absolute inset-0 z-0 select-none pointer-events-none opacity-20">
            <Image
              src={hero.imageUrl}
              alt={title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-bg-warm)]/30 to-[var(--color-bg-warm)]" />
          </div>
        )}

        <div className="flex h-full items-center">
          <Container className="relative z-10 flex w-full flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Headline + copy */}
            <div className="flex-1 pt-20 md:pt-0">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]"
              >
                Koleksi Terbaru
              </motion.p>

              <h1
                ref={headlineRef}
                className="font-[var(--font-display)] text-5xl leading-[1.02] tracking-tight text-[var(--color-text-primary)] sm:text-6xl md:text-7xl lg:text-8xl"
              >
                {words[0] && (
                  <span className="hero-word inline-block">{words[0].toUpperCase()}</span>
                )}
                {words[1] && (
                  <>
                    <br className="hidden sm:block" />
                    <span className="hero-word inline-block">{words[1].toUpperCase()}</span>
                  </>
                )}
              </h1>

              <motion.p
                ref={subtextRef}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg"
              >
                {subtext}
              </motion.p>

              <motion.div
                ref={ctaRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-8"
              >
                <Button href={ctaLink}>{ctaText}</Button>
              </motion.div>
            </div>

            {/* Product image stack */}
            <div className="relative h-[50vh] w-full flex-shrink-0 sm:h-[60vh] lg:h-[80vh] lg:w-[45%]">
              {products.map((product, i) => (
                <div
                  key={product.id}
                  ref={(el) => (imageRefs.current[i] = el)}
                  className="absolute inset-0"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="rounded-3xl object-cover"
                  />
                  {/* Product info overlay */}
                  <div className="absolute inset-x-0 bottom-0 rounded-b-3xl bg-gradient-to-t from-black/50 via-black/20 to-transparent p-6">
                    <p className="text-sm font-medium text-white/90">{product.name}</p>
                    <p className="mt-0.5 text-xs text-white/60">
                      Rp{product.price?.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-medium tracking-[0.25em] text-[var(--color-text-secondary)]">
              SCROLL
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4 text-[var(--color-text-secondary)]"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
