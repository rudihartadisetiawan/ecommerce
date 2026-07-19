'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '../../../../components/shop/Navigation'
import ProductCard from '../../../../components/shop/ProductCard'
import Container from '../../../../components/ui/Container'
import Footer from '../../../../components/shop/Footer'
import { useCart } from '@/lib/cart-context'

function formatPrice(price) {
  return `Rp${price.toLocaleString('id-ID')}`
}

export default function ProductDetailPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [reviewsData, setReviewsData] = useState({ total: 0, avgRating: 0, reviews: [] })
  const addingRef = useRef(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products/slug/${slug}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d)
        setLoading(false)
        if (d?.id) {
          fetch(`/api/reviews?productId=${d.id}`)
            .then(r => r.json())
            .then(rd => setReviewsData(rd))
            .catch(() => {})

          if (status === 'authenticated') {
            fetch(`/api/wishlist?productId=${d.id}`)
              .then(r => r.json())
              .then(w => setWishlisted(!!w.wishlisted))
              .catch(() => {})
          }
        }
        fetch('/api/products')
          .then(r => r.json())
          .then(all => {
            const sameCat = all.filter(p => p.slug !== slug && p.category === d.category)
            const diffCat = all.filter(p => p.slug !== slug && p.category !== d.category)
            setRelated([...sameCat, ...diffCat].slice(0, 4))
          })
          .catch(() => {})
      })
      .catch(() => setLoading(false))
  }, [slug, status])

  const handleAddToCart = useCallback(() => {
    if (status !== 'authenticated') {
      router.push(`/account/login?callbackUrl=/produk/${slug}`)
      return
    }
    // ponytail: admin tidak punya akses ke cart
    const role = session?.user?.role
    if (role === 'admin' || role === 'super_admin') {
      router.push('/admin')
      return
    }
    if (addingRef.current || !selectedSize || !selectedColor) return
    addingRef.current = true
    const colorObj = product?.colors?.find(c => c.hex === selectedColor)
    addItem(product, selectedSize, { name: colorObj?.name || selectedColor, hex: selectedColor })
    setAdded(true)
    setTimeout(() => { setAdded(false); addingRef.current = false }, 2000)
  }, [selectedSize, selectedColor, product, addItem, status, session, router, slug])

  const handleToggleWishlist = async () => {
    if (status !== 'authenticated') {
      router.push(`/account/login?callbackUrl=/produk/${slug}`)
      return
    }
    if (!product?.id) return
    const prev = wishlisted
    setWishlisted(!prev)
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      const data = await res.json()
      if (typeof data.wishlisted === 'boolean') {
        setWishlisted(data.wishlisted)
      }
    } catch {
      setWishlisted(prev)
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-20"><Container><p className="text-sm text-[var(--color-text-secondary)]">Memuat...</p></Container></main>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-20">
          <Container>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Produk tidak ditemukan.</p>
              <Link href="/produk" className="mt-4 text-xs font-medium text-[var(--color-accent)] underline underline-offset-4">Lihat Koleksi</Link>
            </div>
          </Container>
        </main>
      </>
    )
  }

  const images = product.images || []
  const canAdd = selectedSize && selectedColor && product.stock > 0

  return (
    <>
      <Navigation />
      <main className="pt-20 pb-20">
        <Container>
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <Link href="/" className="hover:text-[var(--color-text-primary)]">Beranda</Link>
            <span>/</span>
            <Link href="/produk" className="hover:text-[var(--color-text-primary)]">Koleksi</Link>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">{product.name}</span>
          </div>

          <div className="lg:flex lg:gap-10 xl:gap-14">
            {/* Gallery */}
            <div className="mb-8 lg:sticky lg:top-28 lg:mb-0 lg:h-fit lg:w-[45%] xl:w-[48%]">
              {/* Mobile: horizontal scroll snap */}
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto lg:hidden">
                {images.map((img, i) => (
                  <div key={i} className="aspect-[9/11] w-[85vw] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-[var(--color-bg-section)]">
                    <Image src={img} alt={`${product.name} ${i + 1}`} width={900} height={1100} className="h-full w-full object-cover" priority={i === 0} />
                  </div>
                ))}
              </div>

              {/* Desktop: main image + thumbnails */}
              <div className="hidden lg:block">
                <div className="relative mb-3 aspect-[9/11] overflow-hidden rounded-2xl bg-[var(--color-bg-section)] group">
                  {images.map((img, i) => (
                    <div key={i} className={`absolute inset-0 transition-opacity duration-300 ${i === selectedImage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <Image src={img} alt={`${product.name} ${i + 1}`} width={900} height={1100} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" priority={i === 0} />
                    </div>
                  ))}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setSelectedImage(i)} className={`aspect-[9/11] w-1/4 overflow-hidden rounded-lg bg-[var(--color-bg-section)] transition-all duration-200 ${i === selectedImage ? 'ring-2 ring-[var(--color-accent)] ring-offset-2' : 'opacity-60 hover:opacity-100'}`}>
                        <Image src={img} alt={`${product.name} thumbnail ${i + 1}`} width={200} height={240} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail */}
            <div className="flex-1">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--color-accent)]">{product.category}</p>
              <h1 className="font-[var(--font-display)] text-3xl leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-4xl">{product.name}</h1>
              
              {/* Rating badge */}
              {reviewsData.total > 0 && (
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  <div className="flex text-amber-400 text-sm">
                    {'★'.repeat(Math.round(reviewsData.avgRating))}
                    {'☆'.repeat(5 - Math.round(reviewsData.avgRating))}
                  </div>
                  <span className="font-bold text-[var(--color-text-primary)]">{reviewsData.avgRating}</span>
                  <span className="text-[var(--color-text-secondary)]">({reviewsData.total} ulasan)</span>
                </div>
              )}

              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-2xl font-medium text-[var(--color-text-primary)]">{formatPrice(product.price)}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Stok: {product.stock}</p>
              </div>

              <p className="mt-6 leading-relaxed text-[var(--color-text-secondary)]">{product.description}</p>

              {/* Size */}
              <div className="mt-8">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Ukuran</p>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || []).map((size) => (
                    <button key={size} onClick={() => setSelectedSize(size)} className={`min-w-[48px] rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${selectedSize === size ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white' : 'border-[var(--color-text-primary)]/15 text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)]/40'}`}>{size}</button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Warna</p>
                <div className="flex flex-wrap gap-3">
                  {(product.colors || []).map((color) => (
                    <button key={color.hex} onClick={() => setSelectedColor(color.hex)} className="group relative" title={color.name}>
                      <span className={`block h-8 w-8 rounded-full transition-all duration-200 ${selectedColor === color.hex ? 'scale-110 ring-2 ring-[var(--color-accent)] ring-offset-2' : 'ring-1 ring-black/10'}`} style={{ backgroundColor: color.hex }} />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-[var(--color-text-secondary)] opacity-0 transition-opacity group-hover:opacity-100">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock info */}
              {selectedSize && selectedColor && (
                <p className={`mt-3 text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? `Stok tersedia: ${product.stock}` : 'Stok habis'}
                </p>
              )}

              {/* Actions */}
              <div className="mt-8 flex gap-3">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={!canAdd || added}
                  whileTap={canAdd ? { scale: 0.96 } : {}}
                  className={`flex-1 rounded-full px-8 py-3.5 text-sm font-medium transition-all duration-200 ${!canAdd ? 'cursor-not-allowed bg-[var(--color-text-secondary)]/20 text-[var(--color-text-secondary)]' : added ? 'bg-green-600 text-white' : 'bg-[var(--color-accent)] text-white hover:brightness-110'}`}
                >
                  {added ? 'Ditambahkan!' : 'Tambah ke Keranjang'}
                </motion.button>

                <motion.button
                  onClick={handleToggleWishlist}
                  whileTap={{ scale: 0.9 }}
                  className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border transition-colors duration-200 ${wishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-[var(--color-text-primary)]/15 text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)]/30'}`}
                  aria-label="Wishlist"
                >
                  <motion.svg animate={wishlisted ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }} xmlns="http://www.w3.org/2000/svg" fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </motion.svg>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Review Section */}
          <section className="mt-16 border-t border-[var(--color-bg-section)] pt-12">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-[var(--font-display)] text-2xl tracking-tight text-[var(--color-text-primary)]">Ulasan Pembeli</h2>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Pengalaman asli dari pembeli produk ini</p>
              </div>
              {reviewsData.total > 0 && (
                <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-bg-section)]/60 px-5 py-3">
                  <span className="text-3xl font-bold text-[var(--color-text-primary)]">{reviewsData.avgRating}</span>
                  <div>
                    <div className="flex text-amber-400 text-sm">
                      {'★'.repeat(Math.round(reviewsData.avgRating))}
                      {'☆'.repeat(5 - Math.round(reviewsData.avgRating))}
                    </div>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">{reviewsData.total} Total Ulasan</p>
                  </div>
                </div>
              )}
            </div>

            {reviewsData.reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-text-secondary)]/20 py-10 text-center">
                <p className="text-xs text-[var(--color-text-secondary)]">Belum ada ulasan untuk produk ini.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reviewsData.reviews.map((rev) => (
                  <div key={rev.id} className="rounded-2xl border border-[var(--color-bg-section)] bg-[var(--color-surface)] p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">{rev.userName}</p>
                      <div className="flex text-amber-400 text-xs">
                        {'★'.repeat(rev.rating)}
                        {'☆'.repeat(5 - rev.rating)}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">{rev.comment || 'Tidak ada ulasan tertulis.'}</p>
                    <p className="mt-3 text-[10px] text-[var(--color-text-secondary)]/60">
                      {new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-20">
              <h2 className="font-[var(--font-display)] text-2xl tracking-tight text-[var(--color-text-primary)] sm:text-3xl">Koleksi Lainnya</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Lihat juga piece lain yang mungkin cocok.</p>
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
              >
                {related.map((p) => (
                  <motion.div key={p.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}
        </Container>
      </main>

      <Footer />
    </>
  )
}