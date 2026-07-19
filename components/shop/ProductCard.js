'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function ProductCard({ product }) {
  const images = product.images || []
  const primaryImage = product.image || images[0] || ''
  const secondaryImage = images[1] || primaryImage

  return (
    <Link href={`/produk/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[var(--color-bg-section)]">
        {/* Primary image */}
        {primaryImage && (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
          />
        )}
        {/* Secondary image (revealed on hover) */}
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.name} alt`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-all duration-700 ease-out opacity-0 scale-105 group-hover:scale-100 group-hover:opacity-100"
          />
        )}
        {/* Category pill */}
        <span className="absolute top-3 left-3 z-10 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {product.category}
        </span>
        {/* Out of Stock overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="rounded-full bg-red-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
              Stok Habis
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
          {product.name}
        </h3>
        <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
          Rp{product.price?.toLocaleString('id-ID')}
        </p>
        {/* Color dots */}
        {product.colors?.length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.hex}
                className="h-3 w-3 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
