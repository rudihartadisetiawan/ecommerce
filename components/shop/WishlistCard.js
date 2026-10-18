'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { useToast } from '@/components/ui/Toast'

// Kartu produk khusus wishlist: gambar + hapus (hati) + Tambah ke Keranjang.
export default function WishlistCard({ product, onRemove }) {
  const { addItem } = useCart()
  const addToast = useToast()

  const images = product.images || []
  const img = product.image || images[0] || ''
  const out = product.stock <= 0

  // TODO: untuk produk dengan banyak varian, pemilihan ukuran/warna default ini
  // sebaiknya diarahkan ke halaman produk dulu (sama seperti alur add-to-cart).
  const handleAdd = () => {
    if (out) return
    const size = typeof product.sizes?.[0] === 'string'
      ? product.sizes[0]
      : product.sizes?.[0]?.name || 'M'
    addItem(product, size, product.colors?.[0])
    addToast(`"${product.name}" masuk ke keranjang.`, 'success')
  }

  return (
    <div className="group">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[var(--color-bg-section)]">
        <Link href={`/produk/${product.slug}`} aria-label={product.name}>
          {img && (
            <Image
              src={img}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}
        </Link>

        {/* Hapus dari wishlist */}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Hapus ${product.name} dari wishlist`}
          className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--color-accent)] shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </button>

        {out && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            Stok Habis
          </span>
        )}
      </div>

      <div className="mt-3 px-0.5">
        <Link
          href={`/produk/${product.slug}`}
          className="block truncate text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:text-[var(--color-accent)]"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
          Rp{product.price?.toLocaleString('id-ID')}
        </p>
        <button
          type="button"
          onClick={handleAdd}
          disabled={out}
          className={`mt-3 w-full rounded-full bg-[var(--color-text-primary)] px-4 py-2.5 text-xs font-medium text-white transition-all hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-section)] disabled:text-[var(--color-text-secondary)] disabled:hover:brightness-100`}
        >
          {out ? 'Stok Habis' : 'Tambah ke Keranjang'}
        </button>
      </div>
    </div>
  )
}